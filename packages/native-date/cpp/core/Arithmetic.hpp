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

double add(double timestamp, double amount, Unit unit);
double subtract(double timestamp, double amount, Unit unit);

bool isBefore(double timestamp1, double timestamp2);
bool isAfter(double timestamp1, double timestamp2);
bool isSame(double timestamp1, double timestamp2, Unit unit);

double startOf(double timestamp, Unit unit);
double endOf(double timestamp, Unit unit);
double diff(double timestamp1, double timestamp2, Unit unit);

double clamp(double timestamp, double minVal, double maxVal);
double min(const std::vector<double>& timestamps);
double max(const std::vector<double>& timestamps);

/** Truncate a timestamp to the start of `unit` in local time. */
double truncateToUnit(double timestamp, Unit unit);

/** Nominal length of `unit` in milliseconds (month/year are approximate). */
int64_t getMillisForUnit(Unit unit);

} // namespace nativedate::core
