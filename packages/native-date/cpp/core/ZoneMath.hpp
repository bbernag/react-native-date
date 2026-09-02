#pragma once

#include "Providers.hpp"

#include <string>

// Timezone-aware date math. Every function takes the providers it needs so
// the host unit tests can run against table-driven fakes.
//
// Zone names: every function that takes a `timezone` normalizes it once with
// ZoneNames::normalize ("utc"/"Etc/UTC"/"Z" -> UTC, "PST" -> America/Los_Angeles)
// and then requires TimezoneProvider::isValidZone. An unknown, empty, oversized,
// or ill-formed name throws std::invalid_argument; nothing silently falls back
// to the system zone or GMT. Every timestamp argument is requireValidTimestamp'd
// (finite, within +/-8.64e15 ms) before any integer conversion.

namespace nativedate::core {

/**
 * Offset in minutes of the device timezone at `timestamp`.
 * @throws std::invalid_argument for a non-finite or out-of-range timestamp.
 */
double getTimezoneOffsetForTimestamp(double timestamp, const TimezoneProvider& tz);

/**
 * Offset in minutes of `timezone` at `timestamp` (positive = east of UTC).
 * @throws std::invalid_argument for an unknown zone name or a non-finite /
 *         out-of-range timestamp.
 */
double getOffsetInTimezone(double timestamp, const std::string& timezone, const TimezoneProvider& tz);

/**
 * Shift a UTC timestamp by the zone offset so that formatting the result as UTC
 * yields the wall clock in `timezone`. The result is not a real instant; it is
 * the "shifted epoch" that `formatUTC` renders as local time in that zone.
 * @throws std::invalid_argument for an unknown zone name or a non-finite /
 *         out-of-range timestamp.
 */
double toTimezone(double timestamp, const std::string& timezone, const TimezoneProvider& tz);

/** @throws std::invalid_argument for an unknown zone name or a non-finite / out-of-range timestamp. */
std::string formatInTimezone(double timestamp, const std::string& pattern, const std::string& timezone,
                             const TimezoneProvider& tz, const LocaleProvider& locale);

// Local-calendar predicates in the device timezone (`tz.systemZone()`).
// `nowTimestamp` is the reference "now" so callers (and tests) control the clock.
// They compare civil day numbers, not formatted strings. Tomorrow/yesterday are
// the civil date +/- 1, so they stay correct on 23- and 25-hour DST days.
bool isToday(double timestamp, double nowTimestamp, const TimezoneProvider& tz);
bool isTomorrow(double timestamp, double nowTimestamp, const TimezoneProvider& tz);
bool isYesterday(double timestamp, double nowTimestamp, const TimezoneProvider& tz);

// Timezone-aware predicates. Same integer civil-date compare as above, in
// `timezone` rather than the system zone. Every entry throws
// std::invalid_argument for a non-finite or out-of-range timestamp, matching
// requireValidTimestamp. An unknown zone name also throws (Q4).
bool isTodayInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                 const TimezoneProvider& tz);
bool isTomorrowInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                    const TimezoneProvider& tz);
bool isYesterdayInTz(double timestamp, const std::string& timezone, double nowTimestamp,
                     const TimezoneProvider& tz);
bool isSameDayInTz(double timestamp1, double timestamp2, const std::string& timezone,
                   const TimezoneProvider& tz);
bool isSameMonthInTz(double timestamp1, double timestamp2, const std::string& timezone,
                     const TimezoneProvider& tz);
bool isSameYearInTz(double timestamp1, double timestamp2, const std::string& timezone,
                    const TimezoneProvider& tz);

/**
 * UTC instant of local midnight on `timestamp`'s civil date in `timezone`
 * ("zoned midnight"). When a DST transition removes midnight (a gap) the
 * result is the first instant after the gap; when it repeats midnight (an
 * overlap) the result is the earlier instant.
 */
double startOfDayInTz(double timestamp, const std::string& timezone,
                      const TimezoneProvider& tz);

/** Zoned midnight of the next civil date minus 1 ms. */
double endOfDayInTz(double timestamp, const std::string& timezone,
                    const TimezoneProvider& tz);

} // namespace nativedate::core
