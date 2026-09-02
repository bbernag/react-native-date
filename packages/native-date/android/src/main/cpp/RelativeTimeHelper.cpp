#include "RelativeTimeHelper.hpp"
#include "JniEnv.hpp"
#include "LocaleHelper.hpp"
#include "core/RelativeBuckets.hpp"
#include <jni.h>
#include <android/log.h>
#include <optional>
#include <utility>
#include <vector>

#define LOG_TAG "NativeDate"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace margelo::nitro::rnpackages_nativedate {

using nativedate::core::DurationParts;
using nativedate::core::RelativeBucket;
using nativedate::core::RelativeDirection;
using nativedate::core::RelativeUnit;

namespace {

// RAII local-reference frame: every local ref created inside is released on
// scope exit, including on early returns.
class LocalFrame {
public:
    LocalFrame(JNIEnv* env, jint capacity) : env_(env), pushed_(env->PushLocalFrame(capacity) == JNI_OK) {}
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

// Clear and report a pending Java exception. Returns true when one was pending.
bool clearException(JNIEnv* env, const char* where) {
    if (env->ExceptionCheck() == JNI_FALSE) {
        return false;
    }
    env->ExceptionClear();
    LOGE("RelativeTimeHelper: Java exception in %s; using English fallback", where);
    return true;
}

// Returns the object, or nullptr (with the exception cleared) when the call
// failed or produced null.
jobject checkedObject(JNIEnv* env, jobject value, const char* where) {
    if (clearException(env, where) || value == nullptr) {
        return nullptr;
    }
    return value;
}

jclass findClass(JNIEnv* env, const char* name) {
    return static_cast<jclass>(checkedObject(env, env->FindClass(name), name));
}

jobject getStaticObjectField(JNIEnv* env, jclass cls, const char* name, const char* signature) {
    jfieldID field = env->GetStaticFieldID(cls, name, signature);
    if (clearException(env, name) || field == nullptr) {
        return nullptr;
    }
    return checkedObject(env, env->GetStaticObjectField(cls, field), name);
}

// java.util.Locale for the current LocaleHelper setting (or the device default).
jobject getJavaLocale(JNIEnv* env) {
    jclass localeClass = findClass(env, "java/util/Locale");
    if (localeClass == nullptr) {
        return nullptr;
    }

    std::string localeCode = LocaleHelper::getCurrentLocale();
    if (localeCode.empty()) {
        jmethodID getDefault = env->GetStaticMethodID(localeClass, "getDefault", "()Ljava/util/Locale;");
        if (clearException(env, "Locale.getDefault") || getDefault == nullptr) {
            return nullptr;
        }
        return checkedObject(env, env->CallStaticObjectMethod(localeClass, getDefault), "Locale.getDefault");
    }

    jmethodID forLanguageTag = env->GetStaticMethodID(localeClass, "forLanguageTag",
        "(Ljava/lang/String;)Ljava/util/Locale;");
    if (clearException(env, "Locale.forLanguageTag") || forLanguageTag == nullptr) {
        return nullptr;
    }
    jstring langTag = env->NewStringUTF(localeCode.c_str());
    if (clearException(env, "NewStringUTF") || langTag == nullptr) {
        return nullptr;
    }
    return checkedObject(env, env->CallStaticObjectMethod(localeClass, forLanguageTag, langTag),
        "Locale.forLanguageTag");
}

std::optional<std::string> toStdString(JNIEnv* env, jstring value) {
    if (value == nullptr) {
        return std::nullopt;
    }
    const char* chars = env->GetStringUTFChars(value, nullptr);
    if (clearException(env, "GetStringUTFChars") || chars == nullptr) {
        return std::nullopt;
    }
    std::string result(chars);
    env->ReleaseStringUTFChars(value, chars);
    if (result.empty()) {
        return std::nullopt;
    }
    return result;
}

const char* relativeUnitFieldName(RelativeUnit unit) {
    switch (unit) {
        case RelativeUnit::Minute:
            return "MINUTES";
        case RelativeUnit::Hour:
            return "HOURS";
        case RelativeUnit::Day:
            return "DAYS";
        case RelativeUnit::Month:
            return "MONTHS";
        case RelativeUnit::Year:
            return "YEARS";
    }
    return "MINUTES";
}

// android.icu.text.RelativeDateTimeFormatter (API 24+, our minSdk).
// `Direction.PLAIN` renders the bare quantity ("2 hours"); NEXT/LAST add the
// localized direction words. Returns nullopt on any JNI failure.
std::optional<std::string> formatDistanceIcu(JNIEnv* env, const RelativeBucket& bucket, bool addSuffix) {
    LocalFrame frame(env, 16);
    if (!frame.ok()) {
        clearException(env, "PushLocalFrame");
        return std::nullopt;
    }

    jclass rdtfClass = findClass(env, "android/icu/text/RelativeDateTimeFormatter");
    jclass unitClass = findClass(env, "android/icu/text/RelativeDateTimeFormatter$RelativeUnit");
    jclass directionClass = findClass(env, "android/icu/text/RelativeDateTimeFormatter$Direction");
    if (rdtfClass == nullptr || unitClass == nullptr || directionClass == nullptr) {
        return std::nullopt;
    }

    jobject locale = getJavaLocale(env);
    if (locale == nullptr) {
        return std::nullopt;
    }

    jmethodID getInstance = env->GetStaticMethodID(rdtfClass, "getInstance",
        "(Ljava/util/Locale;)Landroid/icu/text/RelativeDateTimeFormatter;");
    if (clearException(env, "RelativeDateTimeFormatter.getInstance") || getInstance == nullptr) {
        return std::nullopt;
    }
    jobject formatter = checkedObject(env, env->CallStaticObjectMethod(rdtfClass, getInstance, locale),
        "RelativeDateTimeFormatter.getInstance");
    if (formatter == nullptr) {
        return std::nullopt;
    }

    const char* directionName = "PLAIN";
    if (addSuffix) {
        directionName = bucket.direction == RelativeDirection::Future ? "NEXT" : "LAST";
    }
    jobject direction = getStaticObjectField(env, directionClass, directionName,
        "Landroid/icu/text/RelativeDateTimeFormatter$Direction;");
    jobject unit = getStaticObjectField(env, unitClass, relativeUnitFieldName(bucket.unit),
        "Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;");
    if (direction == nullptr || unit == nullptr) {
        return std::nullopt;
    }

    jmethodID format = env->GetMethodID(rdtfClass, "format",
        "(DLandroid/icu/text/RelativeDateTimeFormatter$Direction;Landroid/icu/text/RelativeDateTimeFormatter$RelativeUnit;)Ljava/lang/String;");
    if (clearException(env, "RelativeDateTimeFormatter.format") || format == nullptr) {
        return std::nullopt;
    }

    jstring result = static_cast<jstring>(checkedObject(env,
        env->CallObjectMethod(formatter, format, static_cast<jdouble>(bucket.value), direction, unit),
        "RelativeDateTimeFormatter.format"));
    return toStdString(env, result);
}

// android.icu.util.MeasureUnit.DAY/HOUR/MINUTE/SECOND are declared as
// TimeUnit; accept the MeasureUnit declaration too in case a vendor build differs.
jobject getMeasureUnit(JNIEnv* env, jclass measureUnitClass, const char* name) {
    jobject unit = getStaticObjectField(env, measureUnitClass, name, "Landroid/icu/util/TimeUnit;");
    if (unit == nullptr) {
        unit = getStaticObjectField(env, measureUnitClass, name, "Landroid/icu/util/MeasureUnit;");
    }
    return unit;
}

// android.icu.text.MeasureFormat.formatMeasures with FormatWidth.NARROW
// ("1d 2h 3m 4s" in English, localized elsewhere). Leading zero units are
// dropped to match iOS and the English fallback. Returns nullopt on failure.
std::optional<std::string> formatDurationIcu(JNIEnv* env, const DurationParts& parts) {
    LocalFrame frame(env, 32);
    if (!frame.ok()) {
        clearException(env, "PushLocalFrame");
        return std::nullopt;
    }

    jclass measureFormatClass = findClass(env, "android/icu/text/MeasureFormat");
    jclass formatWidthClass = findClass(env, "android/icu/text/MeasureFormat$FormatWidth");
    jclass measureClass = findClass(env, "android/icu/util/Measure");
    jclass measureUnitClass = findClass(env, "android/icu/util/MeasureUnit");
    jclass longClass = findClass(env, "java/lang/Long");
    if (measureFormatClass == nullptr || formatWidthClass == nullptr || measureClass == nullptr
        || measureUnitClass == nullptr || longClass == nullptr) {
        return std::nullopt;
    }

    jobject locale = getJavaLocale(env);
    jobject width = getStaticObjectField(env, formatWidthClass, "NARROW",
        "Landroid/icu/text/MeasureFormat$FormatWidth;");
    if (locale == nullptr || width == nullptr) {
        return std::nullopt;
    }

    jmethodID getInstance = env->GetStaticMethodID(measureFormatClass, "getInstance",
        "(Ljava/util/Locale;Landroid/icu/text/MeasureFormat$FormatWidth;)Landroid/icu/text/MeasureFormat;");
    if (clearException(env, "MeasureFormat.getInstance") || getInstance == nullptr) {
        return std::nullopt;
    }
    jobject formatter = checkedObject(env,
        env->CallStaticObjectMethod(measureFormatClass, getInstance, locale, width), "MeasureFormat.getInstance");
    if (formatter == nullptr) {
        return std::nullopt;
    }

    jmethodID longValueOf = env->GetStaticMethodID(longClass, "valueOf", "(J)Ljava/lang/Long;");
    jmethodID measureCtor = env->GetMethodID(measureClass, "<init>",
        "(Ljava/lang/Number;Landroid/icu/util/MeasureUnit;)V");
    if (clearException(env, "Measure.<init>") || longValueOf == nullptr || measureCtor == nullptr) {
        return std::nullopt;
    }

    std::vector<std::pair<int64_t, const char*>> components;
    if (parts.days > 0) {
        components.emplace_back(parts.days, "DAY");
    }
    if (parts.hours > 0 || parts.days > 0) {
        components.emplace_back(parts.hours, "HOUR");
    }
    if (parts.minutes > 0 || parts.hours > 0 || parts.days > 0) {
        components.emplace_back(parts.minutes, "MINUTE");
    }
    components.emplace_back(parts.seconds, "SECOND");

    jobjectArray measures = static_cast<jobjectArray>(checkedObject(env,
        env->NewObjectArray(static_cast<jsize>(components.size()), measureClass, nullptr), "NewObjectArray"));
    if (measures == nullptr) {
        return std::nullopt;
    }

    for (jsize i = 0; i < static_cast<jsize>(components.size()); ++i) {
        jobject unit = getMeasureUnit(env, measureUnitClass, components[i].second);
        jobject number = checkedObject(env,
            env->CallStaticObjectMethod(longClass, longValueOf, static_cast<jlong>(components[i].first)),
            "Long.valueOf");
        if (unit == nullptr || number == nullptr) {
            return std::nullopt;
        }
        jobject measure = checkedObject(env, env->NewObject(measureClass, measureCtor, number, unit), "Measure.<init>");
        if (measure == nullptr) {
            return std::nullopt;
        }
        env->SetObjectArrayElement(measures, i, measure);
        if (clearException(env, "SetObjectArrayElement")) {
            return std::nullopt;
        }
        env->DeleteLocalRef(measure);
        env->DeleteLocalRef(number);
        env->DeleteLocalRef(unit);
    }

    jmethodID formatMeasures = env->GetMethodID(measureFormatClass, "formatMeasures",
        "([Landroid/icu/util/Measure;)Ljava/lang/String;");
    if (clearException(env, "MeasureFormat.formatMeasures") || formatMeasures == nullptr) {
        return std::nullopt;
    }

    jstring result = static_cast<jstring>(checkedObject(env,
        env->CallObjectMethod(formatter, formatMeasures, measures), "MeasureFormat.formatMeasures"));
    return toStdString(env, result);
}

} // namespace

std::string RelativeTimeHelper::formatDistance(double timestamp, double baseTimestamp, bool addSuffix) {
    // Throws std::invalid_argument for non-finite input before touching JNI.
    const RelativeBucket bucket = nativedate::core::relativeBucket(timestamp, baseTimestamp);

    if (JNIEnv* env = JniEnv::get()) {
        if (auto result = formatDistanceIcu(env, bucket, addSuffix)) {
            return *result;
        }
    }
    return nativedate::core::formatRelativeEnglish(bucket, addSuffix);
}

std::string RelativeTimeHelper::formatDuration(double milliseconds) {
    // Throws std::invalid_argument for NaN/Inf; clamps to kMaxDurationMs.
    const DurationParts parts = nativedate::core::decomposeDuration(milliseconds);

    if (JNIEnv* env = JniEnv::get()) {
        if (auto result = formatDurationIcu(env, parts)) {
            return *result;
        }
    }
    return nativedate::core::formatDurationEnglish(parts);
}

} // namespace margelo::nitro::rnpackages_nativedate
