#include "LocaleHelper.hpp"
#include <jni.h>
#include <android/log.h>
#include <algorithm>
#include <stdexcept>

#define LOG_TAG "NativeDate"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace margelo::nitro::rnpackages_nativedate {

// Static member definitions
LocaleCache LocaleHelper::cache;
std::mutex LocaleHelper::cacheMutex;

// Store JavaVM reference (set during JNI_OnLoad)
static JavaVM* g_jvm = nullptr;

// Current locale code (empty = system default)
static std::string g_currentLocale = "";
static std::mutex g_localeMutex;

// Call this from JNI_OnLoad
extern "C" void LocaleHelper_setJavaVM(JavaVM* vm) {
    g_jvm = vm;
}

// Get JNIEnv for current thread
static JNIEnv* getJNIEnv() {
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

// Get Java Locale object for current setting
static jobject getJavaLocale(JNIEnv* env) {
    std::lock_guard<std::mutex> lock(g_localeMutex);

    jclass localeClass = env->FindClass("java/util/Locale");

    if (g_currentLocale.empty()) {
        // Return default locale
        jmethodID getDefaultMethod = env->GetStaticMethodID(localeClass, "getDefault", "()Ljava/util/Locale;");
        jobject locale = env->CallStaticObjectMethod(localeClass, getDefaultMethod);
        env->DeleteLocalRef(localeClass);
        return locale;
    }

    // Create locale from language code
    jmethodID forLanguageTagMethod = env->GetStaticMethodID(localeClass, "forLanguageTag", "(Ljava/lang/String;)Ljava/util/Locale;");
    jstring langTag = env->NewStringUTF(g_currentLocale.c_str());
    jobject locale = env->CallStaticObjectMethod(localeClass, forLanguageTagMethod, langTag);

    env->DeleteLocalRef(langTag);
    env->DeleteLocalRef(localeClass);

    return locale;
}

void LocaleHelper::requireLocaleSet() {
    std::lock_guard<std::mutex> lock(cacheMutex);
    if (!cache.loaded) {
        throw std::runtime_error("Locale not set. Call setLocale() before using locale-dependent functions.");
    }
}

void LocaleHelper::loadCacheFromPlatform() {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        LOGE("Cannot load cache: JNI environment not available");
        return;
    }

    jobject locale = getJavaLocale(env);

    jclass dfsClass = env->FindClass("java/text/DateFormatSymbols");
    jmethodID dfsConstructor = env->GetMethodID(dfsClass, "<init>", "(Ljava/util/Locale;)V");
    jmethodID getMonthsMethod = env->GetMethodID(dfsClass, "getMonths", "()[Ljava/lang/String;");
    jmethodID getShortMonthsMethod = env->GetMethodID(dfsClass, "getShortMonths", "()[Ljava/lang/String;");
    jmethodID getWeekdaysMethod = env->GetMethodID(dfsClass, "getWeekdays", "()[Ljava/lang/String;");
    jmethodID getShortWeekdaysMethod = env->GetMethodID(dfsClass, "getShortWeekdays", "()[Ljava/lang/String;");

    jobject dfs = env->NewObject(dfsClass, dfsConstructor, locale);

    // Load month names
    cache.monthNames.clear();
    cache.monthNamesShort.clear();
    cache.monthMinimal.clear();
    cache.monthNames.reserve(12);
    cache.monthNamesShort.reserve(12);
    cache.monthMinimal.reserve(12);

    jobjectArray months = (jobjectArray)env->CallObjectMethod(dfs, getMonthsMethod);
    jobjectArray monthsShort = (jobjectArray)env->CallObjectMethod(dfs, getShortMonthsMethod);

    for (int i = 0; i < 12; i++) {
        jstring monthFull = (jstring)env->GetObjectArrayElement(months, i);
        jstring monthShort = (jstring)env->GetObjectArrayElement(monthsShort, i);

        const char* fullStr = env->GetStringUTFChars(monthFull, nullptr);
        const char* shortStr = env->GetStringUTFChars(monthShort, nullptr);

        cache.monthNames.push_back(std::string(fullStr));
        cache.monthNamesShort.push_back(std::string(shortStr));
        // Minimal: first character of short name
        std::string shortName(shortStr);
        cache.monthMinimal.push_back(shortName.empty() ? "" : shortName.substr(0, 1));

        env->ReleaseStringUTFChars(monthFull, fullStr);
        env->ReleaseStringUTFChars(monthShort, shortStr);
        env->DeleteLocalRef(monthFull);
        env->DeleteLocalRef(monthShort);
    }
    env->DeleteLocalRef(months);
    env->DeleteLocalRef(monthsShort);

    // Load day names (Java: index 1=Sunday, we need index 0=Sunday)
    cache.dayNames.clear();
    cache.dayNamesShort.clear();
    cache.dayVeryShort.clear();
    cache.dayMinimal.clear();
    cache.dayNames.reserve(7);
    cache.dayNamesShort.reserve(7);
    cache.dayVeryShort.reserve(7);
    cache.dayMinimal.reserve(7);

    jobjectArray days = (jobjectArray)env->CallObjectMethod(dfs, getWeekdaysMethod);
    jobjectArray daysShort = (jobjectArray)env->CallObjectMethod(dfs, getShortWeekdaysMethod);

    // Java weekdays array: index 0 is empty, 1=Sunday, 7=Saturday
    for (int i = 1; i <= 7; i++) {
        jstring dayFull = (jstring)env->GetObjectArrayElement(days, i);
        jstring dayShort = (jstring)env->GetObjectArrayElement(daysShort, i);

        const char* fullStr = env->GetStringUTFChars(dayFull, nullptr);
        const char* shortStr = env->GetStringUTFChars(dayShort, nullptr);

        std::string fullName(fullStr);
        std::string shortName(shortStr);

        cache.dayNames.push_back(fullName);
        cache.dayNamesShort.push_back(shortName);
        // Minimal: first character
        cache.dayMinimal.push_back(shortName.empty() ? "" : shortName.substr(0, 1));
        // VeryShort: first 2 characters
        cache.dayVeryShort.push_back(shortName.length() > 2 ? shortName.substr(0, 2) : shortName);

        env->ReleaseStringUTFChars(dayFull, fullStr);
        env->ReleaseStringUTFChars(dayShort, shortStr);
        env->DeleteLocalRef(dayFull);
        env->DeleteLocalRef(dayShort);
    }
    env->DeleteLocalRef(days);
    env->DeleteLocalRef(daysShort);

    env->DeleteLocalRef(dfs);
    env->DeleteLocalRef(dfsClass);
    env->DeleteLocalRef(locale);
}

