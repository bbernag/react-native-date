#include "doctest.h"

#include "ZoneMath.hpp"
#include "fakes/FakeLocaleProvider.hpp"
#include "fakes/FakeTimezoneProvider.hpp"

using namespace nativedate::core;
using nativedate::test::FakeLocaleProvider;
using nativedate::test::FakeTimezoneProvider;

namespace {
constexpr double kJan1_2024 = 1704067200000.0;   // 2024-01-01T00:00:00Z
constexpr double kJul4_16Z = 1720108800000.0;    // 2024-07-04T16:00:00Z
constexpr double kJan1_02Z = 1704074400000.0;    // 2024-01-01T02:00:00Z (Dec 31 in New York)
constexpr double kJan1_03Z = 1704078000000.0;    // 2024-01-01T03:00:00Z (Dec 31 in New York)
constexpr double kJan1_04Z = 1704081600000.0;    // 2024-01-01T04:00:00Z (Dec 31 in New York)
constexpr double kJan1_05Z = 1704085200000.0;    // 2024-01-01T05:00:00Z (Jan 1 in New York)
constexpr double kJan1_10Z = 1704103200000.0;    // 2024-01-01T10:00:00Z (Jan 1 in New York)
constexpr double kMinute = 60000.0;

const FakeTimezoneProvider zones;
const FakeLocaleProvider english;
} // namespace

TEST_SUITE("ZoneMath") {

TEST_CASE("getOffsetInTimezone returns minutes east of UTC") {
    CHECK(getOffsetInTimezone(kJan1_2024, "UTC", zones) == 0);
    CHECK(getOffsetInTimezone(kJan1_2024, "Asia/Kolkata", zones) == 330);
    CHECK(getOffsetInTimezone(kJan1_2024, "Pacific/Honolulu", zones) == -600);
    CHECK(getOffsetInTimezone(kJan1_2024, "America/New_York", zones) == -300); // EST
    CHECK(getOffsetInTimezone(kJul4_16Z, "America/New_York", zones) == -240);  // EDT
}

TEST_CASE("getTimezoneOffsetForTimestamp uses the system zone") {
    FakeTimezoneProvider system;
    system.setSystemZone("America/New_York");
    CHECK(getTimezoneOffsetForTimestamp(kJan1_2024, system) == -300);
    CHECK(getTimezoneOffsetForTimestamp(kJul4_16Z, system) == -240);
    system.setSystemZone("UTC");
    CHECK(getTimezoneOffsetForTimestamp(kJul4_16Z, system) == 0);
}

TEST_CASE("toTimezone shifts the epoch by the zone offset") {
    CHECK(toTimezone(kJan1_2024, "UTC", zones) == kJan1_2024);
    CHECK(toTimezone(kJan1_2024, "Asia/Kolkata", zones) == kJan1_2024 + 330 * kMinute);
    CHECK(toTimezone(kJan1_2024, "America/New_York", zones) == kJan1_2024 - 300 * kMinute);
    CHECK(toTimezone(kJul4_16Z, "America/New_York", zones) == kJul4_16Z - 240 * kMinute);
}

TEST_CASE("formatInTimezone renders the zone's wall clock") {
    CHECK(formatInTimezone(kJan1_2024, "yyyy-MM-dd HH:mm", "UTC", zones, english) == "2024-01-01 00:00");
    CHECK(formatInTimezone(kJan1_2024, "yyyy-MM-dd HH:mm", "Asia/Kolkata", zones, english) == "2024-01-01 05:30");
    CHECK(formatInTimezone(kJan1_2024, "yyyy-MM-dd HH:mm", "Asia/Tokyo", zones, english) == "2024-01-01 09:00");
    CHECK(formatInTimezone(kJan1_2024, "yyyy-MM-dd HH:mm EEE", "America/New_York", zones, english) == "2023-12-31 19:00 Sun");
}

TEST_CASE("formatInTimezone follows DST transitions (New York, 2024-03-10)") {
    CHECK(formatInTimezone(1710053999000.0, "HH:mm", "America/New_York", zones, english) == "01:59");
    CHECK(formatInTimezone(1710054000000.0, "HH:mm", "America/New_York", zones, english) == "03:00");
    CHECK(formatInTimezone(1711846799000.0, "HH:mm", "Europe/Berlin", zones, english) == "01:59");
    CHECK(formatInTimezone(1711846800000.0, "HH:mm", "Europe/Berlin", zones, english) == "03:00");
}

TEST_CASE("isSameDayInTz / isSameMonthInTz / isSameYearInTz compare zoned calendar fields") {
    CHECK(isSameDayInTz(kJan1_02Z, kJan1_04Z, "America/New_York", zones, english));
    CHECK_FALSE(isSameDayInTz(kJan1_04Z, kJan1_05Z, "America/New_York", zones, english));
    CHECK(isSameDayInTz(kJan1_04Z, kJan1_05Z, "UTC", zones, english));

    CHECK_FALSE(isSameMonthInTz(kJan1_04Z, kJan1_05Z, "America/New_York", zones, english));
    CHECK(isSameMonthInTz(kJan1_04Z, kJan1_05Z, "Asia/Kolkata", zones, english));

    CHECK_FALSE(isSameYearInTz(kJan1_04Z, kJan1_05Z, "America/New_York", zones, english));
    CHECK(isSameYearInTz(kJan1_04Z, kJan1_05Z, "UTC", zones, english));
}

TEST_CASE("isTodayInTz / isTomorrowInTz / isYesterdayInTz use the injected clock") {
    // now = 2024-01-01T03:00Z is still Dec 31 in New York but Jan 1 in UTC.
    CHECK(isTodayInTz(kJan1_04Z, "America/New_York", kJan1_03Z, zones, english));
    CHECK_FALSE(isTodayInTz(kJan1_10Z, "America/New_York", kJan1_03Z, zones, english));
    CHECK(isTodayInTz(kJan1_10Z, "UTC", kJan1_03Z, zones, english));

    CHECK(isTomorrowInTz(kJan1_10Z, "America/New_York", kJan1_03Z, zones, english));
    CHECK_FALSE(isTomorrowInTz(kJan1_04Z, "America/New_York", kJan1_03Z, zones, english));

    CHECK(isYesterdayInTz(kJan1_03Z, "America/New_York", kJan1_10Z, zones, english));
    CHECK_FALSE(isYesterdayInTz(kJan1_05Z, "America/New_York", kJan1_10Z, zones, english));
}

TEST_CASE("startOfDayInTz / endOfDayInTz return zoned midnight as a UTC instant") {
    CHECK(startOfDayInTz(kJan1_2024, "UTC", zones, english) == kJan1_2024);
    CHECK(startOfDayInTz(kJul4_16Z, "America/New_York", zones, english) == 1720065600000.0); // 04:00Z
    CHECK(endOfDayInTz(kJul4_16Z, "America/New_York", zones, english) == 1720151999999.0);   // 03:59:59.999Z next day
    CHECK(startOfDayInTz(kJan1_2024, "Asia/Kolkata", zones, english) == 1704047400000.0);    // 2023-12-31T18:30Z
    CHECK(endOfDayInTz(kJan1_2024, "UTC", zones, english) == kJan1_2024 + 86400000.0 - 1);
}

TEST_CASE("fake provider reports zone validity and the zone list") {
    CHECK(zones.isValidZone("Asia/Kolkata"));
    CHECK_FALSE(zones.isValidZone("Mars/Olympus_Mons"));
    CHECK_FALSE(zones.offsetMinutes("Mars/Olympus_Mons", 0).has_value());
    CHECK(zones.availableZones().size() == 6);
}

} // TEST_SUITE
