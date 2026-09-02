#include "doctest.h"

#include "Arithmetic.hpp"
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
constexpr double kJan1_2024 = 1704067200000.0;     // 2024-01-01T00:00:00Z (Monday)
constexpr double kTuesday = 1709647629045.0;       // 2024-03-05T14:07:09.045Z
constexpr double kJan31_2024 = 1706695200000.0;    // 2024-01-31T10:00:00Z
constexpr double kFeb29_2024 = 1709200800000.0;    // 2024-02-29T10:00:00Z
constexpr double kJan31_2023 = 1675159200000.0;    // 2023-01-31T10:00:00Z
constexpr double kFeb28_2023 = 1677578400000.0;    // 2023-02-28T10:00:00Z
constexpr double kMar31_2024 = 1711879200000.0;    // 2024-03-31T10:00:00Z
constexpr double kApr30_2024 = 1714471200000.0;    // 2024-04-30T10:00:00Z
constexpr double kDec15_2024 = 1734256800000.0;    // 2024-12-15T10:00:00Z
constexpr double kJan15_2025 = 1736935200000.0;    // 2025-01-15T10:00:00Z
constexpr double kJan15_2024 = 1705312800000.0;    // 2024-01-15T10:00:00Z
constexpr double kDec15_2023 = 1702634400000.0;    // 2023-12-15T10:00:00Z
constexpr double kNov15_2022 = 1668506400000.0;    // 2022-11-15T10:00:00Z
constexpr double kFeb28_2025 = 1740736800000.0;    // 2025-02-28T10:00:00Z
constexpr double kFeb29_2028 = 1835431200000.0;    // 2028-02-29T10:00:00Z
constexpr double kJul4_16Z = 1720108800000.0;      // 2024-07-04T16:00:00Z
constexpr double kMar1_2024 = 1709287200000.0;     // 2024-03-01T10:00:00Z
constexpr double kMay31_2024 = 1717149600000.0;    // 2024-05-31T10:00:00Z
constexpr double kJun30_2024 = 1719741600000.0;    // 2024-06-30T10:00:00Z
constexpr double kDec31_2023 = 1704016800000.0;    // 2023-12-31T10:00:00Z

// America/New_York DST transitions in 2024 (spring forward Mar 10, fall back Nov 3)
constexpr double kMar10_midnightEST = 1710046800000.0; // 2024-03-10T00:00-05:00 (05:00Z)
constexpr double kMar11_midnightEDT = 1710129600000.0; // 2024-03-11T00:00-04:00 (04:00Z)
constexpr double kMar17_midnightEDT = 1710648000000.0; // 2024-03-17T00:00-04:00 (04:00Z)
constexpr double kNov3_midnightEDT = 1730606400000.0;  // 2024-11-03T00:00-04:00 (04:00Z)
constexpr double kNov4_midnightEST = 1730696400000.0;  // 2024-11-04T00:00-05:00 (05:00Z)
constexpr double kNov10_midnightEST = 1731214800000.0; // 2024-11-10T00:00-05:00 (05:00Z)
} // namespace

