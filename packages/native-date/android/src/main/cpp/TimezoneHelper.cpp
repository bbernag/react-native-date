#include "TimezoneHelper.hpp"
#include <jni.h>
#include <unordered_map>
#include <android/log.h>

#define LOG_TAG "NativeDate"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace margelo::nitro::rnpackages_nativedate {

// Store JavaVM reference (set during JNI_OnLoad)
static JavaVM* g_jvm = nullptr;

// Call this from JNI_OnLoad
extern "C" void TimezoneHelper_setJavaVM(JavaVM* vm) {
    g_jvm = vm;
}

// Get JNIEnv for current thread
static JNIEnv* getJNIEnv() {
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

std::string TimezoneHelper::getSystemTimezone() {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return "UTC";
    }

    // Get TimeZone.getDefault().getID()
    jclass timeZoneClass = env->FindClass("java/util/TimeZone");
    if (timeZoneClass == nullptr) {
        return "UTC";
    }

    jmethodID getDefaultMethod = env->GetStaticMethodID(timeZoneClass, "getDefault", "()Ljava/util/TimeZone;");
    jmethodID getIdMethod = env->GetMethodID(timeZoneClass, "getID", "()Ljava/lang/String;");

    jobject defaultTz = env->CallStaticObjectMethod(timeZoneClass, getDefaultMethod);
    jstring tzId = (jstring)env->CallObjectMethod(defaultTz, getIdMethod);

    const char* tzIdStr = env->GetStringUTFChars(tzId, nullptr);
    std::string result(tzIdStr);
    env->ReleaseStringUTFChars(tzId, tzIdStr);

    env->DeleteLocalRef(tzId);
    env->DeleteLocalRef(defaultTz);
    env->DeleteLocalRef(timeZoneClass);

    return result;
}

int TimezoneHelper::getOffsetForTimestamp(const std::string& timezone, int64_t timestampMs) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return 0;
    }

    std::string normalizedTz = normalizeTimezone(timezone);

    // Use java.time.ZoneId and java.time.Instant (API 26+)
    // For older APIs, fall back to java.util.TimeZone

    // Try java.time first (API 26+)
    jclass zoneIdClass = env->FindClass("java/time/ZoneId");

    if (zoneIdClass != nullptr && env->ExceptionCheck() == JNI_FALSE) {
        // Use modern java.time API
        jmethodID ofMethod = env->GetStaticMethodID(zoneIdClass, "of", "(Ljava/lang/String;)Ljava/time/ZoneId;");
        jclass instantClass = env->FindClass("java/time/Instant");
        jmethodID ofEpochMilliMethod = env->GetStaticMethodID(instantClass, "ofEpochMilli", "(J)Ljava/time/Instant;");
        jclass zoneRulesClass = env->FindClass("java/time/zone/ZoneRules");
        jmethodID getRulesMethod = env->GetMethodID(zoneIdClass, "getRules", "()Ljava/time/zone/ZoneRules;");
        jmethodID getOffsetMethod = env->GetMethodID(zoneRulesClass, "getOffset", "(Ljava/time/Instant;)Ljava/time/ZoneOffset;");
        jclass zoneOffsetClass = env->FindClass("java/time/ZoneOffset");
        jmethodID getTotalSecondsMethod = env->GetMethodID(zoneOffsetClass, "getTotalSeconds", "()I");

        jstring tzName = env->NewStringUTF(normalizedTz.c_str());

        // ZoneId.of(timezone)
        jobject zoneId = env->CallStaticObjectMethod(zoneIdClass, ofMethod, tzName);
        if (env->ExceptionCheck()) {
            env->ExceptionClear();
            env->DeleteLocalRef(tzName);
            env->DeleteLocalRef(zoneIdClass);
            // Fall back to legacy API
            goto fallback;
        }

        // Instant.ofEpochMilli(timestampMs)
        jobject instant = env->CallStaticObjectMethod(instantClass, ofEpochMilliMethod, timestampMs);

        // zoneId.getRules()
        jobject rules = env->CallObjectMethod(zoneId, getRulesMethod);

        // rules.getOffset(instant)
        jobject offset = env->CallObjectMethod(rules, getOffsetMethod, instant);

        // offset.getTotalSeconds()
        int totalSeconds = env->CallIntMethod(offset, getTotalSecondsMethod);
        int offsetMinutes = totalSeconds / 60;

        // Clean up
        env->DeleteLocalRef(offset);
        env->DeleteLocalRef(rules);
        env->DeleteLocalRef(instant);
        env->DeleteLocalRef(zoneId);
        env->DeleteLocalRef(tzName);
        env->DeleteLocalRef(zoneOffsetClass);
        env->DeleteLocalRef(zoneRulesClass);
        env->DeleteLocalRef(instantClass);
        env->DeleteLocalRef(zoneIdClass);

        return offsetMinutes;
    }

    // Clear any exception from FindClass
    if (env->ExceptionCheck()) {
        env->ExceptionClear();
    }

