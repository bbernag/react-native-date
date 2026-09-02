#include "doctest.h"

#include "Civil.hpp"
#include "fakes/ScopedTimezone.hpp"

#include <cmath>
#include <limits>
#include <stdexcept>

using namespace nativedate::core;
using nativedate::test::ScopedTimezone;

namespace {
constexpr double kNaN = std::numeric_limits<double>::quiet_NaN();
constexpr double kInf = std::numeric_limits<double>::infinity();
constexpr double kJan1_2024 = 1704067200000.0;      // 2024-01-01T00:00:00Z (Monday)
constexpr double kJul4_2024_16Z = 1720108800000.0;  // 2024-07-04T16:00:00Z
constexpr double kY2038 = 2147483648000.0;          // 2038-01-19T03:14:08Z (INT32_MAX + 1 seconds)

void checkComponents(const InternalDateComponents& dc, int year, int month, int day, int hour, int minute,
                     int second, int millisecond, int dayOfWeek) {
    CHECK(dc.year == year);
    CHECK(dc.month == month);
    CHECK(dc.day == day);
    CHECK(dc.hour == hour);
    CHECK(dc.minute == minute);
    CHECK(dc.second == second);
    CHECK(dc.millisecond == millisecond);
    CHECK(dc.dayOfWeek == dayOfWeek);
}
} // namespace