TEST_SUITE("Arithmetic") {

TEST_CASE("fixed-length units add exact milliseconds") {
    CHECK(add(kJan1_2024, 5, Unit::Millisecond) == kJan1_2024 + 5);
    CHECK(add(kJan1_2024, 5, Unit::Second) == kJan1_2024 + 5 * MS_PER_SECOND);
    CHECK(add(kJan1_2024, 5, Unit::Minute) == kJan1_2024 + 5 * MS_PER_MINUTE);
    CHECK(add(kJan1_2024, 5, Unit::Hour) == kJan1_2024 + 5 * MS_PER_HOUR);
    CHECK(add(kJan1_2024, 5, Unit::Day) == kJan1_2024 + 5 * MS_PER_DAY);
    CHECK(add(kJan1_2024, 2, Unit::Week) == kJan1_2024 + 2 * MS_PER_WEEK);
    CHECK(add(kJan1_2024, -1, Unit::Day) == kJan1_2024 - MS_PER_DAY);
}

TEST_CASE("adding months clamps to the last valid day (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK(add(kJan31_2024, 1, Unit::Month) == kFeb29_2024);
    CHECK(add(kJan31_2023, 1, Unit::Month) == kFeb28_2023);
    CHECK(add(kMar31_2024, 1, Unit::Month) == kApr30_2024);
    CHECK(add(kDec15_2024, 1, Unit::Month) == kJan15_2025);
    CHECK(add(kJan15_2024, -1, Unit::Month) == kDec15_2023);
    CHECK(add(kJan15_2024, -14, Unit::Month) == kNov15_2022);
    CHECK(add(kJan15_2024, 12, Unit::Month) == kJan15_2025);
}

TEST_CASE("adding years clamps Feb 29 to Feb 28 (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK(add(kFeb29_2024, 1, Unit::Year) == kFeb28_2025);
    CHECK(add(kFeb29_2024, 4, Unit::Year) == kFeb29_2028);
    CHECK(add(kFeb29_2024, -1, Unit::Year) == kFeb28_2023);
    CHECK(add(kJan15_2024, 1, Unit::Year) == kJan15_2025);
}

TEST_CASE("subtract(n) equals add(-n) for every unit (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    const Unit units[] = {Unit::Millisecond, Unit::Second, Unit::Minute, Unit::Hour,
                          Unit::Day, Unit::Week, Unit::Month, Unit::Year};
    for (Unit unit : units) {
        CHECK(subtract(kJan31_2024, 3, unit) == add(kJan31_2024, -3, unit));
        CHECK(subtract(kFeb29_2024, 1, unit) == add(kFeb29_2024, -1, unit));
    }
}

TEST_CASE("isBefore / isAfter are strict") {
    CHECK(isBefore(1, 2));
    CHECK_FALSE(isBefore(2, 2));
    CHECK(isAfter(2, 1));
    CHECK_FALSE(isAfter(2, 2));
}

TEST_CASE("isSame compares truncated units (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK(isSame(kTuesday, kTuesday - 1000, Unit::Day));
    CHECK(isSame(kTuesday, kJan1_2024 + 64 * MS_PER_DAY, Unit::Day)); // 2024-03-05T00:00Z
    CHECK_FALSE(isSame(kTuesday, kJan1_2024 + 64 * MS_PER_DAY, Unit::Hour));
    CHECK_FALSE(isSame(kTuesday, kJan1_2024 + 63 * MS_PER_DAY, Unit::Day)); // 2024-03-04
    CHECK(isSame(kTuesday, kMar31_2024, Unit::Month));
    CHECK_FALSE(isSame(kTuesday, kApr30_2024, Unit::Month));
    CHECK(isSame(kTuesday, kDec15_2024, Unit::Year));
    CHECK_FALSE(isSame(kTuesday, kJan15_2025, Unit::Year));
}

TEST_CASE("startOf / endOf sub-day units") {
    CHECK(startOf(kTuesday, Unit::Millisecond) == kTuesday);
    CHECK(startOf(kTuesday, Unit::Second) == 1709647629000.0);
    CHECK(startOf(kTuesday, Unit::Minute) == 1709647620000.0);
    CHECK(startOf(kTuesday, Unit::Hour) == 1709647200000.0);
    CHECK(endOf(kTuesday, Unit::Second) == 1709647629999.0);
    CHECK(endOf(kTuesday, Unit::Minute) == 1709647679999.0);
    CHECK(endOf(kTuesday, Unit::Hour) == 1709650799999.0);
}

