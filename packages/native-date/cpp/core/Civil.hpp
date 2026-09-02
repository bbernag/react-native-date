#pragma once

#include <cstdint>

// Civil-time primitives: epoch <-> calendar component conversion, calendar
// facts, and the integer helpers the rest of the core builds on.

namespace nativedate::core {

// Constants for time calculations
inline constexpr int64_t MS_PER_SECOND = 1000;
inline constexpr int64_t MS_PER_MINUTE = 60 * MS_PER_SECOND;
inline constexpr int64_t MS_PER_HOUR = 60 * MS_PER_MINUTE;
inline constexpr int64_t MS_PER_DAY = 24 * MS_PER_HOUR;
inline constexpr int64_t MS_PER_WEEK = 7 * MS_PER_DAY;

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
    int millisecond;
    int dayOfWeek;   // 0 = Sunday, 6 = Saturday
};

bool isLeapYear(int year);
int daysInMonth(int year, int month);

/** Sunday (0) or Saturday (6). */
bool isWeekendDay(int dayOfWeek);

/** Finite (not NaN, not +/-inf). */
bool isValidTimestamp(double timestamp);

/** Current wall-clock time in milliseconds since the Unix epoch. */
double nowMs();

/** Convert timestamp to components (useUTC: true for UTC, false for local time). */
InternalDateComponents timestampToComponents(double timestamp, bool useUTC = true);

/** Convert components to timestamp, interpreting them as UTC. */
double componentsToTimestamp(const InternalDateComponents& components);

/** Convert components to timestamp, interpreting them as local time. */
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
