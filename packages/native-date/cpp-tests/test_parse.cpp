#include "doctest.h"

#include "IsoParser.hpp"
#include "PatternParser.hpp"
#include "fakes/ScopedTimezone.hpp"

#include <cmath>
#include <stdexcept>

using namespace nativedate::core;
using nativedate::test::ScopedTimezone;

namespace {
constexpr double kJan1_2024 = 1704067200000.0; // 2024-01-01T00:00:00Z
} // namespace

TEST_SUITE("IsoParser") {

TEST_CASE("Z designator is UTC") {
    CHECK(parseISO8601("2024-01-01T00:00:00Z") == kJan1_2024);
    CHECK(parseISO8601("2024-02-29T00:00:00Z") == 1709164800000.0);
}

TEST_CASE("space separates date and time too") {
    CHECK(parseISO8601("2024-01-01 00:00:00Z") == kJan1_2024);
}

TEST_CASE("fractional seconds are read up to millisecond precision and right-padded") {
    CHECK(parseISO8601("2024-01-01T00:00:00.500Z") == kJan1_2024 + 500);
    CHECK(parseISO8601("2024-01-01T00:00:00.5Z") == kJan1_2024 + 500);
    CHECK(parseISO8601("2024-01-01T00:00:00.05Z") == kJan1_2024 + 50);
    CHECK(parseISO8601("2024-01-01T00:00:00.123456Z") == kJan1_2024 + 123);
}

TEST_CASE("positive offsets with and without a colon") {
    CHECK(parseISO8601("2024-01-01T05:30:00+05:30") == kJan1_2024);
    CHECK(parseISO8601("2024-01-01T05:30:00+0530") == kJan1_2024);
    CHECK(parseISO8601("2024-01-01T09:00:00.250+09:00") == kJan1_2024 + 250);
}

TEST_CASE("negative offsets") {
    CHECK(parseISO8601("2023-12-31T19:00:00-05:00") == kJan1_2024);
    CHECK(parseISO8601("2023-12-31T19:00:00-0500") == kJan1_2024);
}

TEST_CASE("strings without a designator are local time") {
    SUBCASE("TZ=UTC") {
        ScopedTimezone utc("UTC");
        CHECK(parseISO8601("2024-01-01") == kJan1_2024);
        CHECK(parseISO8601("2024-01-01T12:00:00") == kJan1_2024 + 12 * 3600000.0);
    }
    SUBCASE("TZ=America/New_York (EST)") {
        ScopedTimezone newYork("America/New_York");
        CHECK(parseISO8601("2024-01-01") == 1704085200000.0); // 05:00Z
    }
}

TEST_CASE("strings shorter than a date throw std::invalid_argument") {
    CHECK_THROWS_AS(parseISO8601("2024"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601(""), std::invalid_argument);
}

} // TEST_SUITE

TEST_SUITE("PatternParser") {

TEST_CASE("numeric tokens (TZ=UTC)") {
    ScopedTimezone utc("UTC");
    CHECK(parseWithFormat("2024-03-15", "yyyy-MM-dd") == 1710460800000.0);
    CHECK(parseWithFormat("15/03/2024 14:30:45", "dd/MM/yyyy HH:mm:ss") == 1710513045000.0);
    CHECK(parseWithFormat("3/5/24", "M/d/yy") == 1709596800000.0);
    CHECK(parseWithFormat("2024-03-15T10:20:30.123", "yyyy-MM-dd'T'HH:mm:ss.SSS") == 1710498030123.0);
}

TEST_CASE("two-digit years pivot at 70") {
    ScopedTimezone utc("UTC");
    CHECK(parseWithFormat("70-01-01", "yy-MM-dd") == 0.0);
    CHECK(parseWithFormat("24-01-01", "yy-MM-dd") == kJan1_2024);
}

TEST_CASE("12-hour clock with AM/PM markers") {
    ScopedTimezone utc("UTC");
    CHECK(parseWithFormat("12:00 AM", "hh:mm a") == 0.0);
    CHECK(parseWithFormat("12:00 PM", "hh:mm A") == 12 * 3600000.0);
    CHECK(parseWithFormat("1:05 pm", "h:mm a") == 13 * 3600000.0 + 5 * 60000.0);
    CHECK(parseWithFormat("1:05 p", "h:mm a") == 13 * 3600000.0 + 5 * 60000.0);
}

TEST_CASE("quoted literals must match") {
    ScopedTimezone utc("UTC");
    CHECK(parseWithFormat("Date: 2024-03-15", "'Date: 'yyyy-MM-dd") == 1710460800000.0);
    CHECK(std::isnan(parseWithFormat("Time: 2024-03-15", "'Date: 'yyyy-MM-dd")));
}

TEST_CASE("mismatches return NaN") {
    ScopedTimezone utc("UTC");
    CHECK(std::isnan(parseWithFormat("2024/03/15", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-13-01", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-01-32", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("25:00", "HH:mm")));
    CHECK(std::isnan(parseWithFormat("10:60", "HH:mm")));
    CHECK(std::isnan(parseWithFormat("10:00 XM", "HH:mm a")));
    CHECK(std::isnan(parseWithFormat("202", "yyyy")));
}

TEST_CASE("results are local time") {
    ScopedTimezone newYork("America/New_York");
    CHECK(parseWithFormat("2024-07-04 12:00", "yyyy-MM-dd HH:mm") == 1720108800000.0); // 16:00Z
}

} // TEST_SUITE
