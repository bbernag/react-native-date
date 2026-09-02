#include "Arithmetic.hpp"

#include "Civil.hpp"

#include <limits>

namespace nativedate::core {

double add(double timestamp, double amount, Unit unit) {
    int64_t amountInt = static_cast<int64_t>(amount);

    switch (unit) {
        case Unit::Millisecond:
            return timestamp + amount;
        case Unit::Second:
            return timestamp + (amount * MS_PER_SECOND);
        case Unit::Minute:
            return timestamp + (amount * MS_PER_MINUTE);
        case Unit::Hour:
            return timestamp + (amount * MS_PER_HOUR);
        case Unit::Day:
            return timestamp + (amount * MS_PER_DAY);
        case Unit::Week:
            return timestamp + (amount * MS_PER_WEEK);
        case Unit::Month: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            int totalMonths = dc.month - 1 + static_cast<int>(amountInt);
            dc.year += totalMonths / 12;
            dc.month = (totalMonths % 12) + 1;
            if (dc.month <= 0) {
                dc.month += 12;
                dc.year -= 1;
            }
            // Clamp day to valid range for new month
            int maxDay = daysInMonth(dc.year, dc.month);
            if (dc.day > maxDay) {
                dc.day = maxDay;
            }
            return componentsToTimestampLocal(dc);
        }
        case Unit::Year: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            dc.year += amountInt;
            // Handle Feb 29 -> Feb 28 for non-leap years
            if (dc.month == 2 && dc.day == 29 && !isLeapYear(dc.year)) {
                dc.day = 28;
            }
            return componentsToTimestampLocal(dc);
        }
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
    double start1 = truncateToUnit(timestamp1, unit);
    double start2 = truncateToUnit(timestamp2, unit);
    return start1 == start2;
}

// MARK: - Helpers

double startOf(double timestamp, Unit unit) {
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

double clamp(double timestamp, double minVal, double maxVal) {
    if (timestamp < minVal) return minVal;
    if (timestamp > maxVal) return maxVal;
    return timestamp;
}

double min(const std::vector<double>& timestamps) {
    if (timestamps.empty()) {
        return std::numeric_limits<double>::quiet_NaN();
    }
    double result = timestamps[0];
    for (size_t i = 1; i < timestamps.size(); ++i) {
        if (timestamps[i] < result) {
            result = timestamps[i];
        }
    }
    return result;
}

double max(const std::vector<double>& timestamps) {
    if (timestamps.empty()) {
        return std::numeric_limits<double>::quiet_NaN();
    }
    double result = timestamps[0];
    for (size_t i = 1; i < timestamps.size(); ++i) {
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