TEST_CASE("startOf / endOf day, week, month, year (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK(startOf(kTuesday, Unit::Day) == 1709596800000.0);          // 2024-03-05T00:00Z
    CHECK(endOf(kTuesday, Unit::Day) == 1709683199999.0);            // 2024-03-05T23:59:59.999Z
    CHECK(startOf(kTuesday, Unit::Week) == 1709424000000.0);         // Sunday 2024-03-03
    CHECK(endOf(kTuesday, Unit::Week) == 1710028799999.0);           // Saturday 2024-03-09 end
    CHECK(startOf(kTuesday, Unit::Month) == 1709251200000.0);        // 2024-03-01T00:00Z
    CHECK(endOf(kTuesday, Unit::Month) == 1711929599999.0);          // 2024-03-31T23:59:59.999Z
    CHECK(startOf(kTuesday, Unit::Year) == kJan1_2024);
    CHECK(endOf(kTuesday, Unit::Year) == 1735689599999.0);           // 2024-12-31T23:59:59.999Z
    // December rolls into the next year (month 13 is normalized).
    CHECK(endOf(kDec15_2024, Unit::Month) == 1735689599999.0);
    CHECK(startOf(kDec15_2024, Unit::Month) == 1733011200000.0);     // 2024-12-01T00:00Z
    CHECK(endOf(kDec15_2024, Unit::Week) == 1734825599999.0);        // Saturday 2024-12-21 end
    CHECK(endOf(kDec31_2023, Unit::Day) == kJan1_2024 - 1);
}

TEST_CASE("startOf / endOf day use the process zone (America/New_York, EDT)") {
    ScopedTimezone newYork("America/New_York");
    CHECK(startOf(kJul4_16Z, Unit::Day) == 1720065600000.0);         // 2024-07-04T04:00Z
    CHECK(endOf(kJul4_16Z, Unit::Day) == 1720151999999.0);           // 2024-07-05T03:59:59.999Z
    CHECK(truncateToUnit(kJul4_16Z, Unit::Day) == 1720065600000.0);
}

TEST_CASE("diff in fixed units divides exactly and truncates partial units") {
    CHECK(diff(kJan1_2024 + 1500, kJan1_2024, Unit::Millisecond) == 1500);
    CHECK(diff(kJan1_2024 + 1500, kJan1_2024, Unit::Second) == 1);
    CHECK(diff(kJan1_2024 + 90 * MS_PER_MINUTE, kJan1_2024, Unit::Hour) == 1);
    CHECK(diff(kJan1_2024 + 3 * MS_PER_DAY, kJan1_2024, Unit::Day) == 3);
    CHECK(diff(kJan1_2024 + 15 * MS_PER_DAY, kJan1_2024, Unit::Week) == 2);
    CHECK(diff(kJan1_2024, kJan1_2024 + 3 * MS_PER_DAY, Unit::Day) == -3);
}

TEST_CASE("diff in months and years counts complete local months (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK(diff(kTuesday, kDec15_2023, Unit::Month) == 2);   // Dec 15 -> Mar 5 is 2 complete months
    CHECK(diff(kDec15_2023, kTuesday, Unit::Month) == -2);
    CHECK(diff(kJan15_2025, kJan15_2024, Unit::Month) == 12);
    CHECK(diff(kJan15_2025, kJan15_2024, Unit::Year) == 1);
    CHECK(diff(kJan15_2024, kJan15_2025, Unit::Year) == -1);
    CHECK(diff(kJan15_2024, kDec15_2023, Unit::Year) == 0); // one month is not a complete year
    CHECK(diff(kJan15_2024, kDec15_2023, Unit::Month) == 1);
    CHECK(diff(kJan15_2024 + 1, kJan15_2024, Unit::Month) == 0);
    CHECK(diff(kJan15_2024, kJan15_2024, Unit::Month) == 0);

    // Clamped month ends count as complete months, matching add().
    CHECK(diff(kFeb29_2024, kJan31_2024, Unit::Month) == 1);
    CHECK(diff(kJan31_2024, kFeb29_2024, Unit::Month) == -1);
    CHECK(diff(kMar1_2024, kJan31_2024, Unit::Month) == 1);  // Jan 31 -> Mar 1: second month incomplete
    CHECK(diff(kJan31_2024, kMar1_2024, Unit::Month) == -1);
    CHECK(diff(kMar31_2024, kJan31_2024, Unit::Month) == 2);
    CHECK(diff(kFeb28_2025, kFeb29_2024, Unit::Year) == 1);
    CHECK(diff(kFeb28_2025, kFeb29_2024, Unit::Month) == 12);
    CHECK(diff(kFeb28_2025 - 1, kFeb29_2024, Unit::Year) == 0);
    for (double a : {kJan31_2024, kFeb29_2024, kMar1_2024, kDec15_2023, kJan15_2025}) {
        for (double b : {kJan31_2024, kFeb29_2024, kMar1_2024, kDec15_2023, kJan15_2025}) {
            CHECK(diff(a, b, Unit::Month) == -diff(b, a, Unit::Month));
            CHECK(diff(a, b, Unit::Year) == -diff(b, a, Unit::Year));
        }
    }
}

