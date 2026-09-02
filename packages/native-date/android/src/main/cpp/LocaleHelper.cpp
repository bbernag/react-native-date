#include "LocaleHelper.hpp"
#include <jni.h>
#include <android/log.h>
#include <optional>
#include <set>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

#define LOG_TAG "NativeDate"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace margelo::nitro::rnpackages_nativedate {

using nativedate::core::isSafeLocaleTag;
using nativedate::core::keepPrefix;
using nativedate::core::LocaleCache;
using nativedate::core::localeIdsEqual;
using nativedate::core::LocaleNameLists;
using nativedate::core::LocaleStore;
using nativedate::core::makeLocaleCache;
using nativedate::core::normalizeLocaleId;
using nativedate::core::utf8FromUtf16;

LocaleStore LocaleHelper::store_;

// Store JavaVM reference (set during JNI_OnLoad)
static JavaVM* g_jvm = nullptr;

// Call this from JNI_OnLoad
extern "C" void LocaleHelper_setJavaVM(JavaVM* vm) {
    g_jvm = vm;
}

namespace {

// Get JNIEnv for current thread
JNIEnv* getJNIEnv() {
    if (g_jvm == nullptr) {
        LOGE("JavaVM not initialized for LocaleHelper");
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

// True (and the exception cleared) when a Java exception is pending after `what`.
bool clearException(JNIEnv* env, const char* what) {
    if (env->ExceptionCheck() == JNI_FALSE) {
        return false;
    }
    env->ExceptionClear();
    LOGE("LocaleHelper: Java exception during %s", what);
    return true;
}

// Pops a JNI local frame on scope exit so every early return releases its local refs.
class LocalFrame {
public:
    LocalFrame(JNIEnv* env, jint capacity)
        : env_(env), pushed_(env != nullptr && env->PushLocalFrame(capacity) == JNI_OK) {
        if (env != nullptr && !pushed_) {
            clearException(env, "PushLocalFrame");
        }
    }
    ~LocalFrame() {
        if (pushed_) {
            env_->PopLocalFrame(nullptr);
        }
    }
    LocalFrame(const LocalFrame&) = delete;
    LocalFrame& operator=(const LocalFrame&) = delete;

    /** Whether the env is usable and the frame was pushed. */
    bool ok() const { return pushed_; }

private:
    JNIEnv* env_;
    bool pushed_;
};

jclass findClass(JNIEnv* env, const char* name) {
    jclass cls = env->FindClass(name);
    if (clearException(env, name) || cls == nullptr) {
        return nullptr;
    }
    return cls;
}

jmethodID findMethod(JNIEnv* env, jclass cls, const char* name, const char* signature) {
    jmethodID method = env->GetMethodID(cls, name, signature);
    if (clearException(env, name) || method == nullptr) {
        return nullptr;
    }
    return method;
}

jmethodID findStaticMethod(JNIEnv* env, jclass cls, const char* name, const char* signature) {
    jmethodID method = env->GetStaticMethodID(cls, name, signature);
    if (clearException(env, name) || method == nullptr) {
        return nullptr;
    }
    return method;
}

template <typename... Args>
jobject callObject(JNIEnv* env, jobject receiver, jmethodID method, Args... args) {
    jobject result = env->CallObjectMethod(receiver, method, args...);
    return clearException(env, "CallObjectMethod") ? nullptr : result;
}

template <typename... Args>
jobject callStaticObject(JNIEnv* env, jclass cls, jmethodID method, Args... args) {
    jobject result = env->CallStaticObjectMethod(cls, method, args...);
    return clearException(env, "CallStaticObjectMethod") ? nullptr : result;
}

template <typename... Args>
jobject newObject(JNIEnv* env, jclass cls, jmethodID constructor, Args... args) {
    jobject result = env->NewObject(cls, constructor, args...);
    return clearException(env, "NewObject") ? nullptr : result;
}

// UTF-8 copy of a Java string via its UTF-16 code units (GetStringUTFChars
// would yield modified UTF-8). Empty optional when `string` is null or unreadable.
std::optional<std::string> toUtf8(JNIEnv* env, jstring string) {
    if (string == nullptr) {
        return std::nullopt;
    }
    const jsize length = env->GetStringLength(string);
    const jchar* chars = env->GetStringChars(string, nullptr);
    if (chars == nullptr) {
        clearException(env, "GetStringChars");
        return std::nullopt;
    }
    static_assert(sizeof(jchar) == sizeof(char16_t), "jchar must be a UTF-16 code unit");
    std::string result = utf8FromUtf16(
        std::u16string_view(reinterpret_cast<const char16_t*>(chars), static_cast<size_t>(length)));
    env->ReleaseStringChars(string, chars);
    return result;
}

// Calls a `String` method on `receiver` and copies the result; releases the local ref.
std::optional<std::string> callString(JNIEnv* env, jobject receiver, jmethodID method) {
    auto string = static_cast<jstring>(callObject(env, receiver, method));
    std::optional<std::string> result = toUtf8(env, string);
    if (string != nullptr) {
        env->DeleteLocalRef(string);
    }
    return result;
}

// Java string for a tag already checked with `isSafeLocaleTag` (pure ASCII, so
// NewStringUTF's modified-UTF-8 contract holds). Null on failure.
jstring newAsciiString(JNIEnv* env, const std::string& ascii) {
    jstring result = env->NewStringUTF(ascii.c_str());
    return clearException(env, "NewStringUTF") ? nullptr : result;
}

// Method ids of java.util.Locale used below; empty optional when any lookup fails.
struct LocaleClass {
    jclass cls;
    jmethodID forLanguageTag;
    jmethodID getDefault;
    jmethodID getAvailableLocales;
    jmethodID toLanguageTag;
    jmethodID getLanguage;
    jmethodID getCountry;
    jmethodID getDisplayNameIn;

    static std::optional<LocaleClass> lookup(JNIEnv* env) {
        LocaleClass locale{};
        locale.cls = findClass(env, "java/util/Locale");
        if (locale.cls == nullptr) {
            return std::nullopt;
        }
        locale.forLanguageTag = findStaticMethod(env, locale.cls, "forLanguageTag", "(Ljava/lang/String;)Ljava/util/Locale;");
        locale.getDefault = findStaticMethod(env, locale.cls, "getDefault", "()Ljava/util/Locale;");
        locale.getAvailableLocales = findStaticMethod(env, locale.cls, "getAvailableLocales", "()[Ljava/util/Locale;");
        locale.toLanguageTag = findMethod(env, locale.cls, "toLanguageTag", "()Ljava/lang/String;");
        locale.getLanguage = findMethod(env, locale.cls, "getLanguage", "()Ljava/lang/String;");
        locale.getCountry = findMethod(env, locale.cls, "getCountry", "()Ljava/lang/String;");
        locale.getDisplayNameIn = findMethod(env, locale.cls, "getDisplayName", "(Ljava/util/Locale;)Ljava/lang/String;");
        const bool complete = locale.forLanguageTag && locale.getDefault && locale.getAvailableLocales &&
                              locale.toLanguageTag && locale.getLanguage && locale.getCountry &&
                              locale.getDisplayNameIn;
        if (!complete) {
            return std::nullopt;
        }
        return locale;
    }

    // `Locale.forLanguageTag(tag)` for a tag already checked with `isSafeLocaleTag`.
    jobject fromTag(JNIEnv* env, const std::string& safeTag) const {
        jstring tag = newAsciiString(env, safeTag);
        if (tag == nullptr) {
            return nullptr;
        }
        jobject locale = callStaticObject(env, cls, forLanguageTag, tag);
        env->DeleteLocalRef(tag);
        return locale;
    }
};

// Primary language subtag of the device locale ("en" for "en-US"); empty on failure.
std::string deviceLanguage(JNIEnv* env, const LocaleClass& localeClass, jobject deviceLocale) {
    std::string tag = callString(env, deviceLocale, localeClass.toLanguageTag).value_or("");
    return tag.substr(0, tag.find('-'));
}

// Copies a `String[]` into a vector; `skipFirst` drops index 0 (ICU weekday arrays are 1-based).
std::optional<std::vector<std::string>> readStringArray(JNIEnv* env, jobjectArray array, bool skipFirst) {
    if (array == nullptr) {
        return std::nullopt;
    }
    const jsize length = env->GetArrayLength(array);
    std::vector<std::string> result;
    result.reserve(static_cast<size_t>(length));
    for (jsize i = skipFirst ? 1 : 0; i < length; i++) {
        auto element = static_cast<jstring>(env->GetObjectArrayElement(array, i));
        if (clearException(env, "GetObjectArrayElement")) {
            return std::nullopt;
        }
        std::optional<std::string> text = toUtf8(env, element);
        if (element != nullptr) {
            env->DeleteLocalRef(element);
        }
        if (!text) {
            return std::nullopt;
        }
        result.push_back(std::move(*text));
    }
    return result;
}

// android.icu.text.DateFormatSymbols constants (API 24)
constexpr jint kContextFormat = 0;     // DateFormatSymbols.FORMAT
constexpr jint kContextStandalone = 1; // DateFormatSymbols.STANDALONE
constexpr jint kWidthAbbreviated = 0;  // DateFormatSymbols.ABBREVIATED
constexpr jint kWidthWide = 1;        // DateFormatSymbols.WIDE
constexpr jint kWidthNarrow = 2;      // DateFormatSymbols.NARROW
constexpr jint kWidthShort = 3;       // DateFormatSymbols.SHORT ("Su", "Mo")

// Gregorian month and weekday names for `locale` from android.icu; nullptr when incomplete.
std::shared_ptr<const LocaleCache> loadNames(JNIEnv* env, jobject locale, std::string localeId) {
    // Force the Gregorian calendar: DateFormatSymbols(Locale) would pick the
    // locale's default calendar (Islamic for ar-SA, ...) whose months are not 1..12.
    jclass gregorianClass = findClass(env, "android/icu/util/GregorianCalendar");
    jclass symbolsClass = findClass(env, "android/icu/text/DateFormatSymbols");
    if (gregorianClass == nullptr || symbolsClass == nullptr) {
        return nullptr;
    }
    jmethodID gregorianConstructor = findMethod(env, gregorianClass, "<init>", "(Ljava/util/Locale;)V");
    jmethodID symbolsConstructor = findMethod(env, symbolsClass, "<init>", "(Landroid/icu/util/Calendar;Ljava/util/Locale;)V");
    jmethodID getMonths = findMethod(env, symbolsClass, "getMonths", "(II)[Ljava/lang/String;");
    jmethodID getWeekdays = findMethod(env, symbolsClass, "getWeekdays", "(II)[Ljava/lang/String;");
    if (!gregorianConstructor || !symbolsConstructor || !getMonths || !getWeekdays) {
        return nullptr;
    }

    jobject calendar = newObject(env, gregorianClass, gregorianConstructor, locale);
    if (calendar == nullptr) {
        return nullptr;
    }
    jobject symbols = newObject(env, symbolsClass, symbolsConstructor, calendar, locale);
    if (symbols == nullptr) {
        return nullptr;
    }

    const auto names = [&](jmethodID getter, jint context, jint width, bool skipFirst) {
        auto array = static_cast<jobjectArray>(callObject(env, symbols, getter, context, width));
        std::optional<std::vector<std::string>> list = readStringArray(env, array, skipFirst);
        if (array != nullptr) {
            env->DeleteLocalRef(array);
        }
        return list;
    };

    LocaleNameLists lists;
    // ICU month arrays are 13 slots (UNDECIMBER); weekday arrays are 1-based
    // with an empty [0]. Keep the Gregorian 12/7 prefix; extra slots are dropped.
    const auto take = [](std::optional<std::vector<std::string>> list, size_t count,
                         std::vector<std::string>& target) {
        if (!list || !keepPrefix(*list, count)) {
            return false;
        }
        target = std::move(*list);
        return true;
    };
    const auto takeStandalone = [&](jmethodID getter, jint width, bool skipFirst, size_t count,
                                    std::vector<std::string>& target) {
        if (take(names(getter, kContextStandalone, width, skipFirst), count, target)) {
            return true;
        }
        return take(names(getter, kContextFormat, width, skipFirst), count, target);
    };
    const bool complete = take(names(getMonths, kContextFormat, kWidthWide, false), 12, lists.monthNames) &&
                          take(names(getMonths, kContextFormat, kWidthAbbreviated, false), 12, lists.monthNamesShort) &&
                          takeStandalone(getMonths, kWidthNarrow, false, 12, lists.monthMinimal) &&
                          take(names(getWeekdays, kContextFormat, kWidthWide, true), 7, lists.dayNames) &&
                          take(names(getWeekdays, kContextFormat, kWidthAbbreviated, true), 7, lists.dayNamesShort) &&
                          takeStandalone(getWeekdays, kWidthShort, true, 7, lists.dayVeryShort) &&
                          takeStandalone(getWeekdays, kWidthNarrow, true, 7, lists.dayMinimal);
    if (!complete) {
        LOGE("LocaleHelper: incomplete date symbols for locale %s", localeId.c_str());
        return nullptr;
    }

    auto cache = makeLocaleCache(std::move(localeId), std::move(lists));
    if (!cache) {
        LOGE("LocaleHelper: rejected date symbols (count or UTF-8) for a locale");
    }
    return cache;
}

struct AvailableLocale {
    jobject locale;  // local ref owned by the caller's frame
    std::string tag; // canonical BCP-47 tag from Locale.toLanguageTag()
};

// The entry of Locale.getAvailableLocales() naming `normalizedTag` (case-insensitive), if any.
std::optional<AvailableLocale> findAvailableLocale(JNIEnv* env, const LocaleClass& localeClass,
                                                   const std::string& normalizedTag) {
    auto locales = static_cast<jobjectArray>(callStaticObject(env, localeClass.cls, localeClass.getAvailableLocales));
    if (locales == nullptr) {
        return std::nullopt;
    }
    const jsize length = env->GetArrayLength(locales);
    for (jsize i = 0; i < length; i++) {
        jobject locale = env->GetObjectArrayElement(locales, i);
        if (clearException(env, "GetObjectArrayElement") || locale == nullptr) {
            continue;
        }
        std::optional<std::string> tag = callString(env, locale, localeClass.toLanguageTag);
        if (tag && localeIdsEqual(normalizedTag, *tag)) {
            env->DeleteLocalRef(locales);
            return AvailableLocale{locale, std::move(*tag)};
        }
        env->DeleteLocalRef(locale);
    }
    env->DeleteLocalRef(locales);
    return std::nullopt;
}

// Sorted, de-duplicated `Locale.getLanguage()` of every available locale.
std::vector<std::string> availableLanguages(JNIEnv* env, const LocaleClass& localeClass) {
    std::set<std::string> languages;
    auto locales = static_cast<jobjectArray>(callStaticObject(env, localeClass.cls, localeClass.getAvailableLocales));
    if (locales == nullptr) {
        return {};
    }
    const jsize length = env->GetArrayLength(locales);
    for (jsize i = 0; i < length; i++) {
        jobject locale = env->GetObjectArrayElement(locales, i);
        if (clearException(env, "GetObjectArrayElement") || locale == nullptr) {
            continue;
        }
        std::optional<std::string> language = callString(env, locale, localeClass.getLanguage);
        if (language && !language->empty()) {
            languages.insert(std::move(*language));
        }
        env->DeleteLocalRef(locale);
    }
    env->DeleteLocalRef(locales);
    return std::vector<std::string>(languages.begin(), languages.end());
}

// `locale.getDisplayName(inLocale)`, or `fallback` when Java has none.
std::string displayNameIn(JNIEnv* env, const LocaleClass& localeClass, jobject locale, jobject inLocale,
                          const std::string& fallback) {
    auto name = static_cast<jstring>(callObject(env, locale, localeClass.getDisplayNameIn, inLocale));
    std::optional<std::string> text = toUtf8(env, name);
    if (name != nullptr) {
        env->DeleteLocalRef(name);
    }
    return text && !text->empty() ? *text : fallback;
}

constexpr jint kFrameCapacity = 64;

} // namespace

std::shared_ptr<const LocaleCache> LocaleHelper::loadDefaultFromPlatform() {
    JNIEnv* env = getJNIEnv();
    LocalFrame frame(env, kFrameCapacity);
    if (!frame.ok()) {
        LOGE("Cannot load locale names: JNI environment not available");
        return nullptr;
    }
    const auto localeClass = LocaleClass::lookup(env);
    if (!localeClass) {
        return nullptr;
    }
    jobject locale = callStaticObject(env, localeClass->cls, localeClass->getDefault);
    if (locale == nullptr) {
        return nullptr;
    }
    return loadNames(env, locale, deviceLanguage(env, *localeClass, locale));
}

std::string LocaleHelper::getCurrentLocale() {
    if (const auto snapshot = names()) {
        return snapshot->localeId;
    }

    // Names could not be loaded; still report the device language when JNI works.
    JNIEnv* env = getJNIEnv();
    LocalFrame frame(env, kFrameCapacity);
    if (!frame.ok()) {
        return "en";
    }
    const auto localeClass = LocaleClass::lookup(env);
    if (!localeClass) {
        return "en";
    }
    jobject locale = callStaticObject(env, localeClass->cls, localeClass->getDefault);
    if (locale == nullptr) {
        return "en";
    }
    std::string language = deviceLanguage(env, *localeClass, locale);
    return language.empty() ? "en" : language;
}

bool LocaleHelper::setLocale(const std::string& locale) {
    const std::string normalized = normalizeLocaleId(locale);
    if (!isSafeLocaleTag(normalized)) {
        return false;
    }

    JNIEnv* env = getJNIEnv();
    LocalFrame frame(env, kFrameCapacity);
    if (!frame.ok()) {
        return false;
    }
    const auto localeClass = LocaleClass::lookup(env);
    if (!localeClass) {
        return false;
    }
    std::optional<AvailableLocale> match = findAvailableLocale(env, *localeClass, normalized);
    if (!match) {
        return false;
    }
    auto loaded = loadNames(env, match->locale, std::move(match->tag));
    if (!loaded) {
        return false;
    }
    store_.replace(std::move(loaded));
    return true;
}

std::vector<std::string> LocaleHelper::getAvailableLocales() {
    JNIEnv* env = getJNIEnv();
    LocalFrame frame(env, kFrameCapacity);
    if (!frame.ok()) {
        return {};
    }
    const auto localeClass = LocaleClass::lookup(env);
    if (!localeClass) {
        return {};
    }
    return availableLanguages(env, *localeClass);
}

bool LocaleHelper::isValidLocale(const std::string& locale) {
    const std::string normalized = normalizeLocaleId(locale);
    if (!isSafeLocaleTag(normalized)) {
        return false;
    }

    JNIEnv* env = getJNIEnv();
    LocalFrame frame(env, kFrameCapacity);
    if (!frame.ok()) {
        return false;
    }
    const auto localeClass = LocaleClass::lookup(env);
    if (!localeClass) {
        return false;
    }
    return findAvailableLocale(env, *localeClass, normalized).has_value();
}

std::string LocaleHelper::getLocaleDisplayName(const std::string& localeCode) {
    const std::string normalized = normalizeLocaleId(localeCode);
    if (!isSafeLocaleTag(normalized)) {
        return localeCode;
    }

    JNIEnv* env = getJNIEnv();
    LocalFrame frame(env, kFrameCapacity);
    if (!frame.ok()) {
        return localeCode;
    }
    const auto localeClass = LocaleClass::lookup(env);
    if (!localeClass) {
        return localeCode;
    }
    jobject locale = localeClass->fromTag(env, normalized);
    jobject englishLocale = localeClass->fromTag(env, "en");
    if (locale == nullptr || englishLocale == nullptr) {
        return localeCode;
    }
    return displayNameIn(env, *localeClass, locale, englishLocale, localeCode);
}

LocaleInfoData LocaleHelper::getLocaleInfo(const std::string& localeCode) {
    LocaleInfoData info;
    info.code = localeCode;
    info.languageCode = localeCode;
    info.displayName = localeCode;
    info.nativeName = localeCode;

    const std::string normalized = normalizeLocaleId(localeCode);
    if (!isSafeLocaleTag(normalized)) {
        return info;
    }

    JNIEnv* env = getJNIEnv();
    LocalFrame frame(env, kFrameCapacity);
    if (!frame.ok()) {
        return info;
    }
    const auto localeClass = LocaleClass::lookup(env);
    if (!localeClass) {
        return info;
    }
    jobject locale = localeClass->fromTag(env, normalized);
    jobject englishLocale = localeClass->fromTag(env, "en");
    if (locale == nullptr || englishLocale == nullptr) {
        return info;
    }

    info.languageCode = callString(env, locale, localeClass->getLanguage).value_or("");
    info.regionCode = callString(env, locale, localeClass->getCountry).value_or("");

    // Display name in English, then in the locale's own language
    info.displayName = displayNameIn(env, *localeClass, locale, englishLocale, localeCode);
    info.nativeName = displayNameIn(env, *localeClass, locale, locale, info.displayName);

    return info;
}

std::vector<LocaleInfoData> LocaleHelper::getAvailableLocalesInfo() {
    std::vector<std::string> languages;
    {
        JNIEnv* env = getJNIEnv();
        LocalFrame frame(env, kFrameCapacity);
        if (!frame.ok()) {
            return {};
        }
        const auto localeClass = LocaleClass::lookup(env);
        if (!localeClass) {
            return {};
        }
        languages = availableLanguages(env, *localeClass);
    }

    // Get full info for each locale
    std::vector<LocaleInfoData> result;
    result.reserve(languages.size());
    for (const auto& code : languages) {
        result.push_back(getLocaleInfo(code));
    }
    return result;
}

} // namespace margelo::nitro::rnpackages_nativedate
