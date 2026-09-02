#include "doctest.h"

#include "Civil.hpp"
#include "fakes/ScopedTimezone.hpp"

#include <cmath>
#include <limits>

using namespace nativedate::core;
using nativedate::test::ScopedTimezone;

namespace {
constexpr double kJan1_2024 = 1704067200000.0;      // 2024-01-01T00:00:00Z (Monday)
constexpr double kJul4_2024_16Z = 1720108800000.0;  // 2024-07-04T16:00:00Z
} // namespace

TEST_SUITE("Civil") {

TEST_CASE("isLeapYear follows the Gregorian rules") {
    CHECK(isLeapYear(2024));
    CHECK(isLeapYear(2000));
    CHECK_FALSE(isLeapYear(2023));
    CHECK_FALSE(isLeapYear(1900));
    CHECK_FALSE(isLeapYear(2100));
}

TEST_CASE("daysInMonth accounts for leap Februaries") {
    CHECK(daysInMonth(2024, 2) == 29);
    CHECK(daysInMonth(2023, 2) == 28);
    CHECK(daysInMonth(2024, 1) == 31);
    CHECK(daysInMonth(2024, 4) == 30);
    CHECK(daysInMonth(2024, 12) == 31);
}

TEST_CASE("isWeekendDay is true only for Sunday and Saturday") {
    CHECK(isWeekendDay(0));
    CHECK(isWeekendDay(6));
    for (int day = 1; day <= 5; ++day) {
        CHECK_FALSE(isWeekendDay(day));
    }
}

TEST_CASE("isValidTimestamp rejects NaN and infinities") {
    CHECK(isValidTimestamp(0.0));
    CHECK(isValidTimestamp(-1.0));
    CHECK_FALSE(isValidTimestamp(std::numeric_limits<double>::quiet_NaN()));
    CHECK_FALSE(isValidTimestamp(std::numeric_limits<double>::infinity()));
    CHECK_FALSE(isValidTimestamp(-std::numeric_limits<double>::infinity()));
}

TEST_CASE("floorDiv and posMod round toward negative infinity") {
    CHECK(floorDiv(7, 7) == 1);
    CHECK(floorDiv(-1, 7) == -1);
    CHECK(floorDiv(-7, 7) == -1);
    CHECK(floorDiv(-8, 7) == -2);
    CHECK(posMod(-1, 7) == 6);
    CHECK(posMod(8, 7) == 1);
    CHECK(floorDayStartMs(MS_PER_DAY + 1) == MS_PER_DAY);
    CHECK(floorDayStartMs(-1) == -MS_PER_DAY);
}

TEST_CASE("getDayOfWeek handles the epoch, later dates and pre-epoch dates") {
    CHECK(getDayOfWeek(0) == 4);                 // 1970-01-01 was a Thursday
    CHECK(getDayOfWeek(kJan1_2024) == 1);        // Monday
    CHECK(getDayOfWeek(-43200000.0) == 3);       // 1969-12-31T12:00Z, Wednesday
}

TEST_CASE("timestampToComponents in UTC") {
    InternalDateComponents dc = timestampToComponents(kJan1_2024 + 123, true);
    CHECK(dc.year == 2024);
    CHECK(dc.month == 1);
    CHECK(dc.day == 1);
    CHECK(dc.hour == 0);
    CHECK(dc.minute == 0);
    CHECK(dc.second == 0);
    CHECK(dc.millisecond == 123);
    CHECK(dc.dayOfWeek == 1);
}

TEST_CASE("componentsToTimestamp round-trips a leap day in UTC") {
    InternalDateComponents dc = {2024, 2, 29, 12, 30, 45, 500, 0};
    double ts = componentsToTimestamp(dc);
    CHECK(ts == 1709209845500.0);
    InternalDateComponents back = timestampToComponents(ts, true);
    CHECK(back.year == 2024);
    CHECK(back.month == 2);
    CHECK(back.day == 29);
    CHECK(back.hour == 12);
    CHECK(back.minute == 30);
    CHECK(back.second == 45);
    CHECK(back.millisecond == 500);
    CHECK(back.dayOfWeek == 4);
}

TEST_CASE("local conversions equal UTC conversions when TZ=UTC") {
    ScopedTimezone utc("UTC");
    InternalDateComponents dc = {2024, 7, 4, 16, 0, 0, 0, 0};
    CHECK(componentsToTimestampLocal(dc) == componentsToTimestamp(dc));
    CHECK(componentsToTimestampLocal(dc) == kJul4_2024_16Z);
    InternalDateComponents local = timestampToComponents(kJul4_2024_16Z, false);
    CHECK(local.hour == 16);
    CHECK(local.dayOfWeek == 4);
}

TEST_CASE("local conversions honour the process zone (America/New_York, EDT)") {
    ScopedTimezone newYork("America/New_York");
    InternalDateComponents noon = {2024, 7, 4, 12, 0, 0, 0, 0};
    CHECK(componentsToTimestampLocal(noon) == kJul4_2024_16Z);
    InternalDateComponents local = timestampToComponents(kJul4_2024_16Z, false);
    CHECK(local.day == 4);
    CHECK(local.hour == 12);
}

TEST_CASE("nowMs is close to the system clock") {
    double a = nowMs();
    CHECK(a > kJan1_2024);
    CHECK(isValidTimestamp(a));
}

} // TEST_SUITE
