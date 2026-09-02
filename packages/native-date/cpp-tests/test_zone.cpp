#include "doctest.h"

#include "Civil.hpp"
#include "ZoneMath.hpp"
#include "ZoneNames.hpp"
#include "fakes/FakeLocaleProvider.hpp"
#include "fakes/FakeTimezoneProvider.hpp"

#include <functional>
#include <limits>
#include <stdexcept>
#include <string>

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
constexpr double kHour = 3600000.0;
constexpr double kDay = 86400000.0;

// New York, spring forward: 2024-03-10 02:00 EST -> 03:00 EDT (07:00Z). A 23-hour day.
constexpr double kNyMar10Midnight = 1710046800000.0;   // 2024-03-10T05:00:00Z = 00:00 EST
constexpr double kNyMar10_0030 = kNyMar10Midnight + 30 * kMinute;
constexpr double kNyMar11Midnight = 1710129600000.0;   // 2024-03-11T04:00:00Z = 00:00 EDT
constexpr double kNyMar11_0030 = kNyMar11Midnight + 30 * kMinute;
constexpr double kNyMar9Noon = 1710003600000.0;        // 2024-03-09T17:00:00Z = 12:00 EST

// New York, fall back: 2024-11-03 02:00 EDT -> 01:00 EST (06:00Z). A 25-hour day.
constexpr double kNyNov3Midnight = 1730606400000.0;    // 2024-11-03T04:00:00Z = 00:00 EDT
constexpr double kNyNov3_0030 = kNyNov3Midnight + 30 * kMinute;
constexpr double kNyNov3_2330 = 1730694600000.0;       // 2024-11-04T04:30:00Z = 23:30 EST (still Nov 3)
constexpr double kNyNov4Midnight = 1730696400000.0;    // 2024-11-04T05:00:00Z = 00:00 EST
constexpr double kNyNov4_0030 = kNyNov4Midnight + 30 * kMinute;
constexpr double kNyNov2Noon = 1730563200000.0;        // 2024-11-02T16:00:00Z = 12:00 EDT

// Synthetic zones with a transition exactly at local midnight on 2024-06-02.
constexpr double kJun2_00Z = 1717286400000.0;          // 2024-06-02T00:00:00Z
constexpr double kJun1_12Z = kJun2_00Z - 12 * kHour;
constexpr double kJun2_12Z = kJun2_00Z + 12 * kHour;

const FakeTimezoneProvider zones;
const FakeLocaleProvider english;

std::string messageOf(const std::function<void()>& call) {
    try {
        call();
    } catch (const std::invalid_argument& e) {
        return e.what();
    }
    return "";
}
} // namespace

TEST_SUITE("ZoneNames") {

TEST_CASE("normalize maps abbreviations case-insensitively and keeps IANA ids") {
    CHECK(ZoneNames::normalize("PST") == "America/Los_Angeles");
    CHECK(ZoneNames::normalize("pst") == "America/Los_Angeles");
    CHECK(ZoneNames::normalize("Est") == "America/New_York");
    CHECK(ZoneNames::normalize("AKDT") == "America/Anchorage");
    CHECK(ZoneNames::normalize("America/New_York") == "America/New_York");
    CHECK(ZoneNames::normalize("Not/AZone") == "Not/AZone");
    CHECK(ZoneNames::normalize("") == "");
}

TEST_CASE("GMT and WET are the fixed-offset Etc/GMT, not London") {
    CHECK(ZoneNames::normalize("GMT") == "Etc/GMT");
    CHECK(ZoneNames::normalize("gmt") == "Etc/GMT");
    CHECK(ZoneNames::normalize("WET") == "Etc/GMT");
    CHECK(ZoneNames::normalize("BST") == "Europe/London");
}

TEST_CASE("UTC aliases collapse to UTC") {
    CHECK(ZoneNames::normalize("UTC") == "UTC");
    CHECK(ZoneNames::normalize("utc") == "UTC");
    CHECK(ZoneNames::normalize("Etc/UTC") == "UTC");
    CHECK(ZoneNames::normalize("etc/utc") == "UTC");
    CHECK(ZoneNames::normalize("Z") == "UTC");
    CHECK(ZoneNames::normalize("z") == "UTC");
}

TEST_CASE("isWellFormed accepts the IANA character set and bounds the length") {
    CHECK(ZoneNames::isWellFormed("America/Argentina/ComodRivadavia"));
    CHECK(ZoneNames::isWellFormed("Etc/GMT+5"));
    CHECK(ZoneNames::isWellFormed("America/Port-au-Prince"));
    CHECK_FALSE(ZoneNames::isWellFormed(""));
    CHECK_FALSE(ZoneNames::isWellFormed("America/New York"));
    CHECK_FALSE(ZoneNames::isWellFormed("Europe/Zürich"));
    CHECK_FALSE(ZoneNames::isWellFormed(std::string(ZoneNames::kMaxNameLength + 1, 'a')));
    CHECK(ZoneNames::isWellFormed(std::string(ZoneNames::kMaxNameLength, 'a')));
}

} // TEST_SUITE

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

