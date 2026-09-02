#include "RelativeBuckets.hpp"

#include <cmath>
#include <stdexcept>

namespace nativedate::core {

namespace {

constexpr double kMsPerSecond = 1000.0;
constexpr double kSecondsPerMinute = 60.0;
constexpr double kMinutesPerHour = 60.0;
constexpr double kHoursPerDay = 24.0;
constexpr double kDaysPerMonth = 30.0;
constexpr double kDaysPerYear = 365.0;

int64_t roundToInt(double value) {
    return static_cast<int64_t>(std::round(value));
}

const char* unitWord(RelativeUnit unit, bool plural) {
    switch (unit) {
        case RelativeUnit::Minute:
            return plural ? "minutes" : "minute";
        case RelativeUnit::Hour:
            return plural ? "hours" : "hour";
        case RelativeUnit::Day:
            return plural ? "days" : "day";
        case RelativeUnit::Month:
            return plural ? "months" : "month";
        case RelativeUnit::Year:
            return plural ? "years" : "year";
    }
    return "";
}

} // namespace

RelativeBucket relativeBucket(double timestamp, double baseTimestamp) {
    if (!std::isfinite(timestamp) || !std::isfinite(baseTimestamp)) {
        throw std::invalid_argument("formatDistance: timestamps must be finite numbers");
    }
    return relativeBucketFromDiff(timestamp - baseTimestamp);
}

RelativeBucket relativeBucketFromDiff(double diffMs) {
    if (!std::isfinite(diffMs)) {
        throw std::invalid_argument("formatDistance: difference must be a finite number");
    }

    const RelativeDirection direction =
        diffMs > 0 ? RelativeDirection::Future : RelativeDirection::Past;

    const double seconds = std::fabs(diffMs) / kMsPerSecond;
    const double minutes = seconds / kSecondsPerMinute;
    const double hours = minutes / kMinutesPerHour;
    const double days = hours / kHoursPerDay;
    const double months = days / kDaysPerMonth;
    const double years = days / kDaysPerYear;

    if (seconds < 30) {
        return {1, RelativeUnit::Minute, RelativeQualifier::LessThan, direction};
    }
    if (seconds < 90) {
        return {1, RelativeUnit::Minute, RelativeQualifier::None, direction};
    }
    if (minutes < 45) {
        return {roundToInt(minutes), RelativeUnit::Minute, RelativeQualifier::None, direction};
    }
    if (minutes < 90) {
        return {1, RelativeUnit::Hour, RelativeQualifier::About, direction};
    }
    if (hours < 24) {
        return {roundToInt(hours), RelativeUnit::Hour, RelativeQualifier::About, direction};
    }
    if (hours < 42) {
        return {1, RelativeUnit::Day, RelativeQualifier::None, direction};
    }
    if (days < 30) {
        return {roundToInt(days), RelativeUnit::Day, RelativeQualifier::None, direction};
    }
    if (days < 45) {
        return {1, RelativeUnit::Month, RelativeQualifier::About, direction};
    }
    if (days < 365) {
        return {roundToInt(months), RelativeUnit::Month, RelativeQualifier::None, direction};
    }
    if (years < 1.5) {
        return {1, RelativeUnit::Year, RelativeQualifier::About, direction};
    }
    if (years < 2.5) {
        return {1, RelativeUnit::Year, RelativeQualifier::Over, direction};
    }
    return {roundToInt(years), RelativeUnit::Year, RelativeQualifier::About, direction};
}

std::string formatRelativeEnglish(const RelativeBucket& bucket, bool addSuffix) {
    std::string result;

    switch (bucket.qualifier) {
        case RelativeQualifier::LessThan:
            result = "less than a ";
            break;
        case RelativeQualifier::About:
            result = "about ";
            break;
        case RelativeQualifier::Over:
            result = "over ";
            break;
        case RelativeQualifier::None:
            break;
    }

    if (bucket.qualifier != RelativeQualifier::LessThan) {
        result += std::to_string(bucket.value) + " ";
    }
    result += unitWord(bucket.unit, bucket.value != 1);

    if (addSuffix) {
        if (bucket.direction == RelativeDirection::Future) {
            result = "in " + result;
        } else {
            result += " ago";
        }
    }

    return result;
}

DurationParts decomposeDuration(double milliseconds) {
    if (!std::isfinite(milliseconds)) {
        throw std::invalid_argument("formatDuration: milliseconds must be a finite number");
    }

    double magnitude = std::fabs(milliseconds);
    if (magnitude > kMaxDurationMs) {
        magnitude = kMaxDurationMs;
    }

    const int64_t totalSeconds = static_cast<int64_t>(magnitude / kMsPerSecond);
    const int64_t totalMinutes = totalSeconds / 60;
    const int64_t totalHours = totalMinutes / 60;

    return {
        totalHours / 24,
        totalHours % 24,
        totalMinutes % 60,
        totalSeconds % 60,
    };
}

std::string formatDurationEnglish(const DurationParts& parts) {
    std::string result;

    if (parts.days > 0) {
        result += std::to_string(parts.days) + "d ";
    }
    if (parts.hours > 0 || parts.days > 0) {
        result += std::to_string(parts.hours) + "h ";
    }
    if (parts.minutes > 0 || parts.hours > 0 || parts.days > 0) {
        result += std::to_string(parts.minutes) + "m ";
    }
    result += std::to_string(parts.seconds) + "s";

    return result;
}

} // namespace nativedate::core
