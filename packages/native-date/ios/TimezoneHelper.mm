#import <Foundation/Foundation.h>
#include "TimezoneHelper.hpp"
#include <unordered_map>

namespace margelo::nitro::rnpackages_nativedate {

std::string TimezoneHelper::getSystemTimezone() {
    @autoreleasepool {
        NSTimeZone *systemZone = [NSTimeZone systemTimeZone];
        return std::string([systemZone.name UTF8String]);
    }
}

int TimezoneHelper::getOffsetForTimestamp(const std::string& timezone, int64_t timestampMs) {
    @autoreleasepool {
        // Normalize timezone abbreviations first
        std::string normalizedTz = normalizeTimezone(timezone);

        NSString *tzName = [NSString stringWithUTF8String:normalizedTz.c_str()];
        NSTimeZone *tz = [NSTimeZone timeZoneWithName:tzName];

        if (tz == nil) {
            // Fallback to system timezone if invalid
            tz = [NSTimeZone systemTimeZone];
        }

        // Create NSDate from timestamp
        NSDate *date = [NSDate dateWithTimeIntervalSince1970:(timestampMs / 1000.0)];

        // Get offset in seconds, convert to minutes
        // NSTimeZone automatically handles DST for the given date
        NSInteger offsetSeconds = [tz secondsFromGMTForDate:date];
        return static_cast<int>(offsetSeconds / 60);
    }
}

std::vector<std::string> TimezoneHelper::getAvailableTimezones() {
    @autoreleasepool {
        std::vector<std::string> result;

        NSArray<NSString *> *knownTimezones = [NSTimeZone knownTimeZoneNames];
        result.reserve([knownTimezones count]);

        for (NSString *tz in knownTimezones) {
            result.push_back(std::string([tz UTF8String]));
        }

        return result;
    }
}

bool TimezoneHelper::isValidTimezone(const std::string& timezone) {
    @autoreleasepool {
        std::string normalizedTz = normalizeTimezone(timezone);
        NSString *tzName = [NSString stringWithUTF8String:normalizedTz.c_str()];
        NSTimeZone *tz = [NSTimeZone timeZoneWithName:tzName];
        return tz != nil;
    }
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
        {"GMT", "Europe/London"},
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

    // Check if it's already a valid IANA name by trying to create a timezone
    @autoreleasepool {
        NSString *tzName = [NSString stringWithUTF8String:timezone.c_str()];
        NSTimeZone *tz = [NSTimeZone timeZoneWithName:tzName];
        if (tz != nil) {
            // Return the canonical name from the system
            return std::string([tz.name UTF8String]);
        }
    }

    // Return as-is if nothing matches
    return timezone;
}

} // namespace margelo::nitro::rnpackages_nativedate
