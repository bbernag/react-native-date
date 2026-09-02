#include "ZoneMath.hpp"

#include "Civil.hpp"
#include "Formatter.hpp"
#include "ZoneNames.hpp"

#include <algorithm>
#include <cstdint>
#include <stdexcept>

namespace nativedate::core {

namespace {

/** Bounded, human-readable error for an unknown zone. The input is truncated so a hostile string cannot bloat the message. */
[[noreturn]] void throwInvalidZone(const std::string& input) {
    constexpr std::size_t kShown = 64;
    std::string shown = input.substr(0, kShown);
    if (input.size() > kShown) {
        shown += "...";
    }
    throw std::invalid_argument("Invalid timezone: '" + shown + "'");
}

/**
 * Normalize `timezone` and require the provider to know it.
 * @return ZoneNames::kUtc for any UTC alias, otherwise the normalized IANA id.
 */
std::string resolveZone(const std::string& timezone, const TimezoneProvider& tz) {
    std::string zone = ZoneNames::normalize(timezone);
    if (zone == ZoneNames::kUtc) {
        return zone;
    }
    if (!ZoneNames::isWellFormed(zone) || !tz.isValidZone(zone)) {
        throwInvalidZone(timezone);
    }
    return zone;
}

/** Offset in minutes of a resolved zone at `utcMs`. */
int offsetAt(const std::string& zone, int64_t utcMs, const TimezoneProvider& tz) {
    if (zone == ZoneNames::kUtc) {
        return 0;
    }
    std::optional<int> offset = tz.offsetMinutes(zone, utcMs);
    if (!offset.has_value()) {
        // The zone passed isValidZone but the platform could not resolve it; treat as invalid rather than guess.
        throwInvalidZone(zone);
    }
    return *offset;
}

/** Wall-clock milliseconds in `zone` at `utcMs` (a "shifted epoch", not an instant). */
int64_t localMs(const std::string& zone, int64_t utcMs, const TimezoneProvider& tz) {
    return utcMs + static_cast<int64_t>(offsetAt(zone, utcMs, tz)) * MS_PER_MINUTE;
}

/** Civil day number (days since 1970-01-01) of `utcMs` in `zone`. */
int64_t civilDayNumber(const std::string& zone, int64_t utcMs, const TimezoneProvider& tz) {
    return floorDiv(localMs(zone, utcMs, tz), MS_PER_DAY);
}

/**
 * UTC instant at which the wall clock in `zone` reads `localMidnightMs`
 * (a civil midnight expressed as milliseconds on the shifted epoch).
 *
 * Every instant `c` that maps to that wall clock satisfies
 * `c + offset(c) == localMidnightMs`, and `|c - localMidnightMs|` is at most
 * the zone's offset, so any transition that matters lies within a day of the
 * wall-clock value. Probe the offsets one day before and after it:
 *
 * - equal offsets: no transition nearby, one candidate, no further lookups;
 * - different offsets: a transition happened. Build a candidate from each
 *   offset and check which is real. In an overlap (clocks fall back through
 *   midnight) both are real and the earlier wins; in a gap (clocks spring
 *   forward over midnight) neither is real and the later candidate is the
 *   first instant after the gap, i.e. the local time shifted forward by the
 *   gap length, matching java.time's resolution.
 */
int64_t zonedMidnight(const std::string& zone, int64_t localMidnightMs, const TimezoneProvider& tz) {
    const int64_t offsetBefore = static_cast<int64_t>(offsetAt(zone, localMidnightMs - MS_PER_DAY, tz)) * MS_PER_MINUTE;
    const int64_t offsetAfter = static_cast<int64_t>(offsetAt(zone, localMidnightMs + MS_PER_DAY, tz)) * MS_PER_MINUTE;
    if (offsetBefore == offsetAfter) {
        return localMidnightMs - offsetBefore;
    }

    const int64_t earlier = localMidnightMs - std::max(offsetBefore, offsetAfter);
    const int64_t later = localMidnightMs - std::min(offsetBefore, offsetAfter);
    const bool earlierIsReal = localMs(zone, earlier, tz) == localMidnightMs;
    return earlierIsReal ? earlier : later;
}

int64_t toMs(double timestamp) {
    return static_cast<int64_t>(timestamp);
}

} // namespace

double getTimezoneOffsetForTimestamp(double timestamp, const TimezoneProvider& tz) {
    requireValidTimestamp(timestamp);
    // The device zone comes from the platform itself, so it is always resolvable;
    // a missing offset would indicate a broken provider rather than bad input.
    std::string systemTz = tz.systemZone();
    return static_cast<double>(tz.offsetMinutes(systemTz, toMs(timestamp)).value_or(0));
}

double getOffsetInTimezone(double timestamp, const std::string& timezone, const TimezoneProvider& tz) {
    requireValidTimestamp(timestamp);
    std::string zone = resolveZone(timezone, tz);
    return static_cast<double>(offsetAt(zone, toMs(timestamp), tz));
}

double toTimezone(double timestamp, const std::string& timezone, const TimezoneProvider& tz) {
    requireValidTimestamp(timestamp);
    std::string zone = resolveZone(timezone, tz);
    if (zone == ZoneNames::kUtc) {
        return timestamp;
    }
    int offsetMinutes = offsetAt(zone, toMs(timestamp), tz);
    return timestamp + static_cast<double>(offsetMinutes) * 60.0 * 1000.0;
}

std::string formatInTimezone(double timestamp, const std::string& pattern, const std::string& timezone,
                             const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp);
    // Shift to the zone's wall clock, then format that shifted epoch as UTC.
    double adjustedTimestamp = toTimezone(timestamp, timezone, tz);
    return formatInternal(adjustedTimestamp, pattern, true, locale);
}

