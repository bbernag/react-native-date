#include "doctest.h"

#include "IsoParser.hpp"
#include "PatternParser.hpp"
#include "fakes/ScopedTimezone.hpp"

#include <cmath>
#include <stdexcept>
#include <string>

using namespace nativedate::core;
using nativedate::test::ScopedTimezone;

namespace {
constexpr double kJan1_2024 = 1704067200000.0; // 2024-01-01T00:00:00Z
constexpr double kHour = 3600000.0;
constexpr double kMinute = 60000.0;

// Returns the exception message, or an empty string when nothing was thrown.
std::string isoError(const std::string& input) {
    try {
        parseISO8601(input);
    } catch (const std::invalid_argument& e) {
        return e.what();
    }
    return "";
}
} // namespace

TEST_SUITE("IsoParser") {

TEST_CASE("Z designator is UTC") {
    CHECK(parseISO8601("2024-01-01T00:00:00Z") == kJan1_2024);
    CHECK(parseISO8601("2024-02-29T00:00:00Z") == 1709164800000.0);
}

TEST_CASE("space separates date and time too") {
    CHECK(parseISO8601("2024-01-01 00:00:00Z") == kJan1_2024);
}

TEST_CASE("HH:mm without seconds is accepted (C-01)") {
    CHECK(parseISO8601("2024-01-15T14:30Z") == 1705329000000.0);
    CHECK(parseISO8601("2024-01-15T14:30+01:00") == 1705329000000.0 - kHour);
    ScopedTimezone utc("UTC");
    CHECK(parseISO8601("2024-01-15T14:30") == 1705329000000.0);
}

TEST_CASE("fractional seconds: 1-9 digits, truncated to milliseconds") {
    CHECK(parseISO8601("2024-01-01T00:00:00.5Z") == kJan1_2024 + 500);
    CHECK(parseISO8601("2024-01-01T00:00:00.05Z") == kJan1_2024 + 50);
    CHECK(parseISO8601("2024-01-01T00:00:00.500Z") == kJan1_2024 + 500);
    CHECK(parseISO8601("2024-01-01T00:00:00.1234Z") == kJan1_2024 + 123);
    CHECK(parseISO8601("2024-01-01T00:00:00.12345Z") == kJan1_2024 + 123);
    CHECK(parseISO8601("2024-01-01T00:00:00.123456Z") == kJan1_2024 + 123);
    CHECK(parseISO8601("2024-01-01T00:00:00.1234567Z") == kJan1_2024 + 123);
    CHECK(parseISO8601("2024-01-01T00:00:00.12345678Z") == kJan1_2024 + 123);
    CHECK(parseISO8601("2024-01-01T00:00:00.123456789Z") == kJan1_2024 + 123);
    CHECK(parseISO8601("2024-01-01T00:00:00.9999Z") == kJan1_2024 + 999); // truncated, not rounded

    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00.Z"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00.1234567890Z"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00.5Z"), std::invalid_argument); // no fractional minutes
}

TEST_CASE("offsets: ±hh:mm, ±hhmm and ±hh") {
    CHECK(parseISO8601("2024-01-01T05:30:00+05:30") == kJan1_2024);
    CHECK(parseISO8601("2024-01-01T05:30:00+0530") == kJan1_2024);
    CHECK(parseISO8601("2024-01-01T05:00:00+05") == kJan1_2024);
    CHECK(parseISO8601("2024-01-01T09:00:00.250+09:00") == kJan1_2024 + 250);
    CHECK(parseISO8601("2023-12-31T19:00:00-05:00") == kJan1_2024);
    CHECK(parseISO8601("2023-12-31T19:00:00-0500") == kJan1_2024);
    CHECK(parseISO8601("2023-12-31T19:00:00-05") == kJan1_2024);
    CHECK(parseISO8601("2024-01-01T00:00:00+00:00") == kJan1_2024);
    CHECK(parseISO8601("2024-01-01T00:00:00-00:00") == kJan1_2024);

    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00+5"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00+05:"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00+05:3"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00+053"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00+24:00"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00+05:60"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-01T00:00:00+ab:cd"), std::invalid_argument);
}

TEST_CASE("date-only with a designator is UTC midnight shifted by the offset (C-13)") {
    CHECK(parseISO8601("2024-01-15Z") == 1705276800000.0);
    CHECK(parseISO8601("2024-01-15+05:00") == 1705276800000.0 - 5 * kHour);
    CHECK(parseISO8601("2024-01-15+0530") == 1705276800000.0 - 5 * kHour - 30 * kMinute);
    CHECK(parseISO8601("2024-01-15-08:00") == 1705276800000.0 + 8 * kHour);
}

TEST_CASE("strings without a designator are local time") {
    SUBCASE("TZ=UTC") {
        ScopedTimezone utc("UTC");
        CHECK(parseISO8601("2024-01-01") == kJan1_2024);
        CHECK(parseISO8601("2024-01-01T12:00:00") == kJan1_2024 + 12 * kHour);
        CHECK(parseISO8601("2024-01-01 12:00:00.250") == kJan1_2024 + 12 * kHour + 250);
    }
    SUBCASE("TZ=America/New_York (EST)") {
        ScopedTimezone newYork("America/New_York");
        CHECK(parseISO8601("2024-01-01") == 1704085200000.0); // 05:00Z
        CHECK(parseISO8601("2024-01-01T00:00") == 1704085200000.0);
    }
}

TEST_CASE("year range 0000-9999 and calendar-valid days") {
    // Year 0000 is grammatically valid; its epoch value depends on the civil-time
    // conversion (point 08 replaces timegm, which returns -1 for it on macOS).
    CHECK_NOTHROW(parseISO8601("0000-01-01T00:00:00Z"));
    CHECK(parseISO8601("9999-12-31T23:59:59.999Z") == 253402300799999.0);
    CHECK(parseISO8601("2024-02-29Z") == 1709164800000.0); // leap day
    CHECK(parseISO8601("2000-02-29Z") == 951782400000.0);  // 400-year rule
    CHECK(parseISO8601("2024-01-31Z") == 1706659200000.0);
    CHECK(parseISO8601("2024-04-30Z") == 1714435200000.0);

    CHECK_THROWS_AS(parseISO8601("2024-02-31"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2023-02-29"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("1900-02-29"), std::invalid_argument); // 100-year rule
    CHECK_THROWS_AS(parseISO8601("2024-04-31"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-13-01"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-00-10"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-00"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-32"), std::invalid_argument);
}

TEST_CASE("date separators and digits are mandatory (B-02)") {
    CHECK_THROWS_AS(parseISO8601("not-a-date"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024/01/15"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15-"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("20240115"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-1-15"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-5 "), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("abcd-01-15"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-1x"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("+2024-01-15"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601(" 2024-01-15"), std::invalid_argument);
}

TEST_CASE("time separators, widths and ranges are mandatory") {
    CHECK_THROWS_AS(parseISO8601("2024-01-15T"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14:"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14:3"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T1430"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14-30"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14:30:"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14:30:4"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14:30.00"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14:30:00:00"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T24:00:00"), std::invalid_argument); // documented: rejected
    CHECK_THROWS_AS(parseISO8601("2024-01-15T24:00"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T25:00:00"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14:60:00"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T14:30:60"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15Tab:cd:ef"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15t14:30:00z"), std::invalid_argument); // lowercase rejected

    CHECK(parseISO8601("2024-01-15T00:00:00Z") == 1705276800000.0);
    CHECK(parseISO8601("2024-01-15T23:59:59Z") == 1705276800000.0 + 86399000.0);
}

TEST_CASE("anything after index 10 that is not T, space or a designator is invalid") {
    CHECK_THROWS_AS(parseISO8601("2024-01-15x"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15 "), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T00:00:00Zjunk"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T00:00:00Z "), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T00:00:00+05:00Z"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T00:00:00ZZ"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T00:00:00 Z"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T00:00:00.000Z\n"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15T00:00:00 +05:00"), std::invalid_argument);
}

TEST_CASE("empty, short and oversized input throw; messages are bounded (B-07)") {
    CHECK_THROWS_AS(parseISO8601(""), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024"), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-1"), std::invalid_argument);

    const std::string huge(10000, '9');
    CHECK_THROWS_AS(parseISO8601(huge), std::invalid_argument);
    const std::string message = isoError(huge);
    CHECK(message.find(std::string(64, '9')) != std::string::npos);
    CHECK(message.find(std::string(65, '9')) == std::string::npos);
    CHECK(message.find("...") != std::string::npos);
    CHECK(message.size() < 160);

    // A valid date followed by padding up to the cap is still rejected as trailing garbage,
    // and one character over the cap fails on length alone.
    CHECK_THROWS_AS(parseISO8601("2024-01-15" + std::string(118, ' ')), std::invalid_argument);
    CHECK_THROWS_AS(parseISO8601("2024-01-15" + std::string(119, ' ')), std::invalid_argument);

    CHECK(isoError("not-a-date").find("not-a-date") != std::string::npos);
    CHECK(isoError("").find("expected YYYY-MM-DD") != std::string::npos);
}

TEST_CASE("longest valid form fits well under the cap") {
    CHECK(parseISO8601("2024-01-01T00:00:00.123456789+05:30") == kJan1_2024 + 123 - 5 * kHour - 30 * kMinute);
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

TEST_CASE("the whole pattern must be consumed: no prefix parsing (C-05 / CPP-04)") {
    ScopedTimezone utc("UTC");
    CHECK(std::isnan(parseWithFormat("1", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-01", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-01-15", "yyyy-MM-dd HH:mm")));
    CHECK(std::isnan(parseWithFormat("2024-01-15", "yyyy-MM-dd HH:mm:ss")));
    CHECK(std::isnan(parseWithFormat("12/25", "MM/dd/yyyy")));
    CHECK(std::isnan(parseWithFormat("2024-01-15 12:30", "yyyy-MM-dd HH:mm 'UTC'")));
    CHECK(std::isnan(parseWithFormat("", "yyyy")));
}

TEST_CASE("the whole input must be consumed: no trailing suffix") {
    ScopedTimezone utc("UTC");
    CHECK(std::isnan(parseWithFormat("2024-01-15garbage", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-01-15 ", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-01-15T00:00:00", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-01-15 xyz", "yyyy-MM-dd SSS")));
    CHECK(std::isnan(parseWithFormat("2024-01-15 123x", "yyyy-MM-dd SSS")));
    CHECK(std::isnan(parseWithFormat("x", "")));
    CHECK(parseWithFormat("", "") == 0.0); // every component keeps its default
    CHECK(parseWithFormat("2024-01-15 123", "yyyy-MM-dd SSS") == 1705276800123.0);
}

TEST_CASE("fixed-width tokens require digits in every position") {
    ScopedTimezone utc("UTC");
    CHECK(std::isnan(parseWithFormat("abcd-01-15", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-0a-15", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-01-1x", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-1-15", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("24-01-15", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("1a:00", "HH:mm")));
    CHECK(std::isnan(parseWithFormat("10:0b", "HH:mm")));
    CHECK(std::isnan(parseWithFormat("10:00:5", "HH:mm:ss")));
    CHECK(std::isnan(parseWithFormat("12a", "SSS")));
    CHECK(std::isnan(parseWithFormat("12", "SSS")));
    CHECK(parseWithFormat("999", "SSS") == 999.0);
    CHECK(parseWithFormat("000", "SSS") == 0.0);
    CHECK(parseWithFormat("9999-12-31", "yyyy-MM-dd") == 253402214400000.0);
}

TEST_CASE("variable-width tokens read at most two digits (B-03)") {
    ScopedTimezone utc("UTC");
    const std::string twentyNines(20, '9');
    CHECK(std::isnan(parseWithFormat(twentyNines, "M")));
    CHECK(std::isnan(parseWithFormat(twentyNines, "d")));
    CHECK(std::isnan(parseWithFormat(twentyNines, "H")));
    CHECK(std::isnan(parseWithFormat(twentyNines, "h")));
    CHECK(std::isnan(parseWithFormat(twentyNines, "m")));
    CHECK(std::isnan(parseWithFormat(twentyNines, "s")));
    CHECK(std::isnan(parseWithFormat("123/5/24", "M/d/yy")));
    CHECK(std::isnan(parseWithFormat("3/123/24", "M/d/yy")));
    CHECK(std::isnan(parseWithFormat("/5/24", "M/d/yy")));      // zero digits
    CHECK(std::isnan(parseWithFormat("3//24", "M/d/yy")));
    CHECK(std::isnan(parseWithFormat("13/5/24", "M/d/yy")));    // two digits, out of range
    CHECK(std::isnan(parseWithFormat("0/5/24", "M/d/yy")));
    CHECK(std::isnan(parseWithFormat("3/0/24", "M/d/yy")));
    CHECK(parseWithFormat("12/31/24", "M/d/yy") == 1735603200000.0);
    CHECK(parseWithFormat("03/05/24", "M/d/yy") == 1709596800000.0); // leading zeros are fine
    CHECK(parseWithFormat("1:2:3", "H:m:s") == kHour + 2 * kMinute + 3000.0);
    CHECK(parseWithFormat("23:59:59", "H:m:s") == 23 * kHour + 59 * kMinute + 59000.0);
    CHECK(std::isnan(parseWithFormat("24:0:0", "H:m:s")));
    CHECK(std::isnan(parseWithFormat("0:60:0", "H:m:s")));
    CHECK(std::isnan(parseWithFormat("0:0:60", "H:m:s")));
}

TEST_CASE("days are validated against the calendar month") {
    ScopedTimezone utc("UTC");
    CHECK(parseWithFormat("2024-02-29", "yyyy-MM-dd") == 1709164800000.0);
    CHECK(parseWithFormat("29/2/24", "d/M/yy") == 1709164800000.0);
    CHECK(std::isnan(parseWithFormat("2023-02-29", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-02-30", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("2024-04-31", "yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("31/4/24", "d/M/yy")));
    CHECK(std::isnan(parseWithFormat("1900-02-29", "yyyy-MM-dd")));
    CHECK(parseWithFormat("2000-02-29", "yyyy-MM-dd") == 951782400000.0);
    CHECK(parseWithFormat("31", "d") == 30 * 86400000.0); // default month is January, so 31 is valid
    CHECK(std::isnan(parseWithFormat("32", "d")));
}

TEST_CASE("12-hour tokens require 1-12 and default to AM without a marker (C-14)") {
    ScopedTimezone utc("UTC");
    CHECK(parseWithFormat("12:00", "hh:mm") == 0.0);               // documented: AM
    CHECK(parseWithFormat("1:00", "h:mm") == kHour);
    CHECK(parseWithFormat("11:59", "hh:mm") == 11 * kHour + 59 * kMinute);
    CHECK(std::isnan(parseWithFormat("13:00", "hh:mm")));
    CHECK(std::isnan(parseWithFormat("00:00", "hh:mm")));
    CHECK(std::isnan(parseWithFormat("0:00", "h:mm")));
    CHECK(std::isnan(parseWithFormat("13:00 PM", "hh:mm A")));
    CHECK(std::isnan(parseWithFormat("00:00 AM", "hh:mm A")));
    CHECK(parseWithFormat("12:00 PM", "hh:mm A") == 12 * kHour);
    CHECK(parseWithFormat("11:00 PM", "hh:mm A") == 23 * kHour);
    CHECK(parseWithFormat("12:00 AM", "hh:mm A") == 0.0);
    // 24-hour tokens are unaffected by a marker's presence
    CHECK(parseWithFormat("13:00", "HH:mm") == 13 * kHour);
    CHECK(parseWithFormat("00:00", "HH:mm") == 0.0);
}

TEST_CASE("every AM/PM token accepts every form the formatter emits") {
    ScopedTimezone utc("UTC");
    const double onePM = 13 * kHour + 5 * kMinute;
    const double oneAM = kHour + 5 * kMinute;
    CHECK(parseWithFormat("1:05 p", "h:mm a") == onePM);
    CHECK(parseWithFormat("1:05 pm", "h:mm aa") == onePM);
    CHECK(parseWithFormat("1:05 p.m.", "h:mm aaa") == onePM);
    CHECK(parseWithFormat("1:05 PM", "h:mm A") == onePM);
    CHECK(parseWithFormat("1:05 a", "h:mm a") == oneAM);
    CHECK(parseWithFormat("1:05 am", "h:mm aa") == oneAM);
    CHECK(parseWithFormat("1:05 a.m.", "h:mm aaa") == oneAM);
    CHECK(parseWithFormat("1:05 AM", "h:mm A") == oneAM);
    // cross-acceptance and case-insensitivity
    CHECK(parseWithFormat("1:05 PM", "h:mm a") == onePM);
    CHECK(parseWithFormat("1:05 p.m.", "h:mm A") == onePM);
    CHECK(parseWithFormat("1:05 Pm", "h:mm aa") == onePM);
    CHECK(parseWithFormat("1:05 P.M.", "h:mm aaa") == onePM);
    // malformed markers
    CHECK(std::isnan(parseWithFormat("1:05 p.", "h:mm a")));
    CHECK(std::isnan(parseWithFormat("1:05 p.m", "h:mm aaa")));
    CHECK(std::isnan(parseWithFormat("1:05 pmm", "h:mm aa")));
    CHECK(std::isnan(parseWithFormat("1:05 XM", "h:mm a")));
    CHECK(std::isnan(parseWithFormat("1:05 ", "h:mm a")));
    CHECK(std::isnan(parseWithFormat("1:05", "h:mm a")));
}

TEST_CASE("formatter aliases are accepted: YYYY, YY, DD, D and [literal]") {
    ScopedTimezone utc("UTC");
    CHECK(parseWithFormat("2024-03-15", "YYYY-MM-DD") == 1710460800000.0);
    CHECK(parseWithFormat("15/3/24", "D/M/YY") == 1710460800000.0);
    CHECK(parseWithFormat("Date: 2024-03-15", "[Date: ]yyyy-MM-dd") == 1710460800000.0);
    CHECK(parseWithFormat("yyyy 2024", "[yyyy] yyyy") == kJan1_2024);
    CHECK(std::isnan(parseWithFormat("Time: 2024-03-15", "[Date: ]yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("Date: 2024-03-15", "[Date: ]")));
    CHECK(parseWithFormat("it's 2024", "'it''s' yyyy") == kJan1_2024);
    CHECK(parseWithFormat("2024'", "yyyy''") == kJan1_2024);
}

TEST_CASE("locale name tokens are rejected explicitly") {
    ScopedTimezone utc("UTC");
    CHECK(std::isnan(parseWithFormat("Mar 15, 2024", "MMM d, yyyy")));
    CHECK(std::isnan(parseWithFormat("March 15, 2024", "MMMM d, yyyy")));
    CHECK(std::isnan(parseWithFormat("Fri 2024-03-15", "EEE yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("Friday 2024-03-15", "EEEE yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("F 2024-03-15", "E yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("Fri 2024-03-15", "ddd yyyy-MM-dd")));
    CHECK(std::isnan(parseWithFormat("Friday 2024-03-15", "dddd yyyy-MM-dd")));
}

TEST_CASE("oversized date strings and patterns throw without echoing the input (B-07)") {
    ScopedTimezone utc("UTC");
    const std::string longDate = "2024-01-15" + std::string(247, ' '); // 257 chars
    const std::string atCapDate = "2024-01-15" + std::string(246, ' '); // 256 chars
    CHECK_THROWS_AS(parseWithFormat(longDate, "yyyy-MM-dd"), std::invalid_argument);
    CHECK(std::isnan(parseWithFormat(atCapDate, "yyyy-MM-dd"))); // within the cap: ordinary mismatch
    try {
        parseWithFormat(longDate, "yyyy-MM-dd");
        CHECK(false);
    } catch (const std::invalid_argument& e) {
        const std::string message = e.what();
        CHECK(message.find("256") != std::string::npos);
        CHECK(message.find("2024-01-15") == std::string::npos);
        CHECK(message.size() < 100);
    }

    const std::string longPattern = "yyyy-MM-dd" + std::string(119, 'x'); // 129 chars
    const std::string atCapPattern = "yyyy-MM-dd" + std::string(118, 'x'); // 128 chars
    CHECK_THROWS_AS(parseWithFormat("2024-01-15", longPattern), std::invalid_argument);
    CHECK(std::isnan(parseWithFormat("2024-01-15", atCapPattern)));
    try {
        parseWithFormat("2024-01-15", longPattern);
        CHECK(false);
    } catch (const std::invalid_argument& e) {
        const std::string message = e.what();
        CHECK(message.find("128") != std::string::npos);
        CHECK(message.find("xxxx") == std::string::npos);
    }
}

TEST_CASE("literal characters must match exactly and the input may not run out") {
    ScopedTimezone utc("UTC");
    CHECK(std::isnan(parseWithFormat("2024-03-15", "yyyy/MM/dd")));
    CHECK(std::isnan(parseWithFormat("2024-03", "yyyy-MM-")));
    CHECK(std::isnan(parseWithFormat("2024-03", "yyyy-MM'x'")));
    CHECK(std::isnan(parseWithFormat("2024-03", "yyyy-MM[x]")));
    CHECK(parseWithFormat("2024-03-15T10:20:30.123Z", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") == 1710498030123.0);
}

} // TEST_SUITE