TEST_CASE("diff in months uses local components, not UTC (America/Los_Angeles)") {
    ScopedTimezone la("America/Los_Angeles");
    const double jan31_16h = 1706745600000.0; // 2024-01-31T16:00-08:00 = 2024-02-01T00:00Z
    const double jan15_16h = 1705363200000.0; // 2024-01-15T16:00-08:00 = 2024-01-16T00:00Z
    CHECK(diff(jan31_16h, jan15_16h, Unit::Month) == 0); // still January locally
    CHECK(diff(jan15_16h, jan31_16h, Unit::Month) == 0);
    CHECK(diff(add(jan15_16h, 1, Unit::Month), jan15_16h, Unit::Month) == 1);
}

TEST_CASE("diff in fixed units truncates toward zero and is antisymmetric") {
    CHECK(diff(0, 129600000, Unit::Day) == -1);   // -1.5 days
    CHECK(diff(129600000, 0, Unit::Day) == 1);
    CHECK(diff(0, 90 * MS_PER_MINUTE, Unit::Hour) == -1);
    CHECK(diff(90 * MS_PER_MINUTE, 0, Unit::Hour) == 1);
    CHECK(diff(-1500, 0, Unit::Second) == -1);
    CHECK(diff(0, -1500, Unit::Second) == 1);
    CHECK(diff(0, 10 * MS_PER_DAY, Unit::Week) == -1);
    const double samples[] = {0, -1, 1500, -129600000, 129600000, kTuesday, -kTuesday};
    const Unit units[] = {Unit::Millisecond, Unit::Second, Unit::Minute, Unit::Hour, Unit::Day, Unit::Week};
    for (double a : samples) {
        for (double b : samples) {
            for (Unit unit : units) {
                CHECK(diff(a, b, unit) == -diff(b, a, unit));
            }
        }
    }
}

TEST_CASE("adding days and weeks keeps the wall clock across DST (America/New_York)") {
    ScopedTimezone newYork("America/New_York");
    // Spring forward: 2024-03-10 has 23 hours.
    CHECK(add(kMar10_midnightEST, 1, Unit::Day) == kMar11_midnightEDT);
    CHECK(add(kMar10_midnightEST, 1, Unit::Week) == kMar17_midnightEDT);
    CHECK(add(kMar11_midnightEDT, -1, Unit::Day) == kMar10_midnightEST);
    CHECK(subtract(kMar17_midnightEDT, 1, Unit::Week) == kMar10_midnightEST);
    CHECK(add(kMar10_midnightEST, 1, Unit::Day) != kMar10_midnightEST + MS_PER_DAY);
    // Fall back: 2024-11-03 has 25 hours.
    CHECK(add(kNov3_midnightEDT, 1, Unit::Day) == kNov4_midnightEST);
    CHECK(add(kNov3_midnightEDT, 1, Unit::Week) == kNov10_midnightEST);
    CHECK(add(kNov4_midnightEST, -1, Unit::Day) == kNov3_midnightEDT);
    CHECK(subtract(kNov10_midnightEST, 1, Unit::Week) == kNov3_midnightEDT);
    // The local time of day is preserved for a non-midnight wall clock too.
    const double nov3_noonEST = kNov3_midnightEDT + 13 * MS_PER_HOUR; // 12:00 EST (25h day)
    CHECK(timestampToComponents(add(nov3_noonEST, 1, Unit::Day), false).hour == 12);
    CHECK(timestampToComponents(add(nov3_noonEST, -1, Unit::Day), false).hour == 12);
    // Hours remain duration math.
    CHECK(add(kMar10_midnightEST, 24, Unit::Hour) == kMar10_midnightEST + MS_PER_DAY);
    // Month boundaries are crossed by calendar date.
    CHECK(timestampToComponents(add(kMar10_midnightEST, 31, Unit::Day), false).month == 4);
    CHECK(timestampToComponents(add(kMar10_midnightEST, 31, Unit::Day), false).day == 10);
}