// MARK: - Timezone-aware predicates (InTz)

bool isTodayInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                 const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp);
    requireValidTimestamp(nowTimestamp);
    std::string zone = resolveZone(timezone, tz);
    return civilDayNumber(zone, toMs(timestamp), tz) == civilDayNumber(zone, toMs(nowTimestamp), tz);
}

bool isTomorrowInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                    const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp);
    requireValidTimestamp(nowTimestamp);
    std::string zone = resolveZone(timezone, tz);
    // Civil date + 1 in `zone`, not add(..., Unit::Day) (that is device-zone calendar math).
    return civilDayNumber(zone, toMs(timestamp), tz) == civilDayNumber(zone, toMs(nowTimestamp), tz) + 1;
}

bool isYesterdayInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                     const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp);
    requireValidTimestamp(nowTimestamp);
    std::string zone = resolveZone(timezone, tz);
    return civilDayNumber(zone, toMs(timestamp), tz) == civilDayNumber(zone, toMs(nowTimestamp), tz) - 1;
}

bool isSameDayInTz(double timestamp1, double timestamp2, const std::string& timezone,
                   const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp1);
    requireValidTimestamp(timestamp2);
    std::string zone = resolveZone(timezone, tz);
    return civilDayNumber(zone, toMs(timestamp1), tz) == civilDayNumber(zone, toMs(timestamp2), tz);
}

bool isSameMonthInTz(double timestamp1, double timestamp2, const std::string& timezone,
                     const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp1);
    requireValidTimestamp(timestamp2);
    std::string zone = resolveZone(timezone, tz);
    CivilDate a = civilFromDays(civilDayNumber(zone, toMs(timestamp1), tz));
    CivilDate b = civilFromDays(civilDayNumber(zone, toMs(timestamp2), tz));
    return a.year == b.year && a.month == b.month;
}

bool isSameYearInTz(double timestamp1, double timestamp2, const std::string& timezone,
                    const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp1);
    requireValidTimestamp(timestamp2);
    std::string zone = resolveZone(timezone, tz);
    CivilDate a = civilFromDays(civilDayNumber(zone, toMs(timestamp1), tz));
    CivilDate b = civilFromDays(civilDayNumber(zone, toMs(timestamp2), tz));
    return a.year == b.year;
}

double startOfDayInTz(double timestamp, const std::string& timezone,
                      const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp);
    std::string zone = resolveZone(timezone, tz);
    int64_t day = civilDayNumber(zone, toMs(timestamp), tz);
    return static_cast<double>(zonedMidnight(zone, day * MS_PER_DAY, tz));
}

double endOfDayInTz(double timestamp, const std::string& timezone,
                    const TimezoneProvider& tz, const LocaleProvider& locale) {
    requireValidTimestamp(timestamp);
    std::string zone = resolveZone(timezone, tz);
    // Next civil date in `zone` (not add(..., Unit::Day), which uses the device zone).
    int64_t day = civilDayNumber(zone, toMs(timestamp), tz);
    return static_cast<double>(zonedMidnight(zone, (day + 1) * MS_PER_DAY, tz) - 1);
}

} // namespace nativedate::core