std::string LocaleHelper::getCurrentLocale() {
    std::lock_guard<std::mutex> lock(g_localeMutex);

    if (!g_currentLocale.empty()) {
        return g_currentLocale;
    }

    // Get system default locale
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return "en";
    }

    jclass localeClass = env->FindClass("java/util/Locale");
    jmethodID getDefaultMethod = env->GetStaticMethodID(localeClass, "getDefault", "()Ljava/util/Locale;");
    jmethodID getLanguageMethod = env->GetMethodID(localeClass, "getLanguage", "()Ljava/lang/String;");

    jobject defaultLocale = env->CallStaticObjectMethod(localeClass, getDefaultMethod);
    jstring language = (jstring)env->CallObjectMethod(defaultLocale, getLanguageMethod);

    const char* langStr = env->GetStringUTFChars(language, nullptr);
    std::string result(langStr);
    env->ReleaseStringUTFChars(language, langStr);

    env->DeleteLocalRef(language);
    env->DeleteLocalRef(defaultLocale);
    env->DeleteLocalRef(localeClass);

    return result;
}

bool LocaleHelper::setLocale(const std::string& locale) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return false;
    }

    // Validate locale by trying to create it and get date symbols
    jclass localeClass = env->FindClass("java/util/Locale");
    jmethodID forLanguageTagMethod = env->GetStaticMethodID(localeClass, "forLanguageTag", "(Ljava/lang/String;)Ljava/util/Locale;");

    jstring langTag = env->NewStringUTF(locale.c_str());
    jobject testLocale = env->CallStaticObjectMethod(localeClass, forLanguageTagMethod, langTag);

    // Check if locale produces valid date symbols
    jclass dfsClass = env->FindClass("java/text/DateFormatSymbols");
    jmethodID dfsConstructor = env->GetMethodID(dfsClass, "<init>", "(Ljava/util/Locale;)V");
    jmethodID getMonthsMethod = env->GetMethodID(dfsClass, "getMonths", "()[Ljava/lang/String;");

    jobject dfs = env->NewObject(dfsClass, dfsConstructor, testLocale);
    jobjectArray months = (jobjectArray)env->CallObjectMethod(dfs, getMonthsMethod);

    bool isValid = false;
    if (months != nullptr) {
        int length = env->GetArrayLength(months);
        if (length > 0) {
            jstring firstMonth = (jstring)env->GetObjectArrayElement(months, 0);
            if (firstMonth != nullptr) {
                const char* monthStr = env->GetStringUTFChars(firstMonth, nullptr);
                isValid = (monthStr != nullptr && strlen(monthStr) > 0);
                env->ReleaseStringUTFChars(firstMonth, monthStr);
                env->DeleteLocalRef(firstMonth);
            }
        }
        env->DeleteLocalRef(months);
    }

    env->DeleteLocalRef(dfs);
    env->DeleteLocalRef(dfsClass);
    env->DeleteLocalRef(testLocale);
    env->DeleteLocalRef(langTag);
    env->DeleteLocalRef(localeClass);

    if (isValid) {
        {
            std::lock_guard<std::mutex> lock(g_localeMutex);
            g_currentLocale = locale;
        }

        // Eagerly reload cache with new locale
        {
            std::lock_guard<std::mutex> lock(cacheMutex);
            loadCacheFromPlatform();
            cache.loaded = true;
        }
    }

    return isValid;
}