TEST_CASE("startOf / endOf day and week across DST (America/New_York)") {
    ScopedTimezone newYork("America/New_York");
    const double mar10_noon = kMar10_midnightEST + 11 * MS_PER_HOUR; // 12:00 EDT on the 23h day
    CHECK(startOf(mar10_noon, Unit::Day) == kMar10_midnightEST);
    CHECK(endOf(mar10_noon, Unit::Day) == kMar11_midnightEDT - 1);
    CHECK(endOf(mar10_noon, Unit::Day) - startOf(mar10_noon, Unit::Day) + 1 == 23 * MS_PER_HOUR);

    const double nov3_0030 = kNov3_midnightEDT + 30 * MS_PER_MINUTE; // 00:30 EDT on the 25h day
    CHECK(startOf(nov3_0030, Unit::Day) == kNov3_midnightEDT);
    CHECK(endOf(nov3_0030, Unit::Day) == kNov4_midnightEST - 1);
    CHECK(endOf(nov3_0030, Unit::Day) - startOf(nov3_0030, Unit::Day) + 1 == 25 * MS_PER_HOUR);

    // Week containing the fall-back Sunday: Sun Nov 3 00:00 EDT .. Sat Nov 9 23:59:59.999 EST
    const double wed_nov6 = 1730869200000.0; // 2024-11-06T00:00 EST
    CHECK(startOf(wed_nov6, Unit::Week) == kNov3_midnightEDT);
    CHECK(endOf(wed_nov6, Unit::Week) == kNov10_midnightEST - 1);
    CHECK(startOf(nov3_0030, Unit::Week) == kNov3_midnightEDT);
    CHECK(endOf(nov3_0030, Unit::Week) == kNov10_midnightEST - 1);
    // Week containing the spring-forward Sunday
    const double thu_mar14 = kMar11_midnightEDT + 3 * MS_PER_DAY + 9 * MS_PER_HOUR; // 2024-03-14T09:00 EDT
    CHECK(startOf(thu_mar14, Unit::Week) == kMar10_midnightEST);
    CHECK(endOf(thu_mar14, Unit::Week) == kMar17_midnightEDT - 1);
}

TEST_CASE("isSame week and hour across DST (America/New_York)") {
    ScopedTimezone newYork("America/New_York");
    const double nov3_0030 = kNov3_midnightEDT + 30 * MS_PER_MINUTE;
    const double wed_nov6_noon = 1730912400000.0; // 2024-11-06T12:00 EST
    const double sat_nov9_late = kNov10_midnightEST - 1;
    CHECK(isSame(nov3_0030, wed_nov6_noon, Unit::Week));
    CHECK(isSame(nov3_0030, sat_nov9_late, Unit::Week));
    CHECK(isSame(wed_nov6_noon, sat_nov9_late, Unit::Week));
    CHECK_FALSE(isSame(nov3_0030, kNov10_midnightEST, Unit::Week));
    CHECK_FALSE(isSame(nov3_0030, kNov3_midnightEDT - 1, Unit::Week));
    CHECK(isSame(nov3_0030, kNov4_midnightEST - 1, Unit::Day));
    CHECK_FALSE(isSame(nov3_0030, kNov4_midnightEST, Unit::Day));

    // The repeated 01:xx hour on fall-back day is two distinct local hours.
    const double edt_0130 = 1730611800000.0; // 2024-11-03T01:30 EDT (05:30Z)
    const double est_0130 = 1730615400000.0; // 2024-11-03T01:30 EST (06:30Z)
    CHECK_FALSE(isSame(edt_0130, est_0130, Unit::Millisecond));
    CHECK_FALSE(isSame(edt_0130, est_0130, Unit::Hour));
    CHECK(startOf(edt_0130, Unit::Hour) == 1730610000000.0); // 01:00 EDT
    CHECK(startOf(est_0130, Unit::Hour) == 1730613600000.0); // 01:00 EST
    CHECK(endOf(edt_0130, Unit::Hour) == 1730613600000.0 - 1);
    CHECK(isSame(edt_0130, edt_0130 + 29 * MS_PER_MINUTE, Unit::Hour));
    CHECK(isSame(edt_0130, est_0130, Unit::Day));
    CHECK(isSame(kMar10_midnightEST, kMar10_midnightEST, Unit::Millisecond));
    CHECK_FALSE(isSame(kMar10_midnightEST, kMar10_midnightEST + 1, Unit::Millisecond));
}

