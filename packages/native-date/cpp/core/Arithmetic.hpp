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
 * Add `amount` units. Millisecond..week accept fractional amounts (duration
 * math). Month and year require a whole number (throws otherwise) and clamp
 * the day of month to the target month: Jan 31 + 1 month = Feb 29/28,
 * Feb 29 + 1 year = Feb 28 (Q1).
 */
double add(double timestamp, double amount, Unit unit);

/** Exactly add(timestamp, -amount, unit). */
double subtract(double timestamp, double amount, Unit unit);

bool isBefore(double timestamp1, double timestamp2);
bool isAfter(double timestamp1, double timestamp2);
bool isSame(double timestamp1, double timestamp2, Unit unit);

double startOf(double timestamp, Unit unit);
double endOf(double timestamp, Unit unit);
double diff(double timestamp1, double timestamp2, Unit unit);

/** NaN if `timestamp` or either bound is NaN. */
double clamp(double timestamp, double minVal, double maxVal);
/** NaN for an empty list or when any element is NaN. */
double min(const std::vector<double>& timestamps);
/** NaN for an empty list or when any element is NaN. */
double max(const std::vector<double>& timestamps);

/** Truncate a timestamp to the start of `unit` in local time. */
double truncateToUnit(double timestamp, Unit unit);

/** Nominal length of `unit` in milliseconds (month/year are approximate). */
int64_t getMillisForUnit(Unit unit);

} // namespace nativedate::core
