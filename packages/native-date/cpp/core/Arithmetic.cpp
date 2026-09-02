#include "Arithmetic.hpp"

#include "Civil.hpp"

#include <cmath>
#include <limits>
#include <stdexcept>

namespace nativedate::core {

namespace {

constexpr double kNaN = std::numeric_limits<double>::quiet_NaN();

// Any month count beyond this puts the result outside the timestamp range
// (MAX_TIMESTAMP_DAYS / 28 days), so larger amounts are rejected before they
// can overflow the int fields of InternalDateComponents.
constexpr int64_t MAX_MONTH_AMOUNT = 4000000;

/** Calendar units (month/year) require whole amounts; returns the integral value. */
int64_t requireIntegralAmount(double amount) {
    requireFiniteAmount(amount);
    if (amount != std::floor(amount)) {
        throw std::invalid_argument("Invalid amount: month and year arithmetic requires a whole number");
    }
    if (std::fabs(amount) > static_cast<double>(MAX_MONTH_AMOUNT)) {
        throw std::invalid_argument("Invalid amount: result would be outside the supported date range");
    }
    return static_cast<int64_t>(amount);
}

double addDuration(double timestamp, double amount, int64_t unitMs) {
    double result = timestamp + amount * static_cast<double>(unitMs);
    if (!isValidTimestamp(result)) {
        throw std::invalid_argument("Invalid timestamp: result is outside the supported range (+/-8.64e15 ms)");
    }
    return result;
}

/** Add whole months to local components, clamping the day to the target month (Q1). */
double addMonths(double timestamp, int64_t months) {
    InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
    const int64_t totalMonths = static_cast<int64_t>(dc.year) * 12 + (dc.month - 1) + months;
    dc.year = static_cast<int>(floorDiv(totalMonths, 12));
    dc.month = static_cast<int>(posMod(totalMonths, 12)) + 1;
    // Clamp day to valid range for new month
    const int maxDay = daysInMonth(dc.year, dc.month);
    if (dc.day > maxDay) {
        dc.day = maxDay;
    }
    return componentsToTimestampLocal(dc);
}

} // namespace

// Amount policy: every unit rejects non-finite amounts. Millisecond..week accept
// fractional amounts (duration math). Month and year require whole numbers and
// throw otherwise, because "1.5 months" has no calendar meaning; the day of
// month is clamped to the target month (Jan 31 + 1 month = Feb 29/28).
double add(double timestamp, double amount, Unit unit) {
    requireValidTimestamp(timestamp);
    requireFiniteAmount(amount);

    switch (unit) {
        case Unit::Millisecond:
            return addDuration(timestamp, amount, 1);
        case Unit::Second:
            return addDuration(timestamp, amount, MS_PER_SECOND);
        case Unit::Minute:
            return addDuration(timestamp, amount, MS_PER_MINUTE);
        case Unit::Hour:
            return addDuration(timestamp, amount, MS_PER_HOUR);
        case Unit::Day:
            return addDuration(timestamp, amount, MS_PER_DAY);
        case Unit::Week:
            return addDuration(timestamp, amount, MS_PER_WEEK);
        case Unit::Month:
            return addMonths(timestamp, requireIntegralAmount(amount));
        case Unit::Year:
            return addMonths(timestamp, requireIntegralAmount(amount) * 12);
    }
    return timestamp;
}

double subtract(double timestamp, double amount, Unit unit) {
    return add(timestamp, -amount, unit);
}

// MARK: - Comparisons

bool isBefore(double timestamp1, double timestamp2) {
    return timestamp1 < timestamp2;
}

bool isAfter(double timestamp1, double timestamp2) {
    return timestamp1 > timestamp2;
}

bool isSame(double timestamp1, double timestamp2, Unit unit) {
    if (!isValidTimestamp(timestamp1) || !isValidTimestamp(timestamp2)) {
        return false; // predicates never throw (Q3)
    }
    double start1 = truncateToUnit(timestamp1, unit);
    double start2 = truncateToUnit(timestamp2, unit);
    return start1 == start2;
}

// MARK: - Helpers

double startOf(double timestamp, Unit unit) {
    requireValidTimestamp(timestamp);
    int64_t ms = static_cast<int64_t>(timestamp);

    // Fast path for sub-day units (timezone-independent)
    switch (unit) {
        case Unit::Millisecond:
            return timestamp;
        case Unit::Second:
            return static_cast<double>((ms / 1000) * 1000);
        case Unit::Minute:
            return static_cast<double>((ms / MS_PER_MINUTE) * MS_PER_MINUTE);
        case Unit::Hour:
            return static_cast<double>((ms / MS_PER_HOUR) * MS_PER_HOUR);
        default:
            // DAY, WEEK, MONTH, YEAR need local time component conversion
            return truncateToUnit(timestamp, unit);
    }
}

double endOf(double timestamp, Unit unit) {
    requireValidTimestamp(timestamp);
    int64_t ms = static_cast<int64_t>(timestamp);

    // Fast path for sub-day units (timezone-independent)
    switch (unit) {
        case Unit::Millisecond:
            return timestamp;
        case Unit::Second:
            return static_cast<double>(((ms / 1000) * 1000) + 999);
        case Unit::Minute:
            return static_cast<double>(((ms / MS_PER_MINUTE) * MS_PER_MINUTE) + MS_PER_MINUTE - 1);
        case Unit::Hour:
            return static_cast<double>(((ms / MS_PER_HOUR) * MS_PER_HOUR) + MS_PER_HOUR - 1);
        case Unit::Day: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            dc.hour = 23;
            dc.minute = 59;
            dc.second = 59;
            dc.millisecond = 999;
            return componentsToTimestampLocal(dc);
        }
        case Unit::Week: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            // Calculate days until Saturday (6 - current dayOfWeek)
            int daysToAdd = 6 - dc.dayOfWeek;
            dc.day += daysToAdd;
            dc.hour = 23;
            dc.minute = 59;
            dc.second = 59;
            dc.millisecond = 999;
            return componentsToTimestampLocal(dc); // mktime will normalize if day overflows
        }
        case Unit::Month: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            dc.day = daysInMonth(dc.year, dc.month);
            dc.hour = 23;
            dc.minute = 59;
            dc.second = 59;
            dc.millisecond = 999;
            return componentsToTimestampLocal(dc);
        }
        case Unit::Year: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            dc.month = 12;
            dc.day = 31;
            dc.hour = 23;
            dc.minute = 59;
            dc.second = 59;
            dc.millisecond = 999;
            return componentsToTimestampLocal(dc);
        }
        default:
            return timestamp;
    }
}

