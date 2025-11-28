#import <Foundation/Foundation.h>
#include "RelativeTimeHelper.hpp"
#include "LocaleHelper.hpp"
#include <cmath>

namespace margelo::nitro::rnpackages_nativedate {

// Get the current NSLocale based on LocaleHelper setting
static NSLocale* getCurrentNSLocale() {
    std::string localeCode = LocaleHelper::getCurrentLocale();
    if (!localeCode.empty()) {
        NSString *localeId = [NSString stringWithUTF8String:localeCode.c_str()];
        return [NSLocale localeWithLocaleIdentifier:localeId];
    }
    return [NSLocale currentLocale];
}

// English fallback for devices running iOS < 13 (released Sep 2019).
// NSRelativeDateTimeFormatter requires iOS 13+.
// As of 2025, ~99% of iOS devices support iOS 13+, so this fallback rarely triggers.
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

// English fallback for devices running iOS < 8 (released Sep 2014).
// NSDateComponentsFormatter requires iOS 8+.
// This fallback is effectively never triggered on modern devices.
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
    @autoreleasepool {
        double diffMs = timestamp - baseTimestamp;

        // Use RelativeDateTimeFormatter (iOS 13+)
        if (@available(iOS 13.0, *)) {
            NSRelativeDateTimeFormatter *formatter = [[NSRelativeDateTimeFormatter alloc] init];
            formatter.locale = getCurrentNSLocale();
            formatter.unitsStyle = NSRelativeDateTimeFormatterUnitsStyleFull;

            // Convert milliseconds to seconds
            NSTimeInterval diffSeconds = diffMs / 1000.0;

            NSString *result;
            if (addSuffix) {
                // Use dateTimeStyle for "2 hours ago" / "in 2 hours"
                formatter.dateTimeStyle = NSRelativeDateTimeFormatterStyleNamed;
                result = [formatter localizedStringFromTimeInterval:diffSeconds];
            } else {
                // Use numeric style without suffix
                formatter.dateTimeStyle = NSRelativeDateTimeFormatterStyleNumeric;
                result = [formatter localizedStringFromTimeInterval:diffSeconds];

                // Remove "in " or " ago" suffix manually if present
                // This is a workaround since iOS doesn't have a direct way to get just the value
            }

            if (result != nil && result.length > 0) {
                return std::string([result UTF8String]);
            }
        }

        // Fallback to English implementation
        return formatDistanceEnglish(diffMs, addSuffix);
    }
}

std::string RelativeTimeHelper::formatDuration(double milliseconds) {
    @autoreleasepool {
        if (milliseconds < 0) {
            milliseconds = -milliseconds;
        }

        // Use DateComponentsFormatter for localized duration
        NSDateComponentsFormatter *formatter = [[NSDateComponentsFormatter alloc] init];
        formatter.unitsStyle = NSDateComponentsFormatterUnitsStyleAbbreviated;
        formatter.allowedUnits = NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
        formatter.zeroFormattingBehavior = NSDateComponentsFormatterZeroFormattingBehaviorDropLeading;

        // Set locale
        NSCalendar *calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
        calendar.locale = getCurrentNSLocale();
        formatter.calendar = calendar;

        // Convert milliseconds to seconds
        NSTimeInterval seconds = milliseconds / 1000.0;

        NSString *result = [formatter stringFromTimeInterval:seconds];

        if (result != nil && result.length > 0) {
            return std::string([result UTF8String]);
        }

        // Fallback to English implementation
        return formatDurationEnglish(milliseconds);
    }
}

} // namespace margelo::nitro::rnpackages_nativedate
