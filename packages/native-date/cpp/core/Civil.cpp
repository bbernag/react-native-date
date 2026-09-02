#include "Civil.hpp"

#include <chrono>
#include <cmath>
#include <ctime>
#if !defined(_WIN32)
#include <sys/time.h>
#endif

namespace nativedate::core {

// Days in each month (non-leap year)
static const int DAYS_IN_MONTH[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};

bool isLeapYear(int year) {
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

int daysInMonth(int year, int month) {
    if (month == 2 && isLeapYear(year)) {
        return 29;
    }
    return DAYS_IN_MONTH[month - 1];
}

bool isWeekendDay(int dayOfWeek) {
    return dayOfWeek == 0 || dayOfWeek == 6; // Sunday or Saturday
}

bool isValidTimestamp(double timestamp) {
    return !std::isnan(timestamp) && !std::isinf(timestamp);
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

InternalDateComponents timestampToComponents(double timestamp, bool useUTC) {
    int64_t ms = static_cast<int64_t>(timestamp);
    std::time_t seconds = ms / 1000;
    std::tm tmBuffer;
    std::tm* tm;

    if (useUTC) {
#if defined(_WIN32)
        gmtime_s(&tmBuffer, &seconds);
        tm = &tmBuffer;
#else
        tm = gmtime_r(&seconds, &tmBuffer);
#endif
    } else {
#if defined(_WIN32)
        localtime_s(&tmBuffer, &seconds);
        tm = &tmBuffer;
#else
        tm = localtime_r(&seconds, &tmBuffer);
#endif
    }

    InternalDateComponents dc;
    dc.year = tm->tm_year + 1900;
    dc.month = tm->tm_mon + 1;
    dc.day = tm->tm_mday;
    dc.hour = tm->tm_hour;
    dc.minute = tm->tm_min;
    dc.second = tm->tm_sec;
    dc.millisecond = ms % 1000;
    dc.dayOfWeek = tm->tm_wday; // 0 = Sunday

    return dc;
}

double componentsToTimestamp(const InternalDateComponents& dc) {
    std::tm tm = {};
    tm.tm_year = dc.year - 1900;
    tm.tm_mon = dc.month - 1;
    tm.tm_mday = dc.day;
    tm.tm_hour = dc.hour;
    tm.tm_min = dc.minute;
    tm.tm_sec = dc.second;

#if defined(_WIN32)
    std::time_t time = _mkgmtime(&tm);
#else
    std::time_t time = timegm(&tm);
#endif

    return static_cast<double>(time) * 1000.0 + dc.millisecond;
}

double componentsToTimestampLocal(const InternalDateComponents& dc) {
    std::tm tm = {};
    tm.tm_year = dc.year - 1900;
    tm.tm_mon = dc.month - 1;
    tm.tm_mday = dc.day;
    tm.tm_hour = dc.hour;
    tm.tm_min = dc.minute;
    tm.tm_sec = dc.second;
    tm.tm_isdst = -1; // Let the system determine DST

    std::time_t time = std::mktime(&tm);

    return static_cast<double>(time) * 1000.0 + dc.millisecond;
}

int getDayOfWeek(double timestamp) {
    // Calculate day of week (0 = Sunday, 6 = Saturday)
    // Using the fact that Jan 1, 1970 was a Thursday (day 4)
    int64_t ms = static_cast<int64_t>(timestamp);
    if (ms >= 0) {
        int64_t days = ms / MS_PER_DAY;
        return static_cast<int>((days + 4) % 7);
    }
    int64_t days = floorDiv(ms, MS_PER_DAY);
    return static_cast<int>(posMod(days + 4, static_cast<int64_t>(7)));
}

} // namespace nativedate::core
