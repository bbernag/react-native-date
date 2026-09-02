#pragma once

#include <cstddef>
#include <cstdint>
#include <ctime>

// Civil-time primitives: epoch <-> calendar component conversion, calendar
// facts, and the integer helpers the rest of the core builds on.
//
// Range contract (Q3/Q7): a timestamp is valid when it is finite and within
// +/-8.64e15 ms of the Unix epoch (the ECMAScript Date range). Every function
// that takes a timestamp throws std::invalid_argument for anything else;
// nothing here ever casts a NaN/infinite double to an integer. UTC
// conversions are pure 64-bit civil math (no time_t). Local conversions use
// libc (localtime_r / mktime) but reject values that do not fit a 32-bit
// time_t before calling it and throw if libc reports a failure.

namespace nativedate::core {

// Constants for time calculations
inline constexpr int64_t MS_PER_SECOND = 1000;
inline constexpr int64_t MS_PER_MINUTE = 60 * MS_PER_SECOND;
inline constexpr int64_t MS_PER_HOUR = 60 * MS_PER_MINUTE;
inline constexpr int64_t MS_PER_DAY = 24 * MS_PER_HOUR;
inline constexpr int64_t MS_PER_WEEK = 7 * MS_PER_DAY;
inline constexpr int64_t SECONDS_PER_DAY = 24 * 60 * 60;

/** Largest magnitude a timestamp may have (ECMAScript Date range, in ms). */
inline constexpr double MAX_TIMESTAMP_MS = 8.64e15;
/** MAX_TIMESTAMP_MS expressed in whole days from the epoch. */
inline constexpr int64_t MAX_TIMESTAMP_DAYS = 100000000;

/**
 * Broken-down date/time (distinct from the JS-facing DateComponents).
 */
struct InternalDateComponents {
    int year;
    int month;       // 1 = January .. 12 = December
    int day;         // 1-based day of month
    int hour;
    int minute;
    int second;
    int millisecond; // always 0..999, also for pre-epoch instants
    int dayOfWeek;   // 0 = Sunday, 6 = Saturday
};

/** Proleptic Gregorian calendar date, 64-bit year. */
struct CivilDate {
    int64_t year;
    int month; // 1..12
    int day;   // 1..31
};

bool isLeapYear(int year);

/** Days in `month` (1..12) of `year`. Throws std::invalid_argument for other months. */
int daysInMonth(int year, int month);

/** Sunday (0) or Saturday (6). */
bool isWeekendDay(int dayOfWeek);

/** Finite and within +/-MAX_TIMESTAMP_MS. */
bool isValidTimestamp(double timestamp);

/** Throws std::invalid_argument unless isValidTimestamp(timestamp). */
void requireValidTimestamp(double timestamp);

/** Throws std::invalid_argument unless `amount` is finite. */
void requireFiniteAmount(double amount);

/**
 * Whether `seconds` is representable in a signed integer of `timeTBytes`
 * bytes. Defaults to the platform time_t; the size parameter exists so the
 * 32-bit branch can be unit-tested on 64-bit hosts.
 */
bool secondsFitTimeT(int64_t seconds, std::size_t timeTBytes = sizeof(std::time_t));

/** Current wall-clock time in milliseconds since the Unix epoch. */
double nowMs();

/**
 * Days since 1970-01-01 for a proleptic Gregorian date (Howard Hinnant's
 * days_from_civil). Out-of-range months and days are normalized linearly
 * (month 13 is January of the next year, day 32 of January is February 1).
 */
int64_t daysFromCivil(int64_t year, int64_t month, int64_t day);

/** Inverse of daysFromCivil (Howard Hinnant's civil_from_days). */
CivilDate civilFromDays(int64_t days);

/** Day of week (0 = Sunday) of a day count from daysFromCivil. */
int dayOfWeekFromDays(int64_t days);

/** Convert timestamp to components (useUTC: true for UTC, false for local time). */
InternalDateComponents timestampToComponents(double timestamp, bool useUTC = true);

/**
 * Convert components to timestamp, interpreting them as UTC. Overflowing
 * fields are normalized (day 32 rolls into the next month, hour 24 into the
 * next day, ...). Throws std::invalid_argument when the result would be
 * outside the timestamp range.
 */
double componentsToTimestamp(const InternalDateComponents& components);

/**
 * Convert components to timestamp, interpreting them as local time
 * (mktime with tm_isdst = -1, so libc resolves DST). Overflowing fields are
 * normalized. Throws std::invalid_argument when the value is outside the
 * timestamp range, does not fit the platform time_t, or libc rejects it.
 */
double componentsToTimestampLocal(const InternalDateComponents& components);

/** Day of week (0 = Sunday, 6 = Saturday) of a UTC timestamp. */
int getDayOfWeek(double timestamp);

// Fast day boundary calculation using integer math (handles negative timestamps)
inline int64_t floorDayStartMs(int64_t ms) {
    int64_t remainder = ms % MS_PER_DAY;
    if (remainder < 0) remainder += MS_PER_DAY;
    return ms - remainder;
}

inline int64_t posMod(int64_t value, int64_t modulus) {
    int64_t rem = value % modulus;
    if (rem < 0) rem += modulus;
    return rem;
}

inline int64_t floorDiv(int64_t numerator, int64_t denominator) {
    int64_t quot = numerator / denominator;
    int64_t rem = numerator % denominator;
    if (rem != 0 && ((rem < 0) != (denominator < 0))) {
        --quot;
    }
    return quot;
}

} // namespace nativedate::core
