#include "doctest.h"

#include "Formatter.hpp"
#include "fakes/FakeLocaleProvider.hpp"
#include "fakes/ScopedTimezone.hpp"

using namespace nativedate::core;
using nativedate::test::FakeLocaleProvider;
using nativedate::test::ScopedTimezone;

namespace {
constexpr double kTuesday = 1709647629045.0; // 2024-03-05T14:07:09.045Z
const FakeLocaleProvider english;

std::string fmtUTC(double ts, const std::string& pattern) {
    return formatInternal(ts, pattern, true, english);
}
} // namespace

TEST_SUITE("Formatter") {

TEST_CASE("numeric tokens, padded and unpadded") {
    CHECK(fmtUTC(kTuesday, "yyyy-MM-dd HH:mm:ss.SSS") == "2024-03-05 14:07:09.045");
    CHECK(fmtUTC(kTuesday, "yy d H m s") == "24 5 14 7 9");
    CHECK(fmtUTC(kTuesday, "YYYY/YY") == "2024/24");
    CHECK(fmtUTC(kTuesday, "DD D") == "05 5");
    CHECK(fmtUTC(kTuesday, "dd") == "05");
}

TEST_CASE("12-hour tokens and AM/PM variants") {
    CHECK(fmtUTC(kTuesday, "hh:mm a") == "02:07 p");
    CHECK(fmtUTC(kTuesday, "h:mm aa") == "2:07 pm");
    CHECK(fmtUTC(kTuesday, "aaa") == "p.m.");
    CHECK(fmtUTC(kTuesday, "A") == "PM");

    const double midnight = 1704067200000.0; // 2024-01-01T00:00:00Z
    CHECK(fmtUTC(midnight, "hh A") == "12 AM");
    CHECK(fmtUTC(midnight + 12 * 3600000.0, "h aa") == "12 pm");
    CHECK(fmtUTC(midnight, "aaa") == "a.m.");
}

TEST_CASE("month and weekday names come from the locale provider") {
    CHECK(fmtUTC(kTuesday, "MMMM d, yyyy") == "March 5, 2024");
    CHECK(fmtUTC(kTuesday, "MMM") == "Mar");
    CHECK(fmtUTC(kTuesday, "EEEE") == "Tuesday");
    CHECK(fmtUTC(kTuesday, "EEE") == "Tue");
    CHECK(fmtUTC(kTuesday, "EE") == "Tu");
    CHECK(fmtUTC(kTuesday, "E") == "T");
    CHECK(fmtUTC(kTuesday, "dddd") == "Tuesday");
    CHECK(fmtUTC(kTuesday, "ddd") == "Tue");
}

TEST_CASE("multi-byte UTF-8 names pass through unchanged") {
    FakeLocaleProvider japanese(FakeLocaleProvider::Language::Japanese);
    CHECK(formatInternal(kTuesday, "MMMM EEEE", true, japanese) == "3\xE6\x9C\x88 \xE7\x81\xAB\xE6\x9B\x9C\xE6\x97\xA5");
    CHECK(formatInternal(kTuesday, "E", true, japanese) == "\xE7\x81\xAB");
}

TEST_CASE("bracket and quoted literals are copied verbatim") {
    CHECK(fmtUTC(kTuesday, "[Year] yyyy") == "Year 2024");
    CHECK(fmtUTC(kTuesday, "[yyyy]") == "yyyy");
    CHECK(fmtUTC(kTuesday, "'Today is' EEEE") == "Today is Tuesday");
    CHECK(fmtUTC(kTuesday, "h 'o''clock'") == "2 o'clock");
    CHECK(fmtUTC(kTuesday, "yyyy''") == "2024'");
}

TEST_CASE("unknown characters are literals") {
    CHECK(fmtUTC(kTuesday, "yyyy-MM-ddTHH:mm:ssZ") == "2024-03-05T14:07:09Z");
    CHECK(fmtUTC(kTuesday, "HH:mm (UTC)") == "14:07 (UTC)");
}

TEST_CASE("local formatting follows the process zone") {
    const double jul4_16Z = 1720108800000.0; // 2024-07-04T16:00:00Z
    SUBCASE("UTC") {
        ScopedTimezone utc("UTC");
        CHECK(formatInternal(jul4_16Z, "yyyy-MM-dd HH:mm", false, english) == "2024-07-04 16:00");
    }
    SUBCASE("America/New_York, EDT") {
        ScopedTimezone newYork("America/New_York");
        CHECK(formatInternal(jul4_16Z, "yyyy-MM-dd HH:mm EEE", false, english) == "2024-07-04 12:00 Thu");
    }
}

TEST_CASE("padZero pads to the requested width") {
    CHECK(padZero(5) == "05");
    CHECK(padZero(42) == "42");
    CHECK(padZero(7, 3) == "007");
    CHECK(padZero(42, 4) == "0042");
    CHECK(padZero(5, 5) == "00005");
}

} // TEST_SUITE
