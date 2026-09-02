#pragma once

#include "Providers.hpp"

#include <string>

// Timezone-aware date math. Every function takes the providers it needs so
// the host unit tests can run against table-driven fakes.

namespace nativedate::core {

/** Offset in minutes of the device timezone at `timestamp`. */
double getTimezoneOffsetForTimestamp(double timestamp, const TimezoneProvider& tz);

/** Offset in minutes of `timezone` at `timestamp` (positive = east of UTC). */
double getOffsetInTimezone(double timestamp, const std::string& timezone, const TimezoneProvider& tz);

/**
 * Shift a UTC timestamp by the zone offset so that formatting the result as UTC
 * yields the wall clock in `timezone`.
 */
double toTimezone(double timestamp, const std::string& timezone, const TimezoneProvider& tz);

std::string formatInTimezone(double timestamp, const std::string& pattern, const std::string& timezone,
                             const TimezoneProvider& tz, const LocaleProvider& locale);

// Timezone-aware predicates. `nowTimestamp` is the reference "now" so callers
// (and tests) control the clock.
bool isTodayInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                 const TimezoneProvider& tz, const LocaleProvider& locale);
bool isTomorrowInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                    const TimezoneProvider& tz, const LocaleProvider& locale);
bool isYesterdayInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                     const TimezoneProvider& tz, const LocaleProvider& locale);
bool isSameDayInTz(double timestamp1, double timestamp2, const std::string& timezone,
                   const TimezoneProvider& tz, const LocaleProvider& locale);
bool isSameMonthInTz(double timestamp1, double timestamp2, const std::string& timezone,
                     const TimezoneProvider& tz, const LocaleProvider& locale);
bool isSameYearInTz(double timestamp1, double timestamp2, const std::string& timezone,
                    const TimezoneProvider& tz, const LocaleProvider& locale);

double startOfDayInTz(double timestamp, const std::string& timezone,
                      const TimezoneProvider& tz, const LocaleProvider& locale);
double endOfDayInTz(double timestamp, const std::string& timezone,
                    const TimezoneProvider& tz, const LocaleProvider& locale);

} // namespace nativedate::core