TEST_CASE("every zone API accepts UTC aliases as offset 0") {
    for (const char* alias : {"UTC", "utc", "Etc/UTC", "Z"}) {
        CAPTURE(alias);
        CHECK(getOffsetInTimezone(kJul4_16Z, alias, zones) == 0);
        CHECK(toTimezone(kJul4_16Z, alias, zones) == kJul4_16Z);
        CHECK(formatInTimezone(kJul4_16Z, "HH:mm", alias, zones, english) == "16:00");
        CHECK(startOfDayInTz(kJul4_16Z, alias, zones) == kJul4_16Z - 16 * kHour);
        CHECK(endOfDayInTz(kJul4_16Z, alias, zones) == kJul4_16Z + 8 * kHour - 1);
        CHECK(isTodayInTz(kJul4_16Z, alias, kJul4_16Z + kHour, zones));
        CHECK(isSameDayInTz(kJul4_16Z, kJul4_16Z + kHour, alias, zones));
    }
}

TEST_CASE("abbreviations resolve through the shared table (D-07, D-14)") {
    CHECK(getOffsetInTimezone(kJan1_2024, "PST", zones) == -480);
    CHECK(getOffsetInTimezone(kJan1_2024, "pst", zones) == -480);
    CHECK(getOffsetInTimezone(kJul4_16Z, "PST", zones) == -420); // PDT in July
    CHECK(getOffsetInTimezone(kJan1_2024, "EST", zones) == -300);
    CHECK(getOffsetInTimezone(kJan1_2024, "IST", zones) == 330);
    // GMT is fixed at 0 year-round, on every platform.
    CHECK(getOffsetInTimezone(kJan1_2024, "GMT", zones) == 0);
    CHECK(getOffsetInTimezone(kJul4_16Z, "GMT", zones) == 0);
    CHECK(getOffsetInTimezone(kJul4_16Z, "gmt", zones) == 0);
    CHECK(formatInTimezone(kJul4_16Z, "HH:mm", "GMT", zones, english) == "16:00");
}

