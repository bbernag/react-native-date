#include "Civil.hpp"

#include <chrono>
#include <cmath>
#include <ctime>
#include <limits>
#include <stdexcept>
#include <string>
#if !defined(_WIN32)
#include <sys/time.h>
#endif

namespace nativedate::core {

namespace {

// Days in each month (non-leap year)
constexpr int DAYS_IN_MONTH[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};

// Epoch-relative day count beyond which no timestamp can be valid. One day of
// slack so a local wall clock just past the boundary is still rejected by the
// final range check rather than by integer overflow.
constexpr int64_t MAX_CIVIL_DAYS = MAX_TIMESTAMP_DAYS + 1;

[[noreturn]] void throwOutOfRange() {
    throw std::invalid_argument("Invalid timestamp: date is outside the supported range (+/-8.64e15 ms)");
}

void requireCivilDaysInRange(int64_t days) {
    if (days < -MAX_CIVIL_DAYS || days > MAX_CIVIL_DAYS) {
        throwOutOfRange();
    }
}

/** Fill a std::tm from an epoch-day count plus seconds-of-day (all fields in range). */
std::tm makeTm(int64_t days, int64_t secondsOfDay) {
    CivilDate cd = civilFromDays(days);
    std::tm tm{};
    tm.tm_year = static_cast<int>(cd.year - 1900);
    tm.tm_mon = cd.month - 1;
    tm.tm_mday = cd.day;
    tm.tm_hour = static_cast<int>(secondsOfDay / 3600);
    tm.tm_min = static_cast<int>((secondsOfDay % 3600) / 60);
    tm.tm_sec = static_cast<int>(secondsOfDay % 60);
    tm.tm_isdst = -1; // Let the system determine DST
    return tm;
}

bool localTime(std::time_t seconds, std::tm& out) {
#if defined(_WIN32)
    return localtime_s(&out, &seconds) == 0;
#else
    return localtime_r(&seconds, &out) != nullptr;
#endif
}

bool sameWallClock(const std::tm& a, const std::tm& b) {
    return a.tm_year == b.tm_year && a.tm_mon == b.tm_mon && a.tm_mday == b.tm_mday &&
           a.tm_hour == b.tm_hour && a.tm_min == b.tm_min && a.tm_sec == b.tm_sec;
}

} // namespace

bool isLeapYear(int year) {
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

int daysInMonth(int year, int month) {
    if (month < 1 || month > 12) {
        throw std::invalid_argument("Invalid month: expected 1..12, got " + std::to_string(month));
    }
    if (month == 2 && isLeapYear(year)) {
        return 29;
    }
    return DAYS_IN_MONTH[month - 1];
}

bool isWeekendDay(int dayOfWeek) {
    return dayOfWeek == 0 || dayOfWeek == 6; // Sunday or Saturday
}

bool isValidTimestamp(double timestamp) {
    return std::isfinite(timestamp) && std::fabs(timestamp) <= MAX_TIMESTAMP_MS;
}

void requireValidTimestamp(double timestamp) {
    if (!isValidTimestamp(timestamp)) {
        throw std::invalid_argument("Invalid timestamp: expected a finite number within +/-8.64e15 ms");
    }
}

void requireFiniteAmount(double amount) {
    if (!std::isfinite(amount)) {
        throw std::invalid_argument("Invalid amount: expected a finite number");
    }
}

bool secondsFitTimeT(int64_t seconds, std::size_t timeTBytes) {
    if (timeTBytes >= sizeof(int64_t)) {
        return true;
    }
    if (timeTBytes < sizeof(int32_t)) {
        return false; // no supported platform has a time_t this small
    }
    return seconds >= std::numeric_limits<int32_t>::min() && seconds <= std::numeric_limits<int32_t>::max();
}

double nowMs() {
#if defined(_WIN32)
    auto now = std::chrono::system_clock::now();
    auto duration = now.time_since_epoch();
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration);
    return static_cast<double>(millis.count());
#else
    struct timeval tv;
    gettimeofday(&tv, nullptr);
    return (static_cast<double>(tv.tv_sec) * 1000.0) + (static_cast<double>(tv.tv_usec) / 1000.0);
#endif
}

// MARK: - Civil calendar (Howard Hinnant's algorithms, proleptic Gregorian)

int64_t daysFromCivil(int64_t year, int64_t month, int64_t day) {
    // Normalize the month so the March-based year below always sees 1..12.
    year += floorDiv(month - 1, 12);
    month = posMod(month - 1, 12) + 1;

    year -= month <= 2;
    const int64_t era = floorDiv(year, 400);
    const int64_t yoe = year - era * 400;                                         // [0, 399]
    const int64_t doy = (153 * (month > 2 ? month - 3 : month + 9) + 2) / 5 + day - 1; // linear in day
    const int64_t doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    return era * 146097 + doe - 719468;
}

CivilDate civilFromDays(int64_t days) {
    days += 719468;
    const int64_t era = floorDiv(days, 146097);
    const int64_t doe = days - era * 146097;                                          // [0, 146096]
    const int64_t yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;         // [0, 399]
    const int64_t year = yoe + era * 400;
    const int64_t doy = doe - (365 * yoe + yoe / 4 - yoe / 100);                       // [0, 365]
    const int64_t mp = (5 * doy + 2) / 153;                                            // [0, 11]
    const int64_t day = doy - (153 * mp + 2) / 5 + 1;                                  // [1, 31]
    const int64_t month = mp < 10 ? mp + 3 : mp - 9;                                   // [1, 12]
    return {year + (month <= 2), static_cast<int>(month), static_cast<int>(day)};
}

int dayOfWeekFromDays(int64_t days) {
    // 1970-01-01 was a Thursday (4)
    return static_cast<int>(posMod(days + 4, 7));
}

// MARK: - Conversions

InternalDateComponents timestampToComponents(double timestamp, bool useUTC) {
    requireValidTimestamp(timestamp);
    const int64_t ms = static_cast<int64_t>(timestamp);
    const int64_t seconds = floorDiv(ms, MS_PER_SECOND);

    InternalDateComponents dc{};
    dc.millisecond = static_cast<int>(posMod(ms, MS_PER_SECOND));

    if (useUTC) {
        const int64_t days = floorDiv(seconds, SECONDS_PER_DAY);
        const int64_t secondsOfDay = posMod(seconds, SECONDS_PER_DAY);
        const CivilDate cd = civilFromDays(days);
        dc.year = static_cast<int>(cd.year);
        dc.month = cd.month;
        dc.day = cd.day;
        dc.hour = static_cast<int>(secondsOfDay / 3600);
        dc.minute = static_cast<int>((secondsOfDay % 3600) / 60);
        dc.second = static_cast<int>(secondsOfDay % 60);
        dc.dayOfWeek = dayOfWeekFromDays(days);
        return dc;
    }

    if (!secondsFitTimeT(seconds)) {
        throw std::invalid_argument("Invalid timestamp: value does not fit this platform's time_t");
    }
    std::tm tm{};
    if (!localTime(static_cast<std::time_t>(seconds), tm)) {
        throw std::invalid_argument("Invalid timestamp: the local time zone cannot represent this instant");
    }
    dc.year = tm.tm_year + 1900;
    dc.month = tm.tm_mon + 1;
    dc.day = tm.tm_mday;
    dc.hour = tm.tm_hour;
    dc.minute = tm.tm_min;
    dc.second = tm.tm_sec;
    dc.dayOfWeek = tm.tm_wday; // 0 = Sunday
    return dc;
}

double componentsToTimestamp(const InternalDateComponents& dc) {
    const int64_t days = daysFromCivil(dc.year, dc.month, dc.day);
    requireCivilDaysInRange(days);
    const int64_t seconds = days * SECONDS_PER_DAY + static_cast<int64_t>(dc.hour) * 3600 +
                            static_cast<int64_t>(dc.minute) * 60 + static_cast<int64_t>(dc.second);
    const int64_t ms = seconds * MS_PER_SECOND + static_cast<int64_t>(dc.millisecond);
    const double result = static_cast<double>(ms);
    if (!isValidTimestamp(result)) {
        throwOutOfRange();
    }
    return result;
}

double componentsToTimestampLocal(const InternalDateComponents& dc) {
    // Normalize every field with 64-bit civil math first so libc only ever sees
    // in-range tm fields and we can bounds-check before touching time_t.
    const int64_t days = daysFromCivil(dc.year, dc.month, dc.day);
    requireCivilDaysInRange(days);
    const int64_t wallSeconds = days * SECONDS_PER_DAY + static_cast<int64_t>(dc.hour) * 3600 +
                                static_cast<int64_t>(dc.minute) * 60 + static_cast<int64_t>(dc.second);
    // The zone offset moves the instant by less than a day in either direction.
    if (!secondsFitTimeT(wallSeconds - SECONDS_PER_DAY) || !secondsFitTimeT(wallSeconds + SECONDS_PER_DAY)) {
        throw std::invalid_argument("Invalid timestamp: value does not fit this platform's time_t");
    }

    std::tm tm = makeTm(floorDiv(wallSeconds, SECONDS_PER_DAY), posMod(wallSeconds, SECONDS_PER_DAY));
    const std::time_t time = std::mktime(&tm);
    if (time == static_cast<std::time_t>(-1)) {
        // -1 is also the real instant 1969-12-31T23:59:59Z. mktime normalizes
        // `tm` in place on success, so a round trip tells the two apart.
        std::tm check{};
        if (!localTime(time, check) || !sameWallClock(check, tm)) {
            throw std::invalid_argument("Invalid timestamp: the local time zone cannot represent this date");
        }
    }

    const double result = static_cast<double>(time) * 1000.0 + static_cast<double>(dc.millisecond);
    if (!isValidTimestamp(result)) {
        throwOutOfRange();
    }
    return result;
}

int getDayOfWeek(double timestamp) {
    requireValidTimestamp(timestamp);
    const int64_t ms = static_cast<int64_t>(timestamp);
    return dayOfWeekFromDays(floorDiv(ms, MS_PER_DAY));
}

} // namespace nativedate::core
