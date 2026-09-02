#include "TimezoneHelper.hpp"

#include "core/ZoneNames.hpp"

#include <android/log.h>
#include <jni.h>

#include <chrono>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>

#define LOG_TAG "NativeDate"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// Implementation notes
//
// Offsets come from java.util.TimeZone.getOffset(long), available since API 1
// and backed by the same ICU tz data as java.time on API 26+. It already
// includes DST at the given instant, so there is no need to probe for
// java.time (which threw a ClassNotFoundException on every call on API 24-25)
// or to allocate ZoneId/Instant/ZoneRules/ZoneOffset objects per lookup.
//
// The java.util.TimeZone class and its method ids are resolved once. Resolved
// TimeZone objects are kept as global references in a small map guarded by a
// mutex; the mutex is held across the getOffset call as well, so an entry can
// never be evicted (and its global ref deleted) while another thread is using
// it. TimeZone.getOffset/getTimeZone/getID are pure library calls that cannot
// re-enter this code, so holding the lock around them is safe.

namespace margelo::nitro::rnpackages_nativedate {

// Store JavaVM reference (set during JNI_OnLoad)
static JavaVM* g_jvm = nullptr;

// Call this from JNI_OnLoad
extern "C" void TimezoneHelper_setJavaVM(JavaVM* vm) {
    g_jvm = vm;
}

namespace {

constexpr std::size_t kZoneCacheCapacity = 64;
constexpr auto kSystemZoneTtl = std::chrono::seconds(1);

// Get JNIEnv for current thread
JNIEnv* getJNIEnv() {
    if (g_jvm == nullptr) {
        LOGE("JavaVM not initialized");
        return nullptr;
    }

    JNIEnv* env = nullptr;
    int status = g_jvm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6);

    if (status == JNI_EDETACHED) {
        if (g_jvm->AttachCurrentThread(&env, nullptr) != JNI_OK) {
            LOGE("Failed to attach thread to JVM");
            return nullptr;
        }
    } else if (status != JNI_OK) {
        LOGE("Failed to get JNI environment");
        return nullptr;
    }

    return env;
}

/** Clear a pending Java exception. Returns true when one was pending. */
bool clearException(JNIEnv* env) {
    if (env->ExceptionCheck() == JNI_FALSE) {
        return false;
    }
    env->ExceptionClear();
    return true;
}

/**
 * PushLocalFrame/PopLocalFrame scope: every local reference created while the
 * frame is alive is released when it goes out of scope, on every return path.
 */
class LocalFrame {
public:
    LocalFrame(JNIEnv* env, jint capacity) : env_(env), pushed_(env->PushLocalFrame(capacity) == JNI_OK) {
        if (!pushed_) {
            clearException(env_); // PushLocalFrame raises OutOfMemoryError on failure
        }
    }
    ~LocalFrame() {
        if (pushed_) {
            env_->PopLocalFrame(nullptr);
        }
    }
    LocalFrame(const LocalFrame&) = delete;
    LocalFrame& operator=(const LocalFrame&) = delete;

    bool ok() const { return pushed_; }

private:
    JNIEnv* env_;
    bool pushed_;
};

/** java.util.TimeZone class (global ref) and method ids, resolved once per process. */
struct TimeZoneJni {
    jclass clazz = nullptr;
    jmethodID getTimeZone = nullptr;    // static TimeZone getTimeZone(String)
    jmethodID getDefault = nullptr;     // static TimeZone getDefault()
    jmethodID getAvailableIDs = nullptr; // static String[] getAvailableIDs()
    jmethodID getID = nullptr;          // String getID()
    jmethodID getOffset = nullptr;      // int getOffset(long)
    bool ok = false;
};

const TimeZoneJni& timeZoneJni(JNIEnv* env) {
    static TimeZoneJni refs;
    static std::once_flag once;
    std::call_once(once, [env] {
        jclass local = env->FindClass("java/util/TimeZone");
        if (clearException(env) || local == nullptr) {
            LOGE("java.util.TimeZone not found");
            return;
        }
        refs.clazz = static_cast<jclass>(env->NewGlobalRef(local));
        env->DeleteLocalRef(local);
        if (refs.clazz == nullptr) {
            clearException(env);
            return;
        }
        refs.getTimeZone = env->GetStaticMethodID(refs.clazz, "getTimeZone", "(Ljava/lang/String;)Ljava/util/TimeZone;");
        refs.getDefault = env->GetStaticMethodID(refs.clazz, "getDefault", "()Ljava/util/TimeZone;");
        refs.getAvailableIDs = env->GetStaticMethodID(refs.clazz, "getAvailableIDs", "()[Ljava/lang/String;");
        refs.getID = env->GetMethodID(refs.clazz, "getID", "()Ljava/lang/String;");
        refs.getOffset = env->GetMethodID(refs.clazz, "getOffset", "(J)I");
        if (clearException(env)) {
            LOGE("java.util.TimeZone method lookup failed");
            return;
        }
        refs.ok = refs.getTimeZone != nullptr && refs.getDefault != nullptr && refs.getAvailableIDs != nullptr &&
                  refs.getID != nullptr && refs.getOffset != nullptr;
    });
    return refs;
}

/** Copy a Java string. std::nullopt for null or when the VM cannot provide the bytes. */
std::optional<std::string> toStdString(JNIEnv* env, jstring value) {
    if (value == nullptr) {
        return std::nullopt;
    }
    const char* chars = env->GetStringUTFChars(value, nullptr);
    if (chars == nullptr) {
        clearException(env);
        return std::nullopt;
    }
    std::string result(chars);
    env->ReleaseStringUTFChars(value, chars);
    return result;
}

std::mutex g_zoneCacheMutex;
// IANA id -> global ref to java.util.TimeZone. Guarded by g_zoneCacheMutex.
std::unordered_map<std::string, jobject> g_zoneCache;

/**
 * TimeZone for `ianaZone` as a cached global ref, or nullptr when Android does
 * not know the id. The caller must hold g_zoneCacheMutex for the whole time it
 * uses the returned reference, and must have a LocalFrame pushed.
 */
jobject lookupZoneLocked(JNIEnv* env, const TimeZoneJni& jni, const std::string& ianaZone) {
    auto it = g_zoneCache.find(ianaZone);
    if (it != g_zoneCache.end()) {
        return it->second;
    }

    // The ASCII subset accepted here is valid modified UTF-8, which NewStringUTF requires.
    if (!nativedate::core::ZoneNames::isWellFormed(ianaZone)) {
        return nullptr;
    }
    jstring name = env->NewStringUTF(ianaZone.c_str());
    if (clearException(env) || name == nullptr) {
        return nullptr;
    }
    jobject zone = env->CallStaticObjectMethod(jni.clazz, jni.getTimeZone, name);
    if (clearException(env) || zone == nullptr) {
        return nullptr;
    }
    // TimeZone.getTimeZone() answers GMT for ids it does not know; only trust an exact echo of the id.
    jstring idValue = static_cast<jstring>(env->CallObjectMethod(zone, jni.getID));
    if (clearException(env)) {
        return nullptr;
    }
    std::optional<std::string> id = toStdString(env, idValue);
    if (!id.has_value() || *id != ianaZone) {
        return nullptr;
    }

    jobject global = env->NewGlobalRef(zone);
    if (global == nullptr) {
        clearException(env);
        return nullptr;
    }
    if (g_zoneCache.size() >= kZoneCacheCapacity) {
        // Bounded without bookkeeping: drop everything and refill on demand.
        for (auto& entry : g_zoneCache) {
            env->DeleteGlobalRef(entry.second);
        }
        g_zoneCache.clear();
    }
    g_zoneCache.emplace(ianaZone, global);
    return global;
}

} // namespace