std::vector<std::string> LocaleHelper::getAvailableLocales() {
    JNIEnv* env = getJNIEnv();
    std::vector<std::string> result;

    if (env == nullptr) {
        return result;
    }

    jclass localeClass = env->FindClass("java/util/Locale");
    jmethodID getAvailableLocalesMethod = env->GetStaticMethodID(localeClass, "getAvailableLocales", "()[Ljava/util/Locale;");
    jmethodID getLanguageMethod = env->GetMethodID(localeClass, "getLanguage", "()Ljava/lang/String;");

    jobjectArray locales = (jobjectArray)env->CallStaticObjectMethod(localeClass, getAvailableLocalesMethod);
    int length = env->GetArrayLength(locales);

    // Use a set to get unique language codes
    std::vector<std::string> uniqueCodes;
    for (int i = 0; i < length; i++) {
        jobject locale = env->GetObjectArrayElement(locales, i);
        jstring language = (jstring)env->CallObjectMethod(locale, getLanguageMethod);

        const char* langStr = env->GetStringUTFChars(language, nullptr);
        std::string langCode(langStr);
        env->ReleaseStringUTFChars(language, langStr);

        // Only add non-empty unique codes
        if (!langCode.empty()) {
            bool found = false;
            for (const auto& code : uniqueCodes) {
                if (code == langCode) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                uniqueCodes.push_back(langCode);
            }
        }

        env->DeleteLocalRef(language);
        env->DeleteLocalRef(locale);
    }

    env->DeleteLocalRef(locales);
    env->DeleteLocalRef(localeClass);

    // Sort alphabetically
    std::sort(uniqueCodes.begin(), uniqueCodes.end());

    return uniqueCodes;
}

bool LocaleHelper::isValidLocale(const std::string& locale) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return false;
    }

    jclass localeClass = env->FindClass("java/util/Locale");
    jmethodID forLanguageTagMethod = env->GetStaticMethodID(localeClass, "forLanguageTag", "(Ljava/lang/String;)Ljava/util/Locale;");

    jstring langTag = env->NewStringUTF(locale.c_str());
    jobject testLocale = env->CallStaticObjectMethod(localeClass, forLanguageTagMethod, langTag);

    // Check if it produces valid symbols
    jclass dfsClass = env->FindClass("java/text/DateFormatSymbols");
    jmethodID dfsConstructor = env->GetMethodID(dfsClass, "<init>", "(Ljava/util/Locale;)V");
    jmethodID getMonthsMethod = env->GetMethodID(dfsClass, "getMonths", "()[Ljava/lang/String;");

    jobject dfs = env->NewObject(dfsClass, dfsConstructor, testLocale);
    jobjectArray months = (jobjectArray)env->CallObjectMethod(dfs, getMonthsMethod);

    bool isValid = false;
    if (months != nullptr) {
        int length = env->GetArrayLength(months);
        if (length > 0) {
            jstring firstMonth = (jstring)env->GetObjectArrayElement(months, 0);
            if (firstMonth != nullptr) {
                const char* monthStr = env->GetStringUTFChars(firstMonth, nullptr);
                isValid = (monthStr != nullptr && strlen(monthStr) > 0);
                env->ReleaseStringUTFChars(firstMonth, monthStr);
                env->DeleteLocalRef(firstMonth);
            }
        }
        env->DeleteLocalRef(months);
    }

    env->DeleteLocalRef(dfs);
    env->DeleteLocalRef(dfsClass);
    env->DeleteLocalRef(testLocale);
    env->DeleteLocalRef(langTag);
    env->DeleteLocalRef(localeClass);

    return isValid;
}

