#include "doctest.h"

#include "Formatter.hpp"
#include "PatternParser.hpp"
#include "fakes/FakeLocaleProvider.hpp"
#include "fakes/ScopedTimezone.hpp"

#include <initializer_list>
#include <string>

using namespace nativedate::core;
using nativedate::test::FakeLocaleProvider;
using nativedate::test::ScopedTimezone;

namespace {
constexpr double kTuesday = 1709647629045.0; // 2024-03-05T14:07:09.045Z
const FakeLocaleProvider english;

std::string fmtUTC(double ts, const std::string& pattern) {
    return formatInternal(ts, pattern, true, english);
}

bool onlyDigitsAndSigns(const std::string& s) {
    return s.find_first_not_of("-0123456789.:") == std::string::npos;
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
    CHECK(padZero(0, 3) == "000");
    CHECK(padZero(999, 3) == "999");
    CHECK(padZero(9999, 4) == "9999");
}

TEST_CASE("padZero never emits garbage for out-of-range values (C-06)") {
    CHECK(padZero(-5) == "-5");
    CHECK(padZero(-500, 3) == "-500");
    CHECK(padZero(-5, 3) == "-05");
    CHECK(padZero(1000, 3) == "1000");
    CHECK(padZero(123, 2) == "123");
    CHECK(padZero(10000, 4) == "10000");
    CHECK(padZero(-1, 4) == "-001");
}

TEST_CASE("years outside 0000-9999 format with their full value and sign (C-06)") {
    const double year10000 = 253402300800000.0;  // 10000-01-01T00:00:00Z
    const double yearMinus1 = -62198755200000.0; // -0001-01-01T00:00:00Z
    const double year1 = -62135596800000.0;      // 0001-01-01T00:00:00Z
    CHECK(fmtUTC(year10000, "yyyy-MM-dd") == "10000-01-01");
    CHECK(fmtUTC(year10000, "YYYY") == "10000");
    CHECK(fmtUTC(year10000, "yy") == "00");
    CHECK(fmtUTC(yearMinus1, "yyyy-MM-dd") == "-0001-01-01");
    CHECK(fmtUTC(yearMinus1, "yy") == "-1"); // -1 % 100: signed, never a garbage byte
    CHECK(fmtUTC(year1, "yyyy") == "0001");
}

TEST_CASE("pre-epoch instants never produce non-digit bytes") {
    // Until the civil-time lane normalizes negative remainders, ms may come
    // through negative; either way the output must be printable digits/sign.
    const std::string out = fmtUTC(-1500.0, "HH:mm:ss.SSS");
    CHECK(onlyDigitsAndSigns(out));
    CHECK(fmtUTC(-1500.0, "yyyy-MM-dd") == "1969-12-31");
}

TEST_CASE("format/parse round trip for every documented token") {
    ScopedTimezone utc("UTC");
    auto roundTrip = [](double ts, const std::string& pattern) {
        const std::string text = formatInternal(ts, pattern, false, english);
        return parseWithFormat(text, pattern);
    };

    const double afternoon = kTuesday;                   // 14:07:09.045
    const double afternoonSec = 1709647629000.0;         // 14:07:09.000
    const double afternoonMin = 1709647620000.0;         // 14:07:00.000
    const double midnight = 1704067200000.0;             // 2024-01-01T00:00:00Z
    const double noon = midnight + 12 * 3600000.0;
    const double morning = 1709622000000.0;              // 2024-03-05T07:00:00Z

    // Full-precision patterns round-trip exactly
    CHECK(roundTrip(afternoon, "yyyy-MM-dd HH:mm:ss.SSS") == afternoon);
    CHECK(roundTrip(afternoon, "YYYY/MM/D H:m:s SSS") == afternoon);
    CHECK(roundTrip(afternoon, "DD.MM.YYYY HH:mm:ss.SSS") == afternoon);
    CHECK(roundTrip(afternoon, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") == afternoon);
    CHECK(roundTrip(afternoon, "[on] d/MM/yyyy [at] H:m:s.SSS") == afternoon);

    // Patterns without SSS round-trip to the second
    CHECK(roundTrip(afternoon, "yy.MM.dd hh:mm:ss A") == afternoonSec);
    CHECK(roundTrip(afternoon, "YY-MM-d h:m:s a") == afternoonSec);
    CHECK(roundTrip(afternoon, "yyyy-MM-dd hh:mm:ss aa") == afternoonSec);
    CHECK(roundTrip(afternoon, "yyyy-MM-dd h:mm:ss aaa") == afternoonSec);
    CHECK(roundTrip(afternoon, "yyyy-MM-dd HH:mm:ss") == afternoonSec);
    CHECK(roundTrip(afternoon, "dd/MM/yyyy hh:mm aa") == afternoonMin);

    // 12-hour edge cases: midnight and noon in every marker form
    for (const char* pattern : {"yyyy-MM-dd hh:mm a", "yyyy-MM-dd h:mm aa",
                                "yyyy-MM-dd hh:mm aaa", "yyyy-MM-dd h:mm A"}) {
        CAPTURE(pattern);
        CHECK(roundTrip(midnight, pattern) == midnight);
        CHECK(roundTrip(noon, pattern) == noon);
        CHECK(roundTrip(morning, pattern) == morning);
    }

    // Each token in isolation round-trips its own component
    CHECK(roundTrip(afternoon, "yyyy") == 1704067200000.0); // 2024-01-01
    CHECK(roundTrip(afternoon, "YYYY") == 1704067200000.0);
    CHECK(roundTrip(afternoon, "yy") == 1704067200000.0);
    CHECK(roundTrip(afternoon, "YY") == 1704067200000.0);
    CHECK(roundTrip(afternoon, "MM") == 5097600000.0);      // 1970-03-01
    // `M` is the one asymmetric token: the formatter emits the locale's narrow
    // month name ("M" for March) while the parser reads a 1-2 digit month.
    CHECK(fmtUTC(afternoon, "M") == "M");
    CHECK(parseWithFormat("3", "M") == 5097600000.0);
    CHECK(roundTrip(afternoon, "dd") == 345600000.0);       // 1970-01-05
    CHECK(roundTrip(afternoon, "DD") == 345600000.0);
    CHECK(roundTrip(afternoon, "d") == 345600000.0);
    CHECK(roundTrip(afternoon, "D") == 345600000.0);
    CHECK(roundTrip(afternoon, "HH") == 14 * 3600000.0);
    CHECK(roundTrip(afternoon, "H") == 14 * 3600000.0);
    CHECK(roundTrip(afternoon, "hh") == 2 * 3600000.0);     // no marker: AM
    CHECK(roundTrip(afternoon, "h") == 2 * 3600000.0);
    CHECK(roundTrip(afternoon, "mm") == 7 * 60000.0);
    CHECK(roundTrip(afternoon, "m") == 7 * 60000.0);
    CHECK(roundTrip(afternoon, "ss") == 9000.0);
    CHECK(roundTrip(afternoon, "s") == 9000.0);
    CHECK(roundTrip(afternoon, "SSS") == 45.0);
}

} // TEST_SUITE