TEST_CASE("startOf / endOf hour floor on the local grid in a half-hour zone (Asia/Kolkata)") {
    ScopedTimezone kolkata("Asia/Kolkata");
    const double ist_1230 = 1718434800000.0; // 2024-06-15T12:30 IST = 07:00Z
    CHECK(startOf(ist_1230, Unit::Hour) == 1718433000000.0);        // 12:00 IST = 06:30Z
    CHECK(endOf(ist_1230, Unit::Hour) == 1718436600000.0 - 1);      // 12:59:59.999 IST
    CHECK(truncateToUnit(ist_1230, Unit::Hour) == startOf(ist_1230, Unit::Hour));
    CHECK(isSame(ist_1230, ist_1230 - 29 * MS_PER_MINUTE, Unit::Hour));
    CHECK_FALSE(isSame(ist_1230, ist_1230 - 31 * MS_PER_MINUTE, Unit::Hour));
    CHECK(startOf(ist_1230 + 45 * MS_PER_SECOND, Unit::Minute) == ist_1230);
    CHECK(endOf(ist_1230, Unit::Minute) == ist_1230 + MS_PER_MINUTE - 1);
    CHECK(startOf(ist_1230, Unit::Day) == 1718389800000.0);         // 2024-06-15T00:00 IST = 06-14T18:30Z
    CHECK(endOf(ist_1230, Unit::Day) == 1718476200000.0 - 1);       // 06-16T00:00 IST - 1
}

TEST_CASE("startOf / endOf sub-day units floor pre-epoch instants (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK(startOf(-1, Unit::Second) == -1000);
    CHECK(endOf(-1, Unit::Second) == -1);
    CHECK(startOf(-1500, Unit::Second) == -2000);
    CHECK(endOf(-1500, Unit::Second) == -1001);
    CHECK(startOf(-1, Unit::Minute) == -MS_PER_MINUTE);
    CHECK(endOf(-1, Unit::Minute) == -1);
    CHECK(startOf(-1, Unit::Hour) == -MS_PER_HOUR);
    CHECK(endOf(-1, Unit::Hour) == -1);
    CHECK(startOf(-MS_PER_HOUR, Unit::Hour) == -MS_PER_HOUR);
    CHECK(endOf(-MS_PER_HOUR, Unit::Hour) == -1);
    CHECK(startOf(-1, Unit::Day) == -MS_PER_DAY);
    CHECK(endOf(-1, Unit::Day) == -1);
    CHECK(isSame(-1, -999, Unit::Second));
    CHECK_FALSE(isSame(-1, 0, Unit::Second));
    CHECK(isSame(-1, -1000, Unit::Second));
    CHECK_FALSE(isSame(-1, -1001, Unit::Second));
}