std::string LocaleHelper::getMonthName(int month, bool abbreviated) {
    if (month < 1 || month > 12) {
        return "";
    }

    requireLocaleSet();

    int index = month - 1;
    if (abbreviated) {
        return cache.monthNamesShort[index];
    }
    return cache.monthNames[index];
}

std::string LocaleHelper::getDayName(int dayOfWeek, bool abbreviated) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
        return "";
    }

    requireLocaleSet();

    if (abbreviated) {
        return cache.dayNamesShort[dayOfWeek];
    }
    return cache.dayNames[dayOfWeek];
}

std::string LocaleHelper::getLocaleDisplayName(const std::string& localeCode) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return localeCode;
    }

    jclass localeClass = env->FindClass("java/util/Locale");
    jmethodID forLanguageTagMethod = env->GetStaticMethodID(localeClass, "forLanguageTag", "(Ljava/lang/String;)Ljava/util/Locale;");
    jmethodID getDisplayNameMethod = env->GetMethodID(localeClass, "getDisplayName", "(Ljava/util/Locale;)Ljava/lang/String;");

    // Create locale from code
    jstring langTag = env->NewStringUTF(localeCode.c_str());
    jobject locale = env->CallStaticObjectMethod(localeClass, forLanguageTagMethod, langTag);

    // Get English locale for display name
    jstring enTag = env->NewStringUTF("en");
    jobject englishLocale = env->CallStaticObjectMethod(localeClass, forLanguageTagMethod, enTag);

    // Get display name in English
    jstring displayName = (jstring)env->CallObjectMethod(locale, getDisplayNameMethod, englishLocale);

    std::string result = localeCode;
    if (displayName != nullptr) {
        const char* displayStr = env->GetStringUTFChars(displayName, nullptr);
        if (displayStr != nullptr && strlen(displayStr) > 0) {
            result = std::string(displayStr);
        }
        env->ReleaseStringUTFChars(displayName, displayStr);
        env->DeleteLocalRef(displayName);
    }

    env->DeleteLocalRef(englishLocale);
    env->DeleteLocalRef(enTag);
    env->DeleteLocalRef(locale);
    env->DeleteLocalRef(langTag);
    env->DeleteLocalRef(localeClass);

    return result;
}