double diff(double timestamp1, double timestamp2, Unit unit) {
    requireValidTimestamp(timestamp1);
    requireValidTimestamp(timestamp2);
    int64_t diffMs = static_cast<int64_t>(timestamp1) - static_cast<int64_t>(timestamp2);

    switch (unit) {
        case Unit::Millisecond:
            return static_cast<double>(diffMs);
        case Unit::Second:
            return static_cast<double>(floorDiv(diffMs, MS_PER_SECOND));
        case Unit::Minute:
            return static_cast<double>(floorDiv(diffMs, MS_PER_MINUTE));
        case Unit::Hour:
            return static_cast<double>(floorDiv(diffMs, MS_PER_HOUR));
        case Unit::Day:
            return static_cast<double>(floorDiv(diffMs, MS_PER_DAY));
        case Unit::Week:
            return static_cast<double>(floorDiv(diffMs, MS_PER_WEEK));
        case Unit::Month: {
            InternalDateComponents dc1 = timestampToComponents(timestamp1);
            InternalDateComponents dc2 = timestampToComponents(timestamp2);
            return (dc1.year - dc2.year) * 12 + (dc1.month - dc2.month);
        }
        case Unit::Year: {
            InternalDateComponents dc1 = timestampToComponents(timestamp1);
            InternalDateComponents dc2 = timestampToComponents(timestamp2);
            return dc1.year - dc2.year;
        }
    }
    return 0;
}

// NaN policy (D-13): these never throw. clamp/min/max propagate NaN like
// IEEE arithmetic would, so a NaN anywhere in the input yields NaN regardless
// of position. min/max of an empty list is NaN; the JS facade throws on empty
// input before reaching native.

double clamp(double timestamp, double minVal, double maxVal) {
    if (std::isnan(timestamp) || std::isnan(minVal) || std::isnan(maxVal)) {
        return kNaN;
    }
    if (timestamp < minVal) return minVal;
    if (timestamp > maxVal) return maxVal;
    return timestamp;
}

double min(const std::vector<double>& timestamps) {
    if (timestamps.empty()) {
        return kNaN;
    }
    double result = timestamps[0];
    for (size_t i = 1; i < timestamps.size(); ++i) {
        if (std::isnan(timestamps[i])) {
            return kNaN;
        }
        if (timestamps[i] < result) {
            result = timestamps[i];
        }
    }
    return result;
}

double max(const std::vector<double>& timestamps) {
    if (timestamps.empty()) {
        return kNaN;
    }
    double result = timestamps[0];
    for (size_t i = 1; i < timestamps.size(); ++i) {
        if (std::isnan(timestamps[i])) {
            return kNaN;
        }
        if (timestamps[i] > result) {
            result = timestamps[i];
        }
    }
    return result;
}

// MARK: - Private Helpers

int64_t getMillisForUnit(Unit unit) {
    switch (unit) {
        case Unit::Millisecond: return 1;
        case Unit::Second: return MS_PER_SECOND;
        case Unit::Minute: return MS_PER_MINUTE;
        case Unit::Hour: return MS_PER_HOUR;
        case Unit::Day: return MS_PER_DAY;
        case Unit::Week: return MS_PER_WEEK;
        case Unit::Month: return MS_PER_DAY * 30; // Approximate
        case Unit::Year: return MS_PER_DAY * 365; // Approximate
    }
    return 1;
}

double truncateToUnit(double timestamp, Unit unit) {
    // Use LOCAL time components for all units (consistent behavior)
    // This ensures startOfMonth/startOfYear work correctly in the user's timezone
    InternalDateComponents dc = timestampToComponents(timestamp, false); // false = local time

    switch (unit) {
        case Unit::Millisecond:
            break;
        case Unit::Second:
            dc.millisecond = 0;
            break;
        case Unit::Minute:
            dc.millisecond = 0;
            dc.second = 0;
            break;
        case Unit::Hour:
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            break;
        case Unit::Day:
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            dc.hour = 0;
            break;
        case Unit::Week: {
            // Get start of day in local time, then subtract to Sunday
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            dc.hour = 0;
            double localDayStart = componentsToTimestampLocal(dc);
            // dayOfWeek is already in local time from timestampToComponents
            return localDayStart - (static_cast<double>(dc.dayOfWeek) * MS_PER_DAY);
        }
        case Unit::Month:
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            dc.hour = 0;
            dc.day = 1;
            break;
        case Unit::Year:
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            dc.hour = 0;
            dc.day = 1;
            dc.month = 1;
            break;
    }

    return componentsToTimestampLocal(dc);
}

} // namespace nativedate::core