TEST_CASE("month and year arithmetic clamps to the last valid day (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK(add(kJan31_2024, 1, Unit::Month) == kFeb29_2024);     // leap year
    CHECK(add(kJan31_2023, 1, Unit::Month) == kFeb28_2023);     // non-leap year
    CHECK(add(kMay31_2024, 1, Unit::Month) == kJun30_2024);
    CHECK(add(kFeb29_2024, 1, Unit::Year) == kFeb28_2025);
    CHECK(add(kJan31_2024, -1, Unit::Month) == kDec31_2023);
    CHECK(subtract(kJan31_2024, 1, Unit::Month) == kDec31_2023);
    CHECK(add(kJan31_2024, 2, Unit::Month) == kMar31_2024);     // clamping does not accumulate
    CHECK(add(kFeb29_2024, 12, Unit::Month) == kFeb28_2025);
}

TEST_CASE("add rejects invalid timestamps, non-finite amounts and out-of-range results") {
    const Unit units[] = {Unit::Millisecond, Unit::Second, Unit::Minute, Unit::Hour,
                          Unit::Day, Unit::Week, Unit::Month, Unit::Year};
    for (Unit unit : units) {
        CHECK_THROWS_AS(add(kNaN, 1, unit), std::invalid_argument);
        CHECK_THROWS_AS(add(kInf, 1, unit), std::invalid_argument);
        CHECK_THROWS_AS(add(1e20, 1, unit), std::invalid_argument);
        CHECK_THROWS_AS(add(kJan1_2024, kNaN, unit), std::invalid_argument);
        CHECK_THROWS_AS(add(kJan1_2024, kInf, unit), std::invalid_argument);
        CHECK_THROWS_AS(add(kJan1_2024, -kInf, unit), std::invalid_argument);
        CHECK_THROWS_AS(subtract(kJan1_2024, kNaN, unit), std::invalid_argument);
    }
    CHECK_THROWS_AS(add(kJan1_2024, 1e300, Unit::Millisecond), std::invalid_argument);
    CHECK_THROWS_AS(add(kJan1_2024, 1e13, Unit::Second), std::invalid_argument);
    CHECK_THROWS_AS(add(MAX_TIMESTAMP_MS, 1, Unit::Millisecond), std::invalid_argument);
    CHECK_THROWS_AS(add(-MAX_TIMESTAMP_MS, -1, Unit::Millisecond), std::invalid_argument);
    CHECK(add(MAX_TIMESTAMP_MS - 1, 1, Unit::Millisecond) == MAX_TIMESTAMP_MS);
}

TEST_CASE("month and year amounts must be whole numbers and stay within the date range (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK_THROWS_AS(add(kJan15_2024, 1.5, Unit::Month), std::invalid_argument);
    CHECK_THROWS_AS(add(kJan15_2024, -0.25, Unit::Year), std::invalid_argument);
    CHECK(add(kJan15_2024, 1.0, Unit::Month) == add(kJan15_2024, 1, Unit::Month));
    CHECK(add(kJan15_2024, 1.5, Unit::Hour) == kJan15_2024 + 90 * MS_PER_MINUTE); // duration units keep fractions
    CHECK_THROWS_AS(add(kJan15_2024, 1.5, Unit::Day), std::invalid_argument);    // calendar units do not
    CHECK_THROWS_AS(add(kJan15_2024, 0.5, Unit::Week), std::invalid_argument);
    CHECK_THROWS_AS(add(kJan15_2024, 1e9, Unit::Day), std::invalid_argument);
    CHECK_THROWS_AS(add(kJan15_2024, 1e9, Unit::Week), std::invalid_argument);

    // Amounts that used to overflow `int` month arithmetic now throw instead.
    CHECK_THROWS_AS(add(kJan15_2024, 2147483647.0, Unit::Month), std::invalid_argument);
    CHECK_THROWS_AS(add(kJan15_2024, -2147483648.0, Unit::Month), std::invalid_argument);
    CHECK_THROWS_AS(add(kJan15_2024, 1e15, Unit::Year), std::invalid_argument);
    CHECK_THROWS_AS(add(kJan15_2024, 300000, Unit::Year), std::invalid_argument);
    CHECK_THROWS_AS(add(kJan15_2024, -300000, Unit::Year), std::invalid_argument);
    // Large but representable amounts work with 64-bit month math.
    CHECK(add(kJan15_2024, 12000, Unit::Month) == add(kJan15_2024, 1000, Unit::Year));
    // Local conversions are bounded by libc (Darwin's mktime rejects years before 1900).
    CHECK(add(kJan15_2024, -1200, Unit::Month) == add(kJan15_2024, -100, Unit::Year));
    CHECK(timestampToComponents(add(kJan15_2024, 1000, Unit::Year), true).year == 3024);
    CHECK(timestampToComponents(add(kJan15_2024, -100, Unit::Year), true).year == 1924);
}