std::string TimezoneHelper::getSystemTimezone() {
    static std::mutex mutex;
    static std::string cachedName;
    static std::chrono::steady_clock::time_point cachedAt;

    const auto now = std::chrono::steady_clock::now();
    {
        std::lock_guard<std::mutex> lock(mutex);
        if (!cachedName.empty() && now - cachedAt < kSystemZoneTtl) {
            return cachedName;
        }
    }

    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return "UTC";
    }
    LocalFrame frame(env, 4);
    if (!frame.ok()) {
        return "UTC";
    }
    const TimeZoneJni& jni = timeZoneJni(env);
    if (!jni.ok) {
        return "UTC";
    }

    jobject defaultZone = env->CallStaticObjectMethod(jni.clazz, jni.getDefault);
    if (clearException(env) || defaultZone == nullptr) {
        return "UTC";
    }
    jstring idValue = static_cast<jstring>(env->CallObjectMethod(defaultZone, jni.getID));
    if (clearException(env)) {
        return "UTC";
    }
    std::optional<std::string> id = toStdString(env, idValue);
    if (!id.has_value()) {
        return "UTC";
    }

    std::lock_guard<std::mutex> lock(mutex);
    cachedName = *id;
    cachedAt = now;
    return *id;
}

std::optional<int> TimezoneHelper::getOffsetForTimestamp(const std::string& ianaZone, int64_t timestampMs) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return std::nullopt;
    }
    LocalFrame frame(env, 8);
    if (!frame.ok()) {
        return std::nullopt;
    }
    const TimeZoneJni& jni = timeZoneJni(env);
    if (!jni.ok) {
        return std::nullopt;
    }

    std::lock_guard<std::mutex> lock(g_zoneCacheMutex);
    jobject zone = lookupZoneLocked(env, jni, ianaZone);
    if (zone == nullptr) {
        return std::nullopt;
    }
    // getOffset(long) returns the total offset in milliseconds, DST included.
    jint offsetMs = env->CallIntMethod(zone, jni.getOffset, static_cast<jlong>(timestampMs));
    if (clearException(env)) {
        return std::nullopt;
    }
    return static_cast<int>(offsetMs / 60000);
}

std::vector<std::string> TimezoneHelper::getAvailableTimezones() {
    std::vector<std::string> result;

    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return result;
    }
    LocalFrame frame(env, 8);
    if (!frame.ok()) {
        return result;
    }
    const TimeZoneJni& jni = timeZoneJni(env);
    if (!jni.ok) {
        return result;
    }

    jobjectArray ids = static_cast<jobjectArray>(env->CallStaticObjectMethod(jni.clazz, jni.getAvailableIDs));
    if (clearException(env) || ids == nullptr) {
        return result;
    }
    jsize length = env->GetArrayLength(ids);
    result.reserve(static_cast<std::size_t>(length));

    for (jsize i = 0; i < length; i++) {
        jstring id = static_cast<jstring>(env->GetObjectArrayElement(ids, i));
        if (clearException(env)) {
            break;
        }
        std::optional<std::string> name = toStdString(env, id);
        if (name.has_value()) {
            result.push_back(std::move(*name));
        }
        if (id != nullptr) {
            env->DeleteLocalRef(id);
        }
    }

    return result;
}

bool TimezoneHelper::isValidTimezone(const std::string& ianaZone) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return false;
    }
    LocalFrame frame(env, 8);
    if (!frame.ok()) {
        return false;
    }
    const TimeZoneJni& jni = timeZoneJni(env);
    if (!jni.ok) {
        return false;
    }

    std::lock_guard<std::mutex> lock(g_zoneCacheMutex);
    return lookupZoneLocked(env, jni, ianaZone) != nullptr;
}

} // namespace margelo::nitro::rnpackages_nativedate
