#include "Arithmetic.hpp"

#include "Civil.hpp"

#include <cmath>
#include <limits>
#include <stdexcept>

namespace nativedate::core {

namespace {

constexpr double kNaN = std::numeric_limits<double>::quiet_NaN();

// Largest whole amounts that can still produce an in-range result. Anything
// bigger is rejected up front so the int fields of InternalDateComponents can
// never overflow; the final range check catches the rest.
constexpr int64_t MAX_DAY_AMOUNT = 2 * MAX_TIMESTAMP_DAYS + 1;
constexpr int64_t MAX_WEEK_AMOUNT = MAX_DAY_AMOUNT / 7;
constexpr int64_t MAX_MONTH_AMOUNT = 4000000; // MAX_TIMESTAMP_DAYS / 28 days
constexpr int64_t MAX_YEAR_AMOUNT = MAX_MONTH_AMOUNT / 12;

/** Calendar units require whole amounts; returns the integral value. */
int64_t requireIntegralAmount(double amount, int64_t maxMagnitude) {
    requireFiniteAmount(amount);
    if (amount != std::floor(amount)) {
        throw std::invalid_argument("Invalid amount: day, week, month and year arithmetic requires a whole number");
    }
    if (std::fabs(amount) > static_cast<double>(maxMagnitude)) {
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

/** Move the calendar date by `days`, keeping the wall-clock time. */
void shiftCivilDays(InternalDateComponents& dc, int64_t days) {
    const int64_t epochDays = daysFromCivil(dc.year, dc.month, dc.day) + days;
    const CivilDate cd = civilFromDays(epochDays);
    dc.year = static_cast<int>(cd.year);
    dc.month = cd.month;
    dc.day = cd.day;
    dc.dayOfWeek = dayOfWeekFromDays(epochDays);
}

void setStartOfDay(InternalDateComponents& dc) {
    dc.hour = 0;
    dc.minute = 0;
    dc.second = 0;
    dc.millisecond = 0;
}

/** Add whole calendar days in local time (same wall clock across DST, Q2). */
double addDays(double timestamp, int64_t days) {
    InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
    shiftCivilDays(dc, days);
    return componentsToTimestampLocal(dc);
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

/** The local wall clock of `dc` read as if it were UTC, without range checks. */
int64_t wallClockMs(const InternalDateComponents& dc) {
    return daysFromCivil(dc.year, dc.month, dc.day) * MS_PER_DAY + static_cast<int64_t>(dc.hour) * MS_PER_HOUR +
           static_cast<int64_t>(dc.minute) * MS_PER_MINUTE + static_cast<int64_t>(dc.second) * MS_PER_SECOND +
           static_cast<int64_t>(dc.millisecond);
}

/**
 * Floor a timestamp to a multiple of `unitMs` on the LOCAL grid, using the
 * zone offset in effect at that instant. Correct for half-hour zones and
 * pre-epoch instants, and it never re-encodes through mktime, so an instant
 * inside a repeated DST hour stays in its own occurrence.
 */
double floorToLocalUnit(double timestamp, int64_t unitMs) {
    const int64_t ms = static_cast<int64_t>(timestamp);
    const InternalDateComponents local = timestampToComponents(timestamp, false);
    const int64_t offsetMs = wallClockMs(local) - ms;
    const int64_t localMs = ms + offsetMs;
    return static_cast<double>(localMs - posMod(localMs, unitMs) - offsetMs);
}

/** Number of complete local calendar months from `earlier` up to `later` (later >= earlier). */
int64_t completeMonthsBetween(double later, double earlier) {
    const InternalDateComponents a = timestampToComponents(later, false);
    const InternalDateComponents b = timestampToComponents(earlier, false);
    int64_t months = static_cast<int64_t>(a.year - b.year) * 12 + (a.month - b.month);
    // The last month only counts if earlier + months (with the same clamping
    // `add` applies) does not overshoot `later`.
    if (months > 0 && addMonths(earlier, months) > later) {
        --months;
    }
    return months;
}

} // namespace

// Amount policy: every unit rejects non-finite amounts. Millisecond..hour accept
// fractional amounts (duration math). Day, week, month and year are calendar
// units: they require whole numbers (throw otherwise) and keep the local wall
// clock, so adding a day across a DST change still lands on the same time of
// day. Month/year clamp the day of month to the target month (Jan 31 + 1 month
// = Feb 29/28). A wall clock that falls into a DST gap is resolved by libc.
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
            return addDays(timestamp, requireIntegralAmount(amount, MAX_DAY_AMOUNT));
        case Unit::Week:
            return addDays(timestamp, requireIntegralAmount(amount, MAX_WEEK_AMOUNT) * 7);
        case Unit::Month:
            return addMonths(timestamp, requireIntegralAmount(amount, MAX_MONTH_AMOUNT));
        case Unit::Year:
            return addMonths(timestamp, requireIntegralAmount(amount, MAX_YEAR_AMOUNT) * 12);
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

// Millisecond compares the raw instants; every other unit compares the same
// local truncation startOf() uses, so isSame(a, b, u) <=> startOf(a, u) == startOf(b, u).
bool isSame(double timestamp1, double timestamp2, Unit unit) {
    if (!isValidTimestamp(timestamp1) || !isValidTimestamp(timestamp2)) {
        return false; // predicates never throw (Q3)
    }
    if (unit == Unit::Millisecond) {
        return timestamp1 == timestamp2;
    }
    return truncateToUnit(timestamp1, unit) == truncateToUnit(timestamp2, unit);
}

// MARK: - Boundaries

double startOf(double timestamp, Unit unit) {
    return truncateToUnit(timestamp, unit);
}

// endOf(unit) is the last millisecond before the start of the next unit, so
// it stays correct on 23h/25h DST days and in zones whose day does not begin
// at 00:00.
double endOf(double timestamp, Unit unit) {
    requireValidTimestamp(timestamp);

    switch (unit) {
        case Unit::Millisecond:
            return timestamp;
        case Unit::Second:
            return floorToLocalUnit(timestamp, MS_PER_SECOND) + (MS_PER_SECOND - 1);
        case Unit::Minute:
            return floorToLocalUnit(timestamp, MS_PER_MINUTE) + (MS_PER_MINUTE - 1);
        case Unit::Hour:
            return floorToLocalUnit(timestamp, MS_PER_HOUR) + (MS_PER_HOUR - 1);
        case Unit::Day: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            shiftCivilDays(dc, 1);
            setStartOfDay(dc);
            return componentsToTimestampLocal(dc) - 1;
        }
        case Unit::Week: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            shiftCivilDays(dc, 7 - dc.dayOfWeek); // next Sunday
            setStartOfDay(dc);
            return componentsToTimestampLocal(dc) - 1;
        }
        case Unit::Month: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            dc.month += 1; // normalized by componentsToTimestampLocal
            dc.day = 1;
            setStartOfDay(dc);
            return componentsToTimestampLocal(dc) - 1;
        }
        case Unit::Year: {
            InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
            dc.year += 1;
            dc.month = 1;
            dc.day = 1;
            setStartOfDay(dc);
            return componentsToTimestampLocal(dc) - 1;
        }
    }
    return timestamp;
}

// diff(a, b) semantics:
// - millisecond..week: elapsed duration truncated toward zero (dayjs/date-fns
//   style), so diff(a, b) == -diff(b, a). Day and week are 24h/168h durations
//   here, not calendar days.
// - month/year: complete local calendar months/years between the two instants,
//   using the same day-of-month clamping as add(): Jan 31 -> Feb 29 is 1 month,
//   Jan 31 -> Mar 1 is 1 month (the second month is not complete). Sign-symmetric.
double diff(double timestamp1, double timestamp2, Unit unit) {
    requireValidTimestamp(timestamp1);
    requireValidTimestamp(timestamp2);
    const int64_t diffMs = static_cast<int64_t>(timestamp1) - static_cast<int64_t>(timestamp2);

    switch (unit) {
        case Unit::Millisecond:
            return static_cast<double>(diffMs);
        case Unit::Second:
            return static_cast<double>(diffMs / MS_PER_SECOND);
        case Unit::Minute:
            return static_cast<double>(diffMs / MS_PER_MINUTE);
        case Unit::Hour:
            return static_cast<double>(diffMs / MS_PER_HOUR);
        case Unit::Day:
            return static_cast<double>(diffMs / MS_PER_DAY);
        case Unit::Week:
            return static_cast<double>(diffMs / MS_PER_WEEK);
        case Unit::Month:
        case Unit::Year: {
            const int64_t months = timestamp1 >= timestamp2 ? completeMonthsBetween(timestamp1, timestamp2)
                                                            : -completeMonthsBetween(timestamp2, timestamp1);
            return static_cast<double>(unit == Unit::Month ? months : months / 12);
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

// MARK: - Helpers

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

// Start of `unit` in LOCAL time. Sub-day units floor on the local grid using
// the offset in effect at the instant; day and larger re-encode local
// components through mktime (tm_isdst = -1). Weeks start on Sunday.
double truncateToUnit(double timestamp, Unit unit) {
    requireValidTimestamp(timestamp);

    switch (unit) {
        case Unit::Millisecond:
            return timestamp;
        case Unit::Second:
            return floorToLocalUnit(timestamp, MS_PER_SECOND);
        case Unit::Minute:
            return floorToLocalUnit(timestamp, MS_PER_MINUTE);
        case Unit::Hour:
            return floorToLocalUnit(timestamp, MS_PER_HOUR);
        default:
            break;
    }

    InternalDateComponents dc = timestampToComponents(timestamp, false); // local time
    setStartOfDay(dc);
    switch (unit) {
        case Unit::Day:
            break;
        case Unit::Week:
            shiftCivilDays(dc, -dc.dayOfWeek); // back to Sunday, calendar days (D-08)
            break;
        case Unit::Month:
            dc.day = 1;
            break;
        case Unit::Year:
            dc.day = 1;
            dc.month = 1;
            break;
        default:
            break;
    }
    return componentsToTimestampLocal(dc);
}

} // namespace nativedate::core