fallback:
    // Fall back to java.util.TimeZone for older APIs
    jclass timeZoneClass = env->FindClass("java/util/TimeZone");
    jmethodID getTimeZoneMethod = env->GetStaticMethodID(timeZoneClass, "getTimeZone", "(Ljava/lang/String;)Ljava/util/TimeZone;");
    jmethodID getOffsetMethod = env->GetMethodID(timeZoneClass, "getOffset", "(J)I");

    jstring tzName = env->NewStringUTF(normalizedTz.c_str());
    jobject tz = env->CallStaticObjectMethod(timeZoneClass, getTimeZoneMethod, tzName);

    // getOffset returns offset in milliseconds
    int offsetMs = env->CallIntMethod(tz, getOffsetMethod, timestampMs);
    int offsetMinutes = offsetMs / 60000;

    env->DeleteLocalRef(tz);
    env->DeleteLocalRef(tzName);
    env->DeleteLocalRef(timeZoneClass);

    return offsetMinutes;
}

std::vector<std::string> TimezoneHelper::getAvailableTimezones() {
    JNIEnv* env = getJNIEnv();
    std::vector<std::string> result;

    if (env == nullptr) {
        return result;
    }

    // Get TimeZone.getAvailableIDs()
    jclass timeZoneClass = env->FindClass("java/util/TimeZone");
    jmethodID getAvailableIDsMethod = env->GetStaticMethodID(timeZoneClass, "getAvailableIDs", "()[Ljava/lang/String;");

    jobjectArray idsArray = (jobjectArray)env->CallStaticObjectMethod(timeZoneClass, getAvailableIDsMethod);
    int length = env->GetArrayLength(idsArray);
    result.reserve(length);

    for (int i = 0; i < length; i++) {
        jstring id = (jstring)env->GetObjectArrayElement(idsArray, i);
        const char* idStr = env->GetStringUTFChars(id, nullptr);
        result.push_back(std::string(idStr));
        env->ReleaseStringUTFChars(id, idStr);
        env->DeleteLocalRef(id);
    }

    env->DeleteLocalRef(idsArray);
    env->DeleteLocalRef(timeZoneClass);

    return result;
}

bool TimezoneHelper::isValidTimezone(const std::string& timezone) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return false;
    }

    std::string normalizedTz = normalizeTimezone(timezone);

    // Use TimeZone.getTimeZone() and check if it returns GMT for unknown zones
    jclass timeZoneClass = env->FindClass("java/util/TimeZone");
    jmethodID getTimeZoneMethod = env->GetStaticMethodID(timeZoneClass, "getTimeZone", "(Ljava/lang/String;)Ljava/util/TimeZone;");
    jmethodID getIdMethod = env->GetMethodID(timeZoneClass, "getID", "()Ljava/lang/String;");

    jstring tzName = env->NewStringUTF(normalizedTz.c_str());
    jobject tz = env->CallStaticObjectMethod(timeZoneClass, getTimeZoneMethod, tzName);
    jstring resultId = (jstring)env->CallObjectMethod(tz, getIdMethod);

    const char* resultIdStr = env->GetStringUTFChars(resultId, nullptr);
    std::string resultIdCpp(resultIdStr);
    env->ReleaseStringUTFChars(resultId, resultIdStr);

    // TimeZone returns "GMT" for unknown timezones
    bool isValid = (resultIdCpp == normalizedTz) ||
                   (normalizedTz == "GMT" || normalizedTz == "UTC");

    env->DeleteLocalRef(resultId);
    env->DeleteLocalRef(tz);
    env->DeleteLocalRef(tzName);
    env->DeleteLocalRef(timeZoneClass);

    return isValid;
}

std::string TimezoneHelper::normalizeTimezone(const std::string& timezone) {
    // Map common abbreviations to IANA names
    static const std::unordered_map<std::string, std::string> abbreviations = {
        // US timezones
        {"EST", "America/New_York"},
        {"EDT", "America/New_York"},
        {"CST", "America/Chicago"},
        {"CDT", "America/Chicago"},
        {"MST", "America/Denver"},
        {"MDT", "America/Denver"},
        {"PST", "America/Los_Angeles"},
        {"PDT", "America/Los_Angeles"},
        {"AKST", "America/Anchorage"},
        {"AKDT", "America/Anchorage"},
        {"HST", "Pacific/Honolulu"},
        // European timezones
        {"GMT", "Etc/GMT"},
        {"BST", "Europe/London"},
        {"WET", "Europe/London"},
        {"WEST", "Europe/London"},
        {"CET", "Europe/Paris"},
        {"CEST", "Europe/Paris"},
        {"EET", "Europe/Helsinki"},
        {"EEST", "Europe/Helsinki"},
        {"MSK", "Europe/Moscow"},
        // Asian timezones
        {"IST", "Asia/Kolkata"},
        {"JST", "Asia/Tokyo"},
        {"KST", "Asia/Seoul"},
        {"HKT", "Asia/Hong_Kong"},
        {"SGT", "Asia/Singapore"},
        {"ICT", "Asia/Bangkok"},
        // Australian timezones
        {"AEST", "Australia/Sydney"},
        {"AEDT", "Australia/Sydney"},
        {"ACST", "Australia/Adelaide"},
        {"ACDT", "Australia/Adelaide"},
        {"AWST", "Australia/Perth"},
        // NZ
        {"NZST", "Pacific/Auckland"},
        {"NZDT", "Pacific/Auckland"},
    };

    auto it = abbreviations.find(timezone);
    if (it != abbreviations.end()) {
        return it->second;
    }

    return timezone;
}

} // namespace margelo::nitro::rnpackages_nativedate
