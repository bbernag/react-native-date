#include "RelativeTimeHelper.hpp"
#include "LocaleHelper.hpp"
#include <jni.h>
#include <android/log.h>
#include <cmath>
#include <mutex>

#define LOG_TAG "NativeDate"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace margelo::nitro::rnpackages_nativedate {

// Store JavaVM reference (set during JNI_OnLoad)
static JavaVM* g_jvm = nullptr;

// Call this from JNI_OnLoad
extern "C" void RelativeTimeHelper_setJavaVM(JavaVM* vm) {
    g_jvm = vm;
}

// Get JNIEnv for current thread
static JNIEnv* getJNIEnv() {
    if (g_jvm == nullptr) {
        LOGE("JavaVM not initialized for RelativeTimeHelper");
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
    std::string localeCode = LocaleHelper::getCurrentLocale();

    jclass localeClass = env->FindClass("java/util/Locale");

    if (localeCode.empty()) {
        jmethodID getDefaultMethod = env->GetStaticMethodID(localeClass, "getDefault", "()Ljava/util/Locale;");
        jobject locale = env->CallStaticObjectMethod(localeClass, getDefaultMethod);
        env->DeleteLocalRef(localeClass);
        return locale;
    }

    jmethodID forLanguageTagMethod = env->GetStaticMethodID(localeClass, "forLanguageTag", "(Ljava/lang/String;)Ljava/util/Locale;");
    jstring langTag = env->NewStringUTF(localeCode.c_str());
    jobject locale = env->CallStaticObjectMethod(localeClass, forLanguageTagMethod, langTag);

    env->DeleteLocalRef(langTag);
    env->DeleteLocalRef(localeClass);

    return locale;
}

// English fallback for devices running Android < API 24 (Android 7.0 Nougat, released Aug 2016).
// android.icu.text.RelativeDateTimeFormatter requires API 24+.
// As of 2025, ~99% of Android devices support API 24+, so this fallback rarely triggers.
std::string RelativeTimeHelper::formatDistanceEnglish(double diffMs, bool addSuffix) {
    bool isFuture = diffMs > 0;
    double absDiffMs = std::abs(diffMs);

    double seconds = absDiffMs / 1000.0;
    double minutes = seconds / 60.0;
    double hours = minutes / 60.0;
    double days = hours / 24.0;
    double months = days / 30.0;
    double years = days / 365.0;

    std::string result;

    if (seconds < 30) {
        result = "less than a minute";
    } else if (seconds < 90) {
        result = "1 minute";
    } else if (minutes < 45) {
        result = std::to_string(static_cast<int>(std::round(minutes))) + " minutes";
    } else if (minutes < 90) {
        result = "about 1 hour";
    } else if (hours < 24) {
        result = "about " + std::to_string(static_cast<int>(std::round(hours))) + " hours";
    } else if (hours < 42) {
        result = "1 day";
    } else if (days < 30) {
        result = std::to_string(static_cast<int>(std::round(days))) + " days";
    } else if (days < 45) {
        result = "about 1 month";
    } else if (days < 365) {
        result = std::to_string(static_cast<int>(std::round(months))) + " months";
    } else if (years < 1.5) {
        result = "about 1 year";
    } else if (years < 2.5) {
        result = "over 1 year";
    } else {
        result = "about " + std::to_string(static_cast<int>(std::round(years))) + " years";
    }

    if (addSuffix) {
        if (isFuture) {
            result = "in " + result;
        } else {
            result = result + " ago";
        }
    }

    return result;
}

// English fallback for duration formatting.
// android.icu.text.MeasureFormat requires API 24+ and is complex to use via JNI,
// so we use this simplified English format (e.g., "1d 2h 3m 4s") as the default.
std::string RelativeTimeHelper::formatDurationEnglish(double milliseconds) {
    if (milliseconds < 0) {
        milliseconds = -milliseconds;
    }

    int64_t totalSeconds = static_cast<int64_t>(milliseconds / 1000.0);
    int64_t totalMinutes = totalSeconds / 60;
    int64_t totalHours = totalMinutes / 60;
    int64_t totalDays = totalHours / 24;

    int64_t seconds = totalSeconds % 60;
    int64_t minutes = totalMinutes % 60;
    int64_t hours = totalHours % 24;
    int64_t days = totalDays;

    std::string result;

    if (days > 0) {
        result += std::to_string(days) + "d ";
    }
    if (hours > 0 || days > 0) {
        result += std::to_string(hours) + "h ";
    }
    if (minutes > 0 || hours > 0 || days > 0) {
        result += std::to_string(minutes) + "m ";
    }
    result += std::to_string(seconds) + "s";

    return result;
}

std::string RelativeTimeHelper::formatDistance(double timestamp, double baseTimestamp, bool addSuffix) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return formatDistanceEnglish(timestamp - baseTimestamp, addSuffix);
    }

    double diffMs = timestamp - baseTimestamp;

    // Try to use android.icu.text.RelativeDateTimeFormatter (API 24+)
    jclass rdtfClass = env->FindClass("android/icu/text/RelativeDateTimeFormatter");
    if (rdtfClass == nullptr) {
        // Clear exception and fallback
        env->ExceptionClear();
        return formatDistanceEnglish(diffMs, addSuffix);
    }

    jobject locale = getJavaLocale(env);

    // Get formatter instance for locale
    jmethodID getInstanceMethod = env->GetStaticMethodID(rdtfClass, "getInstance",
        "(Ljava/util/Locale;)Landroid/icu/text/RelativeDateTimeFormatter;");
    jobject formatter = env->CallStaticObjectMethod(rdtfClass, getInstanceMethod, locale);

    if (formatter == nullptr) {
        env->DeleteLocalRef(locale);
        env->DeleteLocalRef(rdtfClass);
        return formatDistanceEnglish(diffMs, addSuffix);
    }

    // Determine the appropriate unit and value
    double absDiffMs = std::abs(diffMs);
    double seconds = absDiffMs / 1000.0;
    double minutes = seconds / 60.0;
    double hours = minutes / 60.0;
    double days = hours / 24.0;
    double weeks = days / 7.0;
    double months = days / 30.0;
    double years = days / 365.0;

    // Get RelativeUnit class
    jclass relativeUnitClass = env->FindClass("android/icu/text/RelativeDateTimeFormatter$RelativeUnit");
    jclass directionClass = env->FindClass("android/icu/text/RelativeDateTimeFormatter$Direction");

    if (relativeUnitClass == nullptr || directionClass == nullptr) {
        env->ExceptionClear();
        env->DeleteLocalRef(formatter);
        env->DeleteLocalRef(locale);
        env->DeleteLocalRef(rdtfClass);
        return formatDistanceEnglish(diffMs, addSuffix);
    }

    // Get the format method
    jmethodID formatMethod = env->GetMethodID(rdtfClass, "format",
        "(DLandroid/icu/text/RelativeDateTimeFormatter$Direction;Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;)Ljava/lang/String;");

    // Determine unit and value
    jobject unit = nullptr;
    jobject direction = nullptr;
    double value = 0;

    // Get direction
    jfieldID directionField;
    if (diffMs > 0) {
        directionField = env->GetStaticFieldID(directionClass, "NEXT", "Landroid/icu/text/RelativeDateTimeFormatter$Direction;");
    } else {
        directionField = env->GetStaticFieldID(directionClass, "LAST", "Landroid/icu/text/RelativeDateTimeFormatter$Direction;");
    }
    direction = env->GetStaticObjectField(directionClass, directionField);

    // Get appropriate unit based on magnitude
    jfieldID unitField;
    if (minutes < 1) {
        unitField = env->GetStaticFieldID(relativeUnitClass, "SECONDS", "Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;");
        value = std::round(seconds);
    } else if (hours < 1) {
        unitField = env->GetStaticFieldID(relativeUnitClass, "MINUTES", "Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;");
        value = std::round(minutes);
    } else if (days < 1) {
        unitField = env->GetStaticFieldID(relativeUnitClass, "HOURS", "Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;");
        value = std::round(hours);
    } else if (weeks < 2) {
        unitField = env->GetStaticFieldID(relativeUnitClass, "DAYS", "Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;");
        value = std::round(days);
    } else if (months < 1) {
        unitField = env->GetStaticFieldID(relativeUnitClass, "WEEKS", "Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;");
        value = std::round(weeks);
    } else if (years < 1) {
        unitField = env->GetStaticFieldID(relativeUnitClass, "MONTHS", "Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;");
        value = std::round(months);
    } else {
        unitField = env->GetStaticFieldID(relativeUnitClass, "YEARS", "Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;");
        value = std::round(years);
    }
    unit = env->GetStaticObjectField(relativeUnitClass, unitField);

    // Format the result
    jstring result = (jstring)env->CallObjectMethod(formatter, formatMethod, value, direction, unit);

    std::string formattedResult;
    if (result != nullptr) {
        const char* resultStr = env->GetStringUTFChars(result, nullptr);
        if (resultStr != nullptr) {
            formattedResult = std::string(resultStr);
        }
        env->ReleaseStringUTFChars(result, resultStr);
        env->DeleteLocalRef(result);
    }

    // Cleanup
    env->DeleteLocalRef(unit);
    env->DeleteLocalRef(direction);
    env->DeleteLocalRef(directionClass);
    env->DeleteLocalRef(relativeUnitClass);
    env->DeleteLocalRef(formatter);
    env->DeleteLocalRef(locale);
    env->DeleteLocalRef(rdtfClass);

    if (formattedResult.empty()) {
        return formatDistanceEnglish(diffMs, addSuffix);
    }

    return formattedResult;
}