TEST_SUITE("Civil") {

TEST_CASE("isLeapYear follows the Gregorian rules") {
    CHECK(isLeapYear(2024));
    CHECK(isLeapYear(2000));
    CHECK(isLeapYear(1600));
    CHECK_FALSE(isLeapYear(2023));
    CHECK_FALSE(isLeapYear(1900));
    CHECK_FALSE(isLeapYear(2100));
}

TEST_CASE("daysInMonth accounts for leap Februaries and rejects other months") {
    CHECK(daysInMonth(2024, 2) == 29);
    CHECK(daysInMonth(2023, 2) == 28);
    CHECK(daysInMonth(2024, 1) == 31);
    CHECK(daysInMonth(2024, 4) == 30);
    CHECK(daysInMonth(2024, 12) == 31);
    CHECK_THROWS_AS(daysInMonth(2024, 0), std::invalid_argument);
    CHECK_THROWS_AS(daysInMonth(2024, 13), std::invalid_argument);
    CHECK_THROWS_AS(daysInMonth(2024, -1), std::invalid_argument);
}

TEST_CASE("isWeekendDay is true only for Sunday and Saturday") {
    CHECK(isWeekendDay(0));
    CHECK(isWeekendDay(6));
    for (int day = 1; day <= 5; ++day) {
        CHECK_FALSE(isWeekendDay(day));
    }
}

TEST_CASE("isValidTimestamp means finite and within +/-8.64e15 ms") {
    CHECK(isValidTimestamp(0.0));
    CHECK(isValidTimestamp(-1.0));
    CHECK(isValidTimestamp(MAX_TIMESTAMP_MS));
    CHECK(isValidTimestamp(-MAX_TIMESTAMP_MS));
    CHECK_FALSE(isValidTimestamp(MAX_TIMESTAMP_MS + 1));
    CHECK_FALSE(isValidTimestamp(-MAX_TIMESTAMP_MS - 1));
    CHECK_FALSE(isValidTimestamp(1e20));
    CHECK_FALSE(isValidTimestamp(kNaN));
    CHECK_FALSE(isValidTimestamp(kInf));
    CHECK_FALSE(isValidTimestamp(-kInf));
}

TEST_CASE("requireValidTimestamp and requireFiniteAmount throw std::invalid_argument") {
    CHECK_NOTHROW(requireValidTimestamp(MAX_TIMESTAMP_MS));
    CHECK_NOTHROW(requireValidTimestamp(-MAX_TIMESTAMP_MS));
    CHECK_THROWS_AS(requireValidTimestamp(kNaN), std::invalid_argument);
    CHECK_THROWS_AS(requireValidTimestamp(kInf), std::invalid_argument);
    CHECK_THROWS_AS(requireValidTimestamp(-kInf), std::invalid_argument);
    CHECK_THROWS_AS(requireValidTimestamp(1e20), std::invalid_argument);
    CHECK_THROWS_AS(requireValidTimestamp(MAX_TIMESTAMP_MS + 1), std::invalid_argument);

    CHECK_NOTHROW(requireFiniteAmount(1e300));
    CHECK_NOTHROW(requireFiniteAmount(-0.5));
    CHECK_THROWS_AS(requireFiniteAmount(kNaN), std::invalid_argument);
    CHECK_THROWS_AS(requireFiniteAmount(kInf), std::invalid_argument);
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

TEST_CASE("secondsFitTimeT models a 32-bit time_t") {
    const int64_t int32Max = std::numeric_limits<int32_t>::max();
    const int64_t int32Min = std::numeric_limits<int32_t>::min();
    CHECK(secondsFitTimeT(int32Max, 4));
    CHECK(secondsFitTimeT(int32Min, 4));
    CHECK_FALSE(secondsFitTimeT(int32Max + 1, 4)); // 2038-01-19T03:14:08Z
    CHECK_FALSE(secondsFitTimeT(int32Min - 1, 4));
    CHECK_FALSE(secondsFitTimeT(2208988800LL, 4)); // 2040-01-01
    CHECK(secondsFitTimeT(int32Max + 1, 8));
    CHECK(secondsFitTimeT(static_cast<int64_t>(MAX_TIMESTAMP_MS / 1000), 8));
    CHECK(secondsFitTimeT(0, sizeof(std::time_t))); // platform default is at least 32 bits
}

TEST_CASE("daysFromCivil / civilFromDays known anchors") {
    CHECK(daysFromCivil(1970, 1, 1) == 0);
    CHECK(daysFromCivil(1969, 12, 31) == -1);
    CHECK(daysFromCivil(2000, 3, 1) == 11017);
    CHECK(daysFromCivil(2024, 1, 1) == 19723);
    CHECK(daysFromCivil(1600, 1, 1) == -135140);
    CHECK(daysFromCivil(9999, 12, 31) == 2932896);
    CHECK(daysFromCivil(275760, 9, 13) == MAX_TIMESTAMP_DAYS);
    CHECK(daysFromCivil(-271821, 4, 20) == -MAX_TIMESTAMP_DAYS);

    CivilDate epoch = civilFromDays(0);
    CHECK(epoch.year == 1970);
    CHECK(epoch.month == 1);
    CHECK(epoch.day == 1);
    CivilDate before = civilFromDays(-1);
    CHECK(before.year == 1969);
    CHECK(before.month == 12);
    CHECK(before.day == 31);
    CHECK(dayOfWeekFromDays(0) == 4);
    CHECK(dayOfWeekFromDays(-1) == 3);
    CHECK(dayOfWeekFromDays(19723) == 1);
}

TEST_CASE("daysFromCivil normalizes overflowing months and days") {
    CHECK(daysFromCivil(2024, 13, 1) == daysFromCivil(2025, 1, 1));
    CHECK(daysFromCivil(2024, 0, 15) == daysFromCivil(2023, 12, 15));
    CHECK(daysFromCivil(2024, -11, 1) == daysFromCivil(2023, 1, 1));
    CHECK(daysFromCivil(2024, 25, 1) == daysFromCivil(2026, 1, 1));
    CHECK(daysFromCivil(2024, 1, 32) == daysFromCivil(2024, 2, 1));
    CHECK(daysFromCivil(2024, 3, 0) == daysFromCivil(2024, 2, 29));
    CHECK(daysFromCivil(2024, 1, -30) == daysFromCivil(2023, 12, 1));
}

TEST_CASE("civil round trips every day from 1600 through 9999 including leap centuries") {
    int64_t expectedDays = daysFromCivil(1600, 1, 1);
    int expectedDow = dayOfWeekFromDays(expectedDays);
    for (int year = 1600; year <= 9999; ++year) {
        for (int month = 1; month <= 12; ++month) {
            const int last = daysInMonth(year, month);
            for (int day = 1; day <= last; ++day) {
                const int64_t days = daysFromCivil(year, month, day);
                if (days != expectedDays) {
                    FAIL("daysFromCivil(", year, ",", month, ",", day, ") = ", days, " expected ", expectedDays);
                }
                const CivilDate back = civilFromDays(days);
                if (back.year != year || back.month != month || back.day != day) {
                    FAIL("civilFromDays(", days, ") = ", back.year, "-", back.month, "-", back.day);
                }
                if (dayOfWeekFromDays(days) != expectedDow) {
                    FAIL("dayOfWeekFromDays(", days, ") mismatch on ", year, "-", month, "-", day);
                }
                ++expectedDays;
                expectedDow = (expectedDow + 1) % 7;
            }
        }
    }
    CHECK(expectedDays == daysFromCivil(10000, 1, 1));
    // Leap centuries: 1600 and 2000 have 366 days, 1700/1800/1900/2100 do not.
    CHECK(daysFromCivil(1601, 1, 1) - daysFromCivil(1600, 1, 1) == 366);
    CHECK(daysFromCivil(1701, 1, 1) - daysFromCivil(1700, 1, 1) == 365);
    CHECK(daysFromCivil(1901, 1, 1) - daysFromCivil(1900, 1, 1) == 365);
    CHECK(daysFromCivil(2001, 1, 1) - daysFromCivil(2000, 1, 1) == 366);
    CHECK(daysFromCivil(2101, 1, 1) - daysFromCivil(2100, 1, 1) == 365);
}

TEST_CASE("getDayOfWeek handles the epoch, later dates and pre-epoch dates") {
    CHECK(getDayOfWeek(0) == 4);                 // 1970-01-01 was a Thursday
    CHECK(getDayOfWeek(kJan1_2024) == 1);        // Monday
    CHECK(getDayOfWeek(-43200000.0) == 3);       // 1969-12-31T12:00Z, Wednesday
    CHECK(getDayOfWeek(-1) == 3);                // 1969-12-31T23:59:59.999Z
    CHECK_THROWS_AS(getDayOfWeek(kNaN), std::invalid_argument);
}

TEST_CASE("timestampToComponents in UTC") {
    checkComponents(timestampToComponents(kJan1_2024 + 123, true), 2024, 1, 1, 0, 0, 0, 123, 1);
    checkComponents(timestampToComponents(0, true), 1970, 1, 1, 0, 0, 0, 0, 4);
    checkComponents(timestampToComponents(kY2038, true), 2038, 1, 19, 3, 14, 8, 0, 2);
}

TEST_CASE("timestampToComponents floors pre-epoch instants (no negative milliseconds)") {
    checkComponents(timestampToComponents(-1, true), 1969, 12, 31, 23, 59, 59, 999, 3);
    checkComponents(timestampToComponents(-1500, true), 1969, 12, 31, 23, 59, 58, 500, 3);
    checkComponents(timestampToComponents(-86400001, true), 1969, 12, 30, 23, 59, 59, 999, 2);
    checkComponents(timestampToComponents(-MS_PER_DAY, true), 1969, 12, 31, 0, 0, 0, 0, 3);

    ScopedTimezone utc("UTC");
    CHECK(timestampToComponents(-1, false).millisecond == 999);
    CHECK(timestampToComponents(-1, false).second == 59);
    CHECK(timestampToComponents(-1500, false).millisecond == 500);
}

TEST_CASE("timestampToComponents covers the full ECMAScript range in UTC") {
    checkComponents(timestampToComponents(MAX_TIMESTAMP_MS, true), 275760, 9, 13, 0, 0, 0, 0, 6);
    checkComponents(timestampToComponents(-MAX_TIMESTAMP_MS, true), -271821, 4, 20, 0, 0, 0, 0, 2);
    CHECK(componentsToTimestamp(timestampToComponents(MAX_TIMESTAMP_MS, true)) == MAX_TIMESTAMP_MS);
    CHECK(componentsToTimestamp(timestampToComponents(-MAX_TIMESTAMP_MS, true)) == -MAX_TIMESTAMP_MS);
    CHECK(componentsToTimestamp(timestampToComponents(MAX_TIMESTAMP_MS - 1, true)) == MAX_TIMESTAMP_MS - 1);
}

TEST_CASE("timestampToComponents rejects non-finite and out-of-range values") {
    for (bool useUTC : {true, false}) {
        CHECK_THROWS_AS(timestampToComponents(kNaN, useUTC), std::invalid_argument);
        CHECK_THROWS_AS(timestampToComponents(kInf, useUTC), std::invalid_argument);
        CHECK_THROWS_AS(timestampToComponents(-kInf, useUTC), std::invalid_argument);
        CHECK_THROWS_AS(timestampToComponents(1e20, useUTC), std::invalid_argument);
        CHECK_THROWS_AS(timestampToComponents(MAX_TIMESTAMP_MS + 1, useUTC), std::invalid_argument);
        CHECK_THROWS_AS(timestampToComponents(-MAX_TIMESTAMP_MS - 1, useUTC), std::invalid_argument);
    }
}

TEST_CASE("componentsToTimestamp round-trips a leap day in UTC") {
    InternalDateComponents dc = {2024, 2, 29, 12, 30, 45, 500, 0};
    double ts = componentsToTimestamp(dc);
    CHECK(ts == 1709209845500.0);
    checkComponents(timestampToComponents(ts, true), 2024, 2, 29, 12, 30, 45, 500, 4);
}

TEST_CASE("componentsToTimestamp normalizes overflowing fields") {
    InternalDateComponents jan1_2025 = {2025, 1, 1, 0, 0, 0, 0, 0};
    InternalDateComponents month13 = {2024, 13, 1, 0, 0, 0, 0, 0};
    CHECK(componentsToTimestamp(month13) == componentsToTimestamp(jan1_2025));

    InternalDateComponents feb1 = {2024, 2, 1, 0, 0, 0, 0, 0};
    InternalDateComponents jan32 = {2024, 1, 32, 0, 0, 0, 0, 0};
    InternalDateComponents jan31_24h = {2024, 1, 31, 24, 0, 0, 0, 0};
    InternalDateComponents jan31_neg = {2024, 2, 1, 0, -1, 60, 0, 0};
    CHECK(componentsToTimestamp(jan32) == componentsToTimestamp(feb1));
    CHECK(componentsToTimestamp(jan31_24h) == componentsToTimestamp(feb1));
    CHECK(componentsToTimestamp(jan31_neg) == componentsToTimestamp(feb1));

    InternalDateComponents preEpoch = {1969, 12, 31, 23, 59, 59, 999, 0};
    CHECK(componentsToTimestamp(preEpoch) == -1);
}

TEST_CASE("componentsToTimestamp rejects years outside the timestamp range") {
    InternalDateComponents farFuture = {300000, 1, 1, 0, 0, 0, 0, 0};
    InternalDateComponents farPast = {-300000, 1, 1, 0, 0, 0, 0, 0};
    InternalDateComponents justOver = {275760, 9, 13, 0, 0, 0, 1, 0};
    InternalDateComponents intMax = {std::numeric_limits<int>::max(), 1, 1, 0, 0, 0, 0, 0};
    InternalDateComponents intMin = {std::numeric_limits<int>::min(), 1, 1, 0, 0, 0, 0, 0};
    CHECK_THROWS_AS(componentsToTimestamp(farFuture), std::invalid_argument);
    CHECK_THROWS_AS(componentsToTimestamp(farPast), std::invalid_argument);
    CHECK_THROWS_AS(componentsToTimestamp(justOver), std::invalid_argument);
    CHECK_THROWS_AS(componentsToTimestamp(intMax), std::invalid_argument);
    CHECK_THROWS_AS(componentsToTimestamp(intMin), std::invalid_argument);
    CHECK_THROWS_AS(componentsToTimestampLocal(farFuture), std::invalid_argument);
    CHECK_THROWS_AS(componentsToTimestampLocal(farPast), std::invalid_argument);
    CHECK_THROWS_AS(componentsToTimestampLocal(intMax), std::invalid_argument);
    CHECK_THROWS_AS(componentsToTimestampLocal(intMin), std::invalid_argument);
}

TEST_CASE("local conversions equal UTC conversions when TZ=UTC") {
    ScopedTimezone utc("UTC");
    InternalDateComponents dc = {2024, 7, 4, 16, 0, 0, 0, 0};
    CHECK(componentsToTimestampLocal(dc) == componentsToTimestamp(dc));
    CHECK(componentsToTimestampLocal(dc) == kJul4_2024_16Z);
    InternalDateComponents local = timestampToComponents(kJul4_2024_16Z, false);
    CHECK(local.hour == 16);
    CHECK(local.dayOfWeek == 4);

    // Pre-epoch and the -1 sentinel: 1969-12-31T23:59:59 is a real instant.
    InternalDateComponents lastSecond = {1969, 12, 31, 23, 59, 59, 0, 0};
    CHECK(componentsToTimestampLocal(lastSecond) == -1000.0);
    InternalDateComponents lastMs = {1969, 12, 31, 23, 59, 59, 999, 0};
    CHECK(componentsToTimestampLocal(lastMs) == -1.0);
    checkComponents(timestampToComponents(-1000.0, false), 1969, 12, 31, 23, 59, 59, 0, 3);
}

TEST_CASE("local conversions normalize overflowing fields like the UTC path") {
    ScopedTimezone utc("UTC");
    InternalDateComponents feb1 = {2024, 2, 1, 0, 0, 0, 0, 0};
    InternalDateComponents jan32 = {2024, 1, 32, 0, 0, 0, 0, 0};
    InternalDateComponents month13 = {2023, 13, 32, 0, 0, 0, 0, 0};
    InternalDateComponents day0 = {2024, 2, 2, -24, 0, 0, 0, 0};
    CHECK(componentsToTimestampLocal(jan32) == componentsToTimestampLocal(feb1));
    CHECK(componentsToTimestampLocal(month13) == componentsToTimestampLocal(feb1));
    CHECK(componentsToTimestampLocal(day0) == componentsToTimestampLocal(feb1));
}

TEST_CASE("local conversions honour the process zone (America/New_York, EDT)") {
    ScopedTimezone newYork("America/New_York");
    InternalDateComponents noon = {2024, 7, 4, 12, 0, 0, 0, 0};
    CHECK(componentsToTimestampLocal(noon) == kJul4_2024_16Z);
    InternalDateComponents local = timestampToComponents(kJul4_2024_16Z, false);
    CHECK(local.day == 4);
    CHECK(local.hour == 12);
}

TEST_CASE("local conversions work past 2038 on 64-bit time_t hosts") {
    if (sizeof(std::time_t) < 8) {
        return; // the 32-bit guard is covered by the secondsFitTimeT test
    }
    ScopedTimezone newYork("America/New_York");
    InternalDateComponents y2040 = {2040, 1, 1, 0, 0, 0, 0, 0};
    const double ts = componentsToTimestampLocal(y2040);
    CHECK(ts == 2208988800000.0 + 5 * MS_PER_HOUR); // EST midnight = 05:00Z
    checkComponents(timestampToComponents(ts, false), 2040, 1, 1, 0, 0, 0, 0, 0);
    checkComponents(timestampToComponents(kY2038, false), 2038, 1, 18, 22, 14, 8, 0, 1);
}

TEST_CASE("nowMs is close to the system clock") {
    double a = nowMs();
    CHECK(a > kJan1_2024);
    CHECK(isValidTimestamp(a));
}

} // TEST_SUITE
