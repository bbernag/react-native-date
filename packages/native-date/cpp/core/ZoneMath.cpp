#include "ZoneMath.hpp"

#include "Arithmetic.hpp"
#include "Formatter.hpp"
#include "IsoParser.hpp"

#include <cstdint>

namespace nativedate::core {

double getTimezoneOffsetForTimestamp(double timestamp, const TimezoneProvider& tz) {
    // Get the offset at a specific timestamp for the device's timezone
    // This properly handles DST using platform APIs
    std::string systemTz = tz.systemZone();
    int64_t timestampMs = static_cast<int64_t>(timestamp);
    return static_cast<double>(tz.offsetMinutes(systemTz, timestampMs).value_or(0));
}

double getOffsetInTimezone(double timestamp, const std::string& timezone, const TimezoneProvider& tz) {
    // Get the offset for a specific timezone at a specific timestamp
    // Returns offset in minutes (positive = east of UTC, negative = west)
    if (timezone == "UTC") {
        return 0;
    }
    int64_t timestampMs = static_cast<int64_t>(timestamp);
    return static_cast<double>(tz.offsetMinutes(timezone, timestampMs).value_or(0));
}

double toTimezone(double timestamp, const std::string& timezone, const TimezoneProvider& tz) {
    if (timezone == "UTC") {
        return timestamp;
    }
    // Convert UTC timestamp to display time in the specified timezone
    // Uses platform timezone APIs which properly handle DST
    int64_t timestampMs = static_cast<int64_t>(timestamp);
    int offsetMinutes = tz.offsetMinutes(timezone, timestampMs).value_or(0);
    return timestamp + (offsetMinutes * 60 * 1000);
}

std::string formatInTimezone(double timestamp, const std::string& pattern, const std::string& timezone,
                             const TimezoneProvider& tz, const LocaleProvider& locale) {
    if (timezone == "UTC") {
        return formatInternal(timestamp, pattern, true, locale);
    }
    // Adjust timestamp to target timezone, then format as UTC
    // (since toTimezone already applies the timezone offset)
    double adjustedTimestamp = toTimezone(timestamp, timezone, tz);
    return formatInternal(adjustedTimestamp, pattern, true, locale);
}

// MARK: - Timezone-aware predicates (InTz)

bool isTodayInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                 const TimezoneProvider& tz, const LocaleProvider& locale) {
    // Format both dates as yyyy-MM-dd in the target timezone and compare
    std::string dateStr = formatInTimezone(timestamp, "yyyy-MM-dd", timezone, tz, locale);
    std::string todayStr = formatInTimezone(nowTimestamp, "yyyy-MM-dd", timezone, tz, locale);
    return dateStr == todayStr;
}

bool isTomorrowInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                    const TimezoneProvider& tz, const LocaleProvider& locale) {
    // Get tomorrow's timestamp (add 1 day to now)
    double tomorrowTs = add(nowTimestamp, 1, Unit::Day);
    std::string dateStr = formatInTimezone(timestamp, "yyyy-MM-dd", timezone, tz, locale);
    std::string tomorrowStr = formatInTimezone(tomorrowTs, "yyyy-MM-dd", timezone, tz, locale);
    return dateStr == tomorrowStr;
}

bool isYesterdayInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                     const TimezoneProvider& tz, const LocaleProvider& locale) {
    // Get yesterday's timestamp (subtract 1 day from now)
    double yesterdayTs = subtract(nowTimestamp, 1, Unit::Day);
    std::string dateStr = formatInTimezone(timestamp, "yyyy-MM-dd", timezone, tz, locale);
    std::string yesterdayStr = formatInTimezone(yesterdayTs, "yyyy-MM-dd", timezone, tz, locale);
    return dateStr == yesterdayStr;
}

bool isSameDayInTz(double timestamp1, double timestamp2, const std::string& timezone,
                   const TimezoneProvider& tz, const LocaleProvider& locale) {
    // Format both as yyyy-MM-dd in timezone and compare
    std::string date1 = formatInTimezone(timestamp1, "yyyy-MM-dd", timezone, tz, locale);
    std::string date2 = formatInTimezone(timestamp2, "yyyy-MM-dd", timezone, tz, locale);
    return date1 == date2;
}

bool isSameMonthInTz(double timestamp1, double timestamp2, const std::string& timezone,
                     const TimezoneProvider& tz, const LocaleProvider& locale) {
    // Format both as yyyy-MM in timezone and compare
    std::string date1 = formatInTimezone(timestamp1, "yyyy-MM", timezone, tz, locale);
    std::string date2 = formatInTimezone(timestamp2, "yyyy-MM", timezone, tz, locale);
    return date1 == date2;
}

bool isSameYearInTz(double timestamp1, double timestamp2, const std::string& timezone,
                    const TimezoneProvider& tz, const LocaleProvider& locale) {
    // Format both as yyyy in timezone and compare
    std::string date1 = formatInTimezone(timestamp1, "yyyy", timezone, tz, locale);
    std::string date2 = formatInTimezone(timestamp2, "yyyy", timezone, tz, locale);
    return date1 == date2;
}

double startOfDayInTz(double timestamp, const std::string& timezone,
                      const TimezoneProvider& tz, const LocaleProvider& locale) {
    // Get the date string in target timezone (e.g., "2024-06-15")
    std::string dateStr = formatInTimezone(timestamp, "yyyy-MM-dd", timezone, tz, locale);

    // Parse as UTC midnight for that date
    std::string utcMidnightStr = dateStr + "T00:00:00.000Z";
    double utcMidnight = parseISO8601(utcMidnightStr);

    // Get offset for target timezone at that time (in minutes)
    double offsetMinutes = getOffsetInTimezone(utcMidnight, timezone, tz);

    // Adjust: if timezone is UTC-7 (offset=-420), midnight local = 07:00 UTC
    // So we SUBTRACT the offset (negative offset means we ADD hours)
    return utcMidnight - (offsetMinutes * 60 * 1000);
}

double endOfDayInTz(double timestamp, const std::string& timezone,
                    const TimezoneProvider& tz, const LocaleProvider& locale) {
    // End of day = start of next day - 1ms
    double nextDay = add(timestamp, 1, Unit::Day);
    return startOfDayInTz(nextDay, timezone, tz, locale) - 1;
}

} // namespace nativedate::core