TEST_CASE("clamp, min and max") {
    CHECK(clamp(5, 1, 10) == 5);
    CHECK(clamp(-5, 1, 10) == 1);
    CHECK(clamp(50, 1, 10) == 10);
    CHECK(min({3, 1, 2}) == 1);
    CHECK(max({3, 1, 2}) == 3);
    CHECK(min({-1}) == -1);
    CHECK(std::isnan(min({})));
    CHECK(std::isnan(max({})));
}

TEST_CASE("clamp, min and max propagate NaN regardless of position") {
    CHECK(std::isnan(clamp(kNaN, 1, 10)));
    CHECK(std::isnan(clamp(5, kNaN, 10)));
    CHECK(std::isnan(clamp(5, 1, kNaN)));
    CHECK(clamp(5, -kInf, kInf) == 5);

    CHECK(std::isnan(min({kNaN})));
    CHECK(std::isnan(min({kNaN, 1, 2})));
    CHECK(std::isnan(min({1, kNaN, 2})));
    CHECK(std::isnan(min({1, 2, kNaN})));
    CHECK(std::isnan(max({kNaN, 1, 2})));
    CHECK(std::isnan(max({1, kNaN, 2})));
    CHECK(std::isnan(max({1, 2, kNaN})));
    CHECK(min({2, -kInf}) == -kInf);
    CHECK(max({2, kInf}) == kInf);
}

TEST_CASE("predicates return false for invalid timestamps instead of throwing") {
    CHECK_FALSE(isSame(kNaN, kJan1_2024, Unit::Day));
    CHECK_FALSE(isSame(kJan1_2024, kInf, Unit::Day));
    CHECK_FALSE(isSame(1e20, 1e20, Unit::Year));
    CHECK_FALSE(isBefore(kNaN, 1));
    CHECK_FALSE(isAfter(kNaN, 1));
}

TEST_CASE("startOf, endOf and diff reject invalid timestamps") {
    CHECK_THROWS_AS(startOf(kNaN, Unit::Day), std::invalid_argument);
    CHECK_THROWS_AS(startOf(kInf, Unit::Second), std::invalid_argument);
    CHECK_THROWS_AS(endOf(1e20, Unit::Day), std::invalid_argument);
    CHECK_THROWS_AS(endOf(kNaN, Unit::Hour), std::invalid_argument);
    CHECK_THROWS_AS(diff(kNaN, 0, Unit::Day), std::invalid_argument);
    CHECK_THROWS_AS(diff(0, kInf, Unit::Month), std::invalid_argument);
    CHECK_THROWS_AS(truncateToUnit(kNaN, Unit::Day), std::invalid_argument);
}

TEST_CASE("getMillisForUnit") {
    CHECK(getMillisForUnit(Unit::Millisecond) == 1);
    CHECK(getMillisForUnit(Unit::Second) == MS_PER_SECOND);
    CHECK(getMillisForUnit(Unit::Minute) == MS_PER_MINUTE);
    CHECK(getMillisForUnit(Unit::Hour) == MS_PER_HOUR);
    CHECK(getMillisForUnit(Unit::Day) == MS_PER_DAY);
    CHECK(getMillisForUnit(Unit::Week) == MS_PER_WEEK);
    CHECK(getMillisForUnit(Unit::Month) == 30 * MS_PER_DAY);
    CHECK(getMillisForUnit(Unit::Year) == 365 * MS_PER_DAY);
}

} // TEST_SUITE