LocaleInfoData LocaleHelper::getLocaleInfo(const std::string& localeCode) {
    JNIEnv* env = getJNIEnv();
    LocaleInfoData info;
    info.code = localeCode;

    if (env == nullptr) {
        info.languageCode = localeCode;
        info.displayName = localeCode;
        info.nativeName = localeCode;
        return info;
    }

    jclass localeClass = env->FindClass("java/util/Locale");
    jmethodID forLanguageTagMethod = env->GetStaticMethodID(localeClass, "forLanguageTag", "(Ljava/lang/String;)Ljava/util/Locale;");
    jmethodID getLanguageMethod = env->GetMethodID(localeClass, "getLanguage", "()Ljava/lang/String;");
    jmethodID getCountryMethod = env->GetMethodID(localeClass, "getCountry", "()Ljava/lang/String;");
    jmethodID getDisplayNameMethod = env->GetMethodID(localeClass, "getDisplayName", "(Ljava/util/Locale;)Ljava/lang/String;");
    jmethodID getDisplayNameSelfMethod = env->GetMethodID(localeClass, "getDisplayName", "()Ljava/lang/String;");

    // Create locale from code
    jstring langTag = env->NewStringUTF(localeCode.c_str());
    jobject locale = env->CallStaticObjectMethod(localeClass, forLanguageTagMethod, langTag);

    // Get language code
    jstring language = (jstring)env->CallObjectMethod(locale, getLanguageMethod);
    if (language != nullptr) {
        const char* langStr = env->GetStringUTFChars(language, nullptr);
        if (langStr != nullptr) {
            info.languageCode = std::string(langStr);
        }
        env->ReleaseStringUTFChars(language, langStr);
        env->DeleteLocalRef(language);
    }

    // Get region code
    jstring country = (jstring)env->CallObjectMethod(locale, getCountryMethod);
    if (country != nullptr) {
        const char* countryStr = env->GetStringUTFChars(country, nullptr);
        if (countryStr != nullptr) {
            info.regionCode = std::string(countryStr);
        }
        env->ReleaseStringUTFChars(country, countryStr);
        env->DeleteLocalRef(country);
    }

    // Get English locale for display name
    jstring enTag = env->NewStringUTF("en");
    jobject englishLocale = env->CallStaticObjectMethod(localeClass, forLanguageTagMethod, enTag);

    // Get display name in English
    jstring displayName = (jstring)env->CallObjectMethod(locale, getDisplayNameMethod, englishLocale);
    if (displayName != nullptr) {
        const char* displayStr = env->GetStringUTFChars(displayName, nullptr);
        if (displayStr != nullptr && strlen(displayStr) > 0) {
            info.displayName = std::string(displayStr);
        } else {
            info.displayName = localeCode;
        }
        env->ReleaseStringUTFChars(displayName, displayStr);
        env->DeleteLocalRef(displayName);
    } else {
        info.displayName = localeCode;
    }

    // Get native name (display name in its own language)
    jstring nativeName = (jstring)env->CallObjectMethod(locale, getDisplayNameSelfMethod);
    if (nativeName != nullptr) {
        const char* nativeStr = env->GetStringUTFChars(nativeName, nullptr);
        if (nativeStr != nullptr && strlen(nativeStr) > 0) {
            info.nativeName = std::string(nativeStr);
        } else {
            info.nativeName = info.displayName;
        }
        env->ReleaseStringUTFChars(nativeName, nativeStr);
        env->DeleteLocalRef(nativeName);
    } else {
        info.nativeName = info.displayName;
    }

    env->DeleteLocalRef(englishLocale);
    env->DeleteLocalRef(enTag);
    env->DeleteLocalRef(locale);
    env->DeleteLocalRef(langTag);
    env->DeleteLocalRef(localeClass);

    return info;
}

std::vector<LocaleInfoData> LocaleHelper::getAvailableLocalesInfo() {
    JNIEnv* env = getJNIEnv();
    std::vector<LocaleInfoData> result;

    if (env == nullptr) {
        return result;
    }

    jclass localeClass = env->FindClass("java/util/Locale");
    jmethodID getAvailableLocalesMethod = env->GetStaticMethodID(localeClass, "getAvailableLocales", "()[Ljava/util/Locale;");
    jmethodID getLanguageMethod = env->GetMethodID(localeClass, "getLanguage", "()Ljava/lang/String;");

    jobjectArray locales = (jobjectArray)env->CallStaticObjectMethod(localeClass, getAvailableLocalesMethod);
    int length = env->GetArrayLength(locales);

    // Use a set to get unique language codes
    std::vector<std::string> uniqueCodes;
    for (int i = 0; i < length; i++) {
        jobject locale = env->GetObjectArrayElement(locales, i);
        jstring language = (jstring)env->CallObjectMethod(locale, getLanguageMethod);

        const char* langStr = env->GetStringUTFChars(language, nullptr);
        std::string langCode(langStr);
        env->ReleaseStringUTFChars(language, langStr);

        // Only add non-empty unique codes
        if (!langCode.empty()) {
            bool found = false;
            for (const auto& code : uniqueCodes) {
                if (code == langCode) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                uniqueCodes.push_back(langCode);
            }
        }

        env->DeleteLocalRef(language);
        env->DeleteLocalRef(locale);
    }

    env->DeleteLocalRef(locales);
    env->DeleteLocalRef(localeClass);

    // Sort alphabetically
    std::sort(uniqueCodes.begin(), uniqueCodes.end());

    // Get full info for each locale
    result.reserve(uniqueCodes.size());
    for (const auto& code : uniqueCodes) {
        result.push_back(getLocaleInfo(code));
    }

    return result;
}

std::string LocaleHelper::getDayMinimal(int dayOfWeek) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
        return "";
    }

    requireLocaleSet();
    return cache.dayMinimal[dayOfWeek];
}

std::string LocaleHelper::getDayVeryShort(int dayOfWeek) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
        return "";
    }

    requireLocaleSet();
    return cache.dayVeryShort[dayOfWeek];
}

std::string LocaleHelper::getMonthMinimal(int month) {
    if (month < 1 || month > 12) {
        return "";
    }

    requireLocaleSet();
    return cache.monthMinimal[month - 1];
}

} // namespace margelo::nitro::rnpackages_nativedate
