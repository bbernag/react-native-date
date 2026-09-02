#pragma once

#include <cstdint>
#include <vector>

namespace nativedate::core {

/**
 * Calendar unit for arithmetic and comparisons.
 * Mirrors the JS-facing `TimeUnit` union so the core stays Nitro-free.
 */
enum class Unit {
    Millisecond,
    Second,
    Minute,
    Hour,
    Day,
    Week,
    Month,
    Year,
};

// Error policy (Q3): functions returning a timestamp throw std::invalid_argument
// for a non-finite or out-of-range timestamp, a non-finite amount, or a result
// outside the supported range. Predicates (isBefore/isAfter/isSame) return
// false instead of throwing. clamp/min/max never throw and propagate NaN.

/**
 * Add `amount` units. Millisecond..hour accept fractional amounts (duration
 * math). Day, week, month and year are calendar units in LOCAL time: they
 * require a whole number (throws otherwise) and keep the wall-clock time
 * across DST changes (Q2). Month and year clamp the day of month to the
 * target month: Jan 31 + 1 month = Feb 29/28, Feb 29 + 1 year = Feb 28 (Q1).
 */
double add(double timestamp, double amount, Unit unit);

/** Exactly add(timestamp, -amount, unit). */
double subtract(double timestamp, double amount, Unit unit);

bool isBefore(double timestamp1, double timestamp2);
bool isAfter(double timestamp1, double timestamp2);

/**
 * Millisecond compares raw instants; other units compare startOf(unit) in
 * local time, so two instants are "the same hour" only when they share a
 * local hour (a repeated DST hour counts as two hours).
 */
bool isSame(double timestamp1, double timestamp2, Unit unit);

/** Start of `unit` in local time (weeks start on Sunday). Same as truncateToUnit. */
double startOf(double timestamp, Unit unit);

/** Last millisecond of `unit` in local time: startOf(next unit) - 1. */
double endOf(double timestamp, Unit unit);

/**
 * timestamp1 - timestamp2 in `unit`. Millisecond..week: elapsed duration
 * truncated toward zero (antisymmetric). Month/year: complete local calendar
 * months/years, with add()'s clamping (Jan 31 -> Mar 1 is 1 month).
 */
double diff(double timestamp1, double timestamp2, Unit unit);

/** NaN if `timestamp` or either bound is NaN. */
double clamp(double timestamp, double minVal, double maxVal);
/** NaN for an empty list or when any element is NaN. */
double min(const std::vector<double>& timestamps);
/** NaN for an empty list or when any element is NaN. */
double max(const std::vector<double>& timestamps);

/**
 * Truncate a timestamp to the start of `unit` in local time. Sub-day units
 * floor on the local grid (correct for half-hour zones and pre-epoch
 * instants); day and larger go through local components.
 */
double truncateToUnit(double timestamp, Unit unit);

/** Nominal length of `unit` in milliseconds (month/year are approximate). */
int64_t getMillisForUnit(Unit unit);

} // namespace nativedate::core