std::string RelativeTimeHelper::formatDuration(double milliseconds) {
    JNIEnv* env = getJNIEnv();
    if (env == nullptr) {
        return formatDurationEnglish(milliseconds);
    }

    if (milliseconds < 0) {
        milliseconds = -milliseconds;
    }

    // Try to use android.icu.text.MeasureFormat for localized duration
    jclass measureFormatClass = env->FindClass("android/icu/text/MeasureFormat");
    if (measureFormatClass == nullptr) {
        env->ExceptionClear();
        return formatDurationEnglish(milliseconds);
    }

    jobject locale = getJavaLocale(env);

    // Get FormatWidth.SHORT
    jclass formatWidthClass = env->FindClass("android/icu/text/MeasureFormat$FormatWidth");
    if (formatWidthClass == nullptr) {
        env->ExceptionClear();
        env->DeleteLocalRef(locale);
        env->DeleteLocalRef(measureFormatClass);
        return formatDurationEnglish(milliseconds);
    }

    jfieldID shortField = env->GetStaticFieldID(formatWidthClass, "SHORT", "Landroid/icu/text/MeasureFormat$FormatWidth;");
    jobject formatWidth = env->GetStaticObjectField(formatWidthClass, shortField);

    // Get MeasureFormat instance
    jmethodID getInstanceMethod = env->GetStaticMethodID(measureFormatClass, "getInstance",
        "(Ljava/util/Locale;Landroid/icu/text/MeasureFormat$FormatWidth;)Landroid/icu/text/MeasureFormat;");
    jobject formatter = env->CallStaticObjectMethod(measureFormatClass, getInstanceMethod, locale, formatWidth);

    if (formatter == nullptr) {
        env->DeleteLocalRef(formatWidth);
        env->DeleteLocalRef(formatWidthClass);
        env->DeleteLocalRef(locale);
        env->DeleteLocalRef(measureFormatClass);
        return formatDurationEnglish(milliseconds);
    }

    // Calculate components
    int64_t totalSeconds = static_cast<int64_t>(milliseconds / 1000.0);
    int64_t totalMinutes = totalSeconds / 60;
    int64_t totalHours = totalMinutes / 60;
    int64_t totalDays = totalHours / 24;

    int64_t seconds = totalSeconds % 60;
    int64_t minutes = totalMinutes % 60;
    int64_t hours = totalHours % 24;
    int64_t days = totalDays;

    // Build the result string using the formatter
    // For simplicity, fallback to English formatting since MeasureFormat requires Measure objects
    // which are complex to create via JNI
    env->DeleteLocalRef(formatter);
    env->DeleteLocalRef(formatWidth);
    env->DeleteLocalRef(formatWidthClass);
    env->DeleteLocalRef(locale);
    env->DeleteLocalRef(measureFormatClass);

    return formatDurationEnglish(milliseconds);
}

} // namespace margelo::nitro::rnpackages_nativedate