TEST_CASE("unknown zone names throw std::invalid_argument (Q4, D-06)") {
    const std::string huge(10000, 'a');
    for (const std::string& bad : {std::string("Not/AZone"), std::string("America/NewYork"), std::string(""),
                                   std::string("America/New York"), std::string("XYZ"), huge}) {
        CAPTURE(bad.substr(0, 40));
        CHECK_THROWS_AS(getOffsetInTimezone(kJan1_2024, bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(toTimezone(kJan1_2024, bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(formatInTimezone(kJan1_2024, "yyyy", bad, zones, english), std::invalid_argument);
        CHECK_THROWS_AS(isTodayInTz(kJan1_2024, bad, kJan1_2024, zones), std::invalid_argument);
        CHECK_THROWS_AS(isTomorrowInTz(kJan1_2024, bad, kJan1_2024, zones), std::invalid_argument);
        CHECK_THROWS_AS(isYesterdayInTz(kJan1_2024, bad, kJan1_2024, zones), std::invalid_argument);
        CHECK_THROWS_AS(isSameDayInTz(kJan1_2024, kJan1_2024, bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(isSameMonthInTz(kJan1_2024, kJan1_2024, bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(isSameYearInTz(kJan1_2024, kJan1_2024, bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(startOfDayInTz(kJan1_2024, bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(endOfDayInTz(kJan1_2024, bad, zones), std::invalid_argument);
    }
}

TEST_CASE("non-finite and out-of-range timestamps throw (B-01)") {
    const double nan = std::numeric_limits<double>::quiet_NaN();
    const double inf = std::numeric_limits<double>::infinity();
    for (double bad : {nan, inf, -inf, MAX_TIMESTAMP_MS + 1, -MAX_TIMESTAMP_MS - 1, 1e20}) {
        CAPTURE(bad);
        CHECK_THROWS_AS(getTimezoneOffsetForTimestamp(bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(getOffsetInTimezone(bad, "UTC", zones), std::invalid_argument);
        CHECK_THROWS_AS(toTimezone(bad, "UTC", zones), std::invalid_argument);
        CHECK_THROWS_AS(formatInTimezone(bad, "yyyy", "UTC", zones, english), std::invalid_argument);
        CHECK_THROWS_AS(isTodayInTz(bad, "UTC", kJan1_2024, zones), std::invalid_argument);
        CHECK_THROWS_AS(isTodayInTz(kJan1_2024, "UTC", bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(isTomorrowInTz(bad, "UTC", kJan1_2024, zones), std::invalid_argument);
        CHECK_THROWS_AS(isTomorrowInTz(kJan1_2024, "UTC", bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(isYesterdayInTz(bad, "UTC", kJan1_2024, zones), std::invalid_argument);
        CHECK_THROWS_AS(isYesterdayInTz(kJan1_2024, "UTC", bad, zones), std::invalid_argument);
        CHECK_THROWS_AS(isSameDayInTz(bad, kJan1_2024, "UTC", zones), std::invalid_argument);
        CHECK_THROWS_AS(isSameDayInTz(kJan1_2024, bad, "UTC", zones), std::invalid_argument);
        CHECK_THROWS_AS(isSameMonthInTz(bad, kJan1_2024, "UTC", zones), std::invalid_argument);
        CHECK_THROWS_AS(isSameYearInTz(bad, kJan1_2024, "UTC", zones), std::invalid_argument);
        CHECK_THROWS_AS(startOfDayInTz(bad, "UTC", zones), std::invalid_argument);
        CHECK_THROWS_AS(endOfDayInTz(bad, "UTC", zones), std::invalid_argument);
    }
}

TEST_CASE("the error message names the input and is bounded") {
    CHECK(messageOf([] { getOffsetInTimezone(kJan1_2024, "Not/AZone", zones); }) == "Invalid timezone: 'Not/AZone'");
    CHECK(messageOf([] { getOffsetInTimezone(kJan1_2024, "", zones); }) == "Invalid timezone: ''");
    const std::string huge(10000, 'a');
    std::string message = messageOf([&] { formatInTimezone(kJan1_2024, "yyyy", huge, zones, english); });
    CHECK(message.size() < 100);
    CHECK(message.find("...") != std::string::npos);
}

TEST_CASE("toTimezone shifts the epoch by the zone offset (Q5)") {
    CHECK(toTimezone(kJan1_2024, "UTC", zones) == kJan1_2024);
    CHECK(toTimezone(kJan1_2024, "Asia/Kolkata", zones) == kJan1_2024 + 330 * kMinute);
    CHECK(toTimezone(kJan1_2024, "America/New_York", zones) == kJan1_2024 - 300 * kMinute);
    CHECK(toTimezone(kJul4_16Z, "America/New_York", zones) == kJul4_16Z - 240 * kMinute);
    CHECK(toTimezone(kJan1_2024, "Pacific/Kiritimati", zones) == kJan1_2024 + 14 * kHour);
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
    CHECK(isSameDayInTz(kJan1_02Z, kJan1_04Z, "America/New_York", zones));
    CHECK_FALSE(isSameDayInTz(kJan1_04Z, kJan1_05Z, "America/New_York", zones));
    CHECK(isSameDayInTz(kJan1_04Z, kJan1_05Z, "UTC", zones));

    CHECK_FALSE(isSameMonthInTz(kJan1_04Z, kJan1_05Z, "America/New_York", zones));
    CHECK(isSameMonthInTz(kJan1_04Z, kJan1_05Z, "Asia/Kolkata", zones));

    CHECK_FALSE(isSameYearInTz(kJan1_04Z, kJan1_05Z, "America/New_York", zones));
    CHECK(isSameYearInTz(kJan1_04Z, kJan1_05Z, "UTC", zones));
}

TEST_CASE("same-day compare is an integer day-number compare, across the date line") {
    // 2024-01-01T00:00Z is 14:00 on Jan 1 in Kiritimati; 2023-12-31T10:00Z is 00:00 on Jan 1 there.
    CHECK(isSameDayInTz(kJan1_2024, kJan1_2024 - 14 * kHour, "Pacific/Kiritimati", zones));
    CHECK_FALSE(isSameDayInTz(kJan1_2024, kJan1_2024 - 14 * kHour - 1, "Pacific/Kiritimati", zones));
    // Exactly at local midnight on both sides of the boundary.
    CHECK_FALSE(isSameDayInTz(kNyMar10Midnight - 1, kNyMar10Midnight, "America/New_York", zones));
    CHECK(isSameDayInTz(kNyMar10Midnight, kNyMar11Midnight - 1, "America/New_York", zones));
    CHECK(isSameDayInTz(kNyNov3Midnight, kNyNov4Midnight - 1, "America/New_York", zones));
    CHECK_FALSE(isSameDayInTz(kNyNov3Midnight, kNyNov4Midnight, "America/New_York", zones));
}

TEST_CASE("isTodayInTz / isTomorrowInTz / isYesterdayInTz use the injected clock") {
    // now = 2024-01-01T03:00Z is still Dec 31 in New York but Jan 1 in UTC.
    CHECK(isTodayInTz(kJan1_04Z, "America/New_York", kJan1_03Z, zones));
    CHECK_FALSE(isTodayInTz(kJan1_10Z, "America/New_York", kJan1_03Z, zones));
    CHECK(isTodayInTz(kJan1_10Z, "UTC", kJan1_03Z, zones));

    CHECK(isTomorrowInTz(kJan1_10Z, "America/New_York", kJan1_03Z, zones));
    CHECK_FALSE(isTomorrowInTz(kJan1_04Z, "America/New_York", kJan1_03Z, zones));

    CHECK(isYesterdayInTz(kJan1_03Z, "America/New_York", kJan1_10Z, zones));
    CHECK_FALSE(isYesterdayInTz(kJan1_05Z, "America/New_York", kJan1_10Z, zones));
}

TEST_CASE("tomorrow/yesterday step the civil date, not 24 hours (D-05)") {
    SUBCASE("now = 00:30 on the 23-hour day (2024-03-10)") {
        CHECK(isTodayInTz(kNyMar10Midnight, "America/New_York", kNyMar10_0030, zones));
        CHECK(isTomorrowInTz(kNyMar11Midnight, "America/New_York", kNyMar10_0030, zones));
        CHECK(isTomorrowInTz(kNyMar11_0030, "America/New_York", kNyMar10_0030, zones));
        CHECK_FALSE(isTomorrowInTz(kNyMar11Midnight - 1, "America/New_York", kNyMar10_0030, zones));
        CHECK(isYesterdayInTz(kNyMar9Noon, "America/New_York", kNyMar10_0030, zones));
        CHECK(isYesterdayInTz(kNyMar10Midnight - 1, "America/New_York", kNyMar10_0030, zones));
        CHECK_FALSE(isYesterdayInTz(kNyMar10Midnight, "America/New_York", kNyMar10_0030, zones));
    }
    SUBCASE("now = 00:30 on the day after the 23-hour day (2024-03-11)") {
        // now - 24h would be 23:30 on Mar 9; yesterday must still be Mar 10.
        CHECK(isYesterdayInTz(kNyMar10Midnight, "America/New_York", kNyMar11_0030, zones));
        CHECK(isYesterdayInTz(kNyMar11Midnight - 1, "America/New_York", kNyMar11_0030, zones));
        CHECK_FALSE(isYesterdayInTz(kNyMar9Noon, "America/New_York", kNyMar11_0030, zones));
    }
    SUBCASE("now = 00:30 on the 25-hour day (2024-11-03)") {
        // now + 24h is 23:30 on Nov 3; tomorrow must still be Nov 4.
        CHECK(isTodayInTz(kNyNov3_2330, "America/New_York", kNyNov3_0030, zones));
        CHECK(isTomorrowInTz(kNyNov4Midnight, "America/New_York", kNyNov3_0030, zones));
        CHECK(isTomorrowInTz(kNyNov4_0030, "America/New_York", kNyNov3_0030, zones));
        CHECK_FALSE(isTomorrowInTz(kNyNov3_2330, "America/New_York", kNyNov3_0030, zones));
        CHECK(isYesterdayInTz(kNyNov2Noon, "America/New_York", kNyNov3_0030, zones));
        CHECK_FALSE(isYesterdayInTz(kNyNov3Midnight, "America/New_York", kNyNov3_0030, zones));
    }
    SUBCASE("now = 00:30 on the day after the 25-hour day (2024-11-04)") {
        CHECK(isYesterdayInTz(kNyNov3Midnight, "America/New_York", kNyNov4_0030, zones));
        CHECK(isYesterdayInTz(kNyNov3_2330, "America/New_York", kNyNov4_0030, zones));
        CHECK_FALSE(isYesterdayInTz(kNyNov4Midnight, "America/New_York", kNyNov4_0030, zones));
    }
}

TEST_CASE("startOfDayInTz / endOfDayInTz return zoned midnight as a UTC instant") {
    CHECK(startOfDayInTz(kJan1_2024, "UTC", zones) == kJan1_2024);
    CHECK(startOfDayInTz(kJul4_16Z, "America/New_York", zones) == 1720065600000.0); // 04:00Z
    CHECK(endOfDayInTz(kJul4_16Z, "America/New_York", zones) == 1720151999999.0);   // 03:59:59.999Z next day
    CHECK(startOfDayInTz(kJan1_2024, "Asia/Kolkata", zones) == 1704047400000.0);    // 2023-12-31T18:30Z
    CHECK(endOfDayInTz(kJan1_2024, "UTC", zones) == kJan1_2024 + kDay - 1);
    // +14: 2024-01-01T00:00Z is 14:00 on Jan 1 in Kiritimati, whose midnight was 2023-12-31T10:00Z.
    CHECK(startOfDayInTz(kJan1_2024, "Pacific/Kiritimati", zones) == kJan1_2024 - 14 * kHour);
    CHECK(endOfDayInTz(kJan1_2024, "Pacific/Kiritimati", zones) == kJan1_2024 + 10 * kHour - 1);
}

TEST_CASE("zoned midnight on DST days (New York 2024-03-10 and 2024-11-03) (D-05, D-10)") {
    SUBCASE("the 23-hour day") {
        for (double instant : {kNyMar10Midnight, kNyMar10_0030, kNyMar10Midnight + 12 * kHour, kNyMar11Midnight - 1}) {
            CAPTURE(instant);
            CHECK(startOfDayInTz(instant, "America/New_York", zones) == kNyMar10Midnight);
            CHECK(endOfDayInTz(instant, "America/New_York", zones) == kNyMar11Midnight - 1);
        }
        CHECK(endOfDayInTz(kNyMar10_0030, "America/New_York", zones) - startOfDayInTz(kNyMar10_0030, "America/New_York", zones) == 23 * kHour - 1);
        CHECK(startOfDayInTz(kNyMar11Midnight, "America/New_York", zones) == kNyMar11Midnight);
    }
    SUBCASE("the 25-hour day") {
        for (double instant : {kNyNov3Midnight, kNyNov3_0030, kNyNov3Midnight + 12 * kHour, kNyNov3_2330, kNyNov4Midnight - 1}) {
            CAPTURE(instant);
            CHECK(startOfDayInTz(instant, "America/New_York", zones) == kNyNov3Midnight);
            CHECK(endOfDayInTz(instant, "America/New_York", zones) == kNyNov4Midnight - 1);
        }
        CHECK(endOfDayInTz(kNyNov3_0030, "America/New_York", zones) - startOfDayInTz(kNyNov3_0030, "America/New_York", zones) == 25 * kHour - 1);
        CHECK(startOfDayInTz(kNyNov4Midnight, "America/New_York", zones) == kNyNov4Midnight);
        CHECK(endOfDayInTz(kNyNov2Noon, "America/New_York", zones) == kNyNov3Midnight - 1);
    }
}

TEST_CASE("zoned midnight when the transition lands on midnight (D-10)") {
    SUBCASE("gap: midnight is skipped, the day starts at the first instant after it") {
        // Clocks go 23:59:59.999 -> 01:00:00.000 at 2024-06-02T00:00Z.
        CHECK(startOfDayInTz(kJun2_12Z, "Test/MidnightGap", zones) == kJun2_00Z);
        CHECK(startOfDayInTz(kJun2_00Z, "Test/MidnightGap", zones) == kJun2_00Z);
        CHECK(endOfDayInTz(kJun1_12Z, "Test/MidnightGap", zones) == kJun2_00Z - 1);
        CHECK(formatInTimezone(kJun2_00Z, "yyyy-MM-dd HH:mm", "Test/MidnightGap", zones, english) == "2024-06-02 01:00");
        CHECK(formatInTimezone(kJun2_00Z - 1, "yyyy-MM-dd HH:mm", "Test/MidnightGap", zones, english) == "2024-06-01 23:59");
        // Unaffected days keep the plain offset.
        CHECK(startOfDayInTz(kJun1_12Z, "Test/MidnightGap", zones) == kJun2_00Z - kDay);
        CHECK(startOfDayInTz(kJun2_12Z + kDay, "Test/MidnightGap", zones) == kJun2_00Z + kDay - kHour);
    }
    SUBCASE("overlap: midnight happens twice, the earlier instant wins") {
        // Clocks go 00:59:59.999 -> 00:00:00.000 at 2024-06-02T00:00Z, so
        // 00:00 on Jun 2 occurs at 2024-06-01T23:00Z (+01:00) and again at 2024-06-02T00:00Z (+00:00).
        CHECK(startOfDayInTz(kJun2_12Z, "Test/MidnightOverlap", zones) == kJun2_00Z - kHour);
        CHECK(startOfDayInTz(kJun2_00Z, "Test/MidnightOverlap", zones) == kJun2_00Z - kHour);
        CHECK(startOfDayInTz(kJun2_00Z - kHour, "Test/MidnightOverlap", zones) == kJun2_00Z - kHour);
        CHECK(endOfDayInTz(kJun1_12Z, "Test/MidnightOverlap", zones) == kJun2_00Z - kHour - 1);
        CHECK(formatInTimezone(kJun2_00Z - kHour, "yyyy-MM-dd HH:mm", "Test/MidnightOverlap", zones, english) == "2024-06-02 00:00");
        CHECK(formatInTimezone(kJun2_00Z, "yyyy-MM-dd HH:mm", "Test/MidnightOverlap", zones, english) == "2024-06-02 00:00");
        CHECK(startOfDayInTz(kJun1_12Z, "Test/MidnightOverlap", zones) == kJun2_00Z - kDay - kHour);
        CHECK(startOfDayInTz(kJun2_12Z + kDay, "Test/MidnightOverlap", zones) == kJun2_00Z + kDay);
    }
}

TEST_CASE("fake provider reports zone validity and the zone list") {
    CHECK(zones.isValidZone("Asia/Kolkata"));
    CHECK_FALSE(zones.isValidZone("Mars/Olympus_Mons"));
    CHECK_FALSE(zones.offsetMinutes("Mars/Olympus_Mons", 0).has_value());
    CHECK(zones.availableZones().size() == 11);
}

TEST_CASE("isToday / isTomorrow / isYesterday use the system zone and injected clock") {
    FakeTimezoneProvider system;
    system.setSystemZone("America/New_York");
    // now = 2024-01-01T03:00Z is still Dec 31 in New York but Jan 1 in UTC.
    CHECK(isToday(kJan1_04Z, kJan1_03Z, system));
    CHECK_FALSE(isToday(kJan1_10Z, kJan1_03Z, system));
    CHECK(isTomorrow(kJan1_10Z, kJan1_03Z, system));
    CHECK_FALSE(isTomorrow(kJan1_04Z, kJan1_03Z, system));
    CHECK(isYesterday(kJan1_03Z, kJan1_10Z, system));
    CHECK_FALSE(isYesterday(kJan1_05Z, kJan1_10Z, system));

    system.setSystemZone("UTC");
    CHECK(isToday(kJan1_10Z, kJan1_03Z, system));
    CHECK_FALSE(isTomorrow(kJan1_10Z, kJan1_03Z, system));
    CHECK_FALSE(isYesterday(kJan1_03Z, kJan1_10Z, system));
}

TEST_CASE("isToday family midnight edges in the system zone") {
    FakeTimezoneProvider system;
    system.setSystemZone("America/New_York");
    // Instant at local midnight is today; 1 ms before is yesterday.
    CHECK(isToday(kNyMar10Midnight, kNyMar10_0030, system));
    CHECK_FALSE(isToday(kNyMar10Midnight - 1, kNyMar10_0030, system));
    CHECK(isYesterday(kNyMar10Midnight - 1, kNyMar10_0030, system));
    CHECK(isTomorrow(kNyMar11Midnight, kNyMar10_0030, system));
    CHECK_FALSE(isTomorrow(kNyMar11Midnight - 1, kNyMar10_0030, system));
    // now exactly at local midnight.
    CHECK(isToday(kNyMar10Midnight, kNyMar10Midnight, system));
    CHECK(isYesterday(kNyMar10Midnight - 1, kNyMar10Midnight, system));
    CHECK(isTomorrow(kNyMar11Midnight, kNyMar10Midnight, system));
    // now 1 ms before the next local midnight.
    CHECK(isToday(kNyMar11Midnight - 1, kNyMar11Midnight - 1, system));
    CHECK(isTomorrow(kNyMar11Midnight, kNyMar11Midnight - 1, system));
    CHECK_FALSE(isToday(kNyMar11Midnight, kNyMar11Midnight - 1, system));
}

TEST_CASE("isToday family on DST days uses civil dates, not 24h (E-02)") {
    FakeTimezoneProvider system;
    system.setSystemZone("America/New_York");
    SUBCASE("now = 00:30 on the 23-hour day (2024-03-10)") {
        CHECK(isToday(kNyMar10Midnight, kNyMar10_0030, system));
        CHECK(isTomorrow(kNyMar11Midnight, kNyMar10_0030, system));
        CHECK(isTomorrow(kNyMar11_0030, kNyMar10_0030, system));
        CHECK_FALSE(isTomorrow(kNyMar11Midnight - 1, kNyMar10_0030, system));
        CHECK(isYesterday(kNyMar9Noon, kNyMar10_0030, system));
        CHECK(isYesterday(kNyMar10Midnight - 1, kNyMar10_0030, system));
        CHECK_FALSE(isYesterday(kNyMar10Midnight, kNyMar10_0030, system));
    }
    SUBCASE("now = 00:30 on the day after the 23-hour day (2024-03-11)") {
        // now - 24h would be 23:30 on Mar 9; yesterday must still be Mar 10.
        CHECK(isYesterday(kNyMar10Midnight, kNyMar11_0030, system));
        CHECK(isYesterday(kNyMar11Midnight - 1, kNyMar11_0030, system));
        CHECK_FALSE(isYesterday(kNyMar9Noon, kNyMar11_0030, system));
    }
    SUBCASE("now = 00:30 on the 25-hour day (2024-11-03)") {
        // now + 24h is 23:30 on Nov 3; tomorrow must still be Nov 4.
        CHECK(isToday(kNyNov3_2330, kNyNov3_0030, system));
        CHECK(isTomorrow(kNyNov4Midnight, kNyNov3_0030, system));
        CHECK(isTomorrow(kNyNov4_0030, kNyNov3_0030, system));
        CHECK_FALSE(isTomorrow(kNyNov3_2330, kNyNov3_0030, system));
        CHECK(isYesterday(kNyNov2Noon, kNyNov3_0030, system));
        CHECK_FALSE(isYesterday(kNyNov3Midnight, kNyNov3_0030, system));
    }
    SUBCASE("now = 00:30 on the day after the 25-hour day (2024-11-04)") {
        CHECK(isYesterday(kNyNov3Midnight, kNyNov4_0030, system));
        CHECK(isYesterday(kNyNov3_2330, kNyNov4_0030, system));
        CHECK_FALSE(isYesterday(kNyNov4Midnight, kNyNov4_0030, system));
    }
}

TEST_CASE("isToday family rejects non-finite and out-of-range timestamps") {
    FakeTimezoneProvider system;
    system.setSystemZone("UTC");
    const double nan = std::numeric_limits<double>::quiet_NaN();
    const double inf = std::numeric_limits<double>::infinity();
    for (double bad : {nan, inf, -inf, MAX_TIMESTAMP_MS + 1, -MAX_TIMESTAMP_MS - 1, 1e20}) {
        CAPTURE(bad);
        CHECK_THROWS_AS(isToday(bad, kJan1_2024, system), std::invalid_argument);
        CHECK_THROWS_AS(isToday(kJan1_2024, bad, system), std::invalid_argument);
        CHECK_THROWS_AS(isTomorrow(bad, kJan1_2024, system), std::invalid_argument);
        CHECK_THROWS_AS(isTomorrow(kJan1_2024, bad, system), std::invalid_argument);
        CHECK_THROWS_AS(isYesterday(bad, kJan1_2024, system), std::invalid_argument);
        CHECK_THROWS_AS(isYesterday(kJan1_2024, bad, system), std::invalid_argument);
    }
}

} // TEST_SUITE
