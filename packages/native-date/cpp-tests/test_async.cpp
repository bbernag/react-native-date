#include "doctest.h"

#include "Batch.hpp"
#include "Formatter.hpp"
#include "fakes/FakeLocaleProvider.hpp"
#include "fakes/ScopedTimezone.hpp"

#include <cmath>
#include <cstddef>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

using namespace nativedate::core;
using nativedate::test::FakeLocaleProvider;
using nativedate::test::ScopedTimezone;

namespace {
constexpr double kNaN = std::numeric_limits<double>::quiet_NaN();
constexpr double kInf = std::numeric_limits<double>::infinity();
constexpr double kJune15NoonZ = 1718452800000.0; // 2024-06-15T12:00:00Z (Saturday)
constexpr double kMarch5Z = 1709647629045.0;     // 2024-03-05T14:07:09.045Z (Tuesday)
const FakeLocaleProvider english;
} // namespace

TEST_SUITE("Batch") {

TEST_CASE("formatMany uses the real formatter: MMMM d, EEE, quoted literals (C-02)") {
    ScopedTimezone utc("UTC");
    const std::vector<double> timestamps = {kJune15NoonZ, kMarch5Z};

    const auto months = formatMany(timestamps, "MMMM d", english);
    REQUIRE(months.size() == 2);
    CHECK(months[0] == "June 15");
    CHECK(months[1] == "March 5");
    CHECK(months[0] != "0606 15"); // the old find/replace engine's answer

    const auto weekdays = formatMany(timestamps, "EEE", english);
    REQUIRE(weekdays.size() == 2);
    CHECK(weekdays[0] == "Sat");
    CHECK(weekdays[1] == "Tue");

    const auto quoted = formatMany(timestamps, "'Today is' EEEE", english);
    REQUIRE(quoted.size() == 2);
    CHECK(quoted[0] == "Today is Saturday");
    CHECK(quoted[1] == "Today is Tuesday");

    const auto brackets = formatMany({kJune15NoonZ}, "[yyyy] MMMM", english);
    REQUIRE(brackets.size() == 1);
    CHECK(brackets[0] == "yyyy June");
}

TEST_CASE("formatMany matches formatInternal element-wise, including locale names") {
    ScopedTimezone utc("UTC");
    FakeLocaleProvider japanese(FakeLocaleProvider::Language::Japanese);
    const std::vector<double> timestamps = {kJune15NoonZ, kMarch5Z};
    const std::string pattern = "MMMM d, EEEE";

    const auto batched = formatMany(timestamps, pattern, japanese);
    REQUIRE(batched.size() == timestamps.size());
    for (std::size_t i = 0; i < timestamps.size(); ++i) {
        CHECK(batched[i] == formatInternal(timestamps[i], pattern, false, japanese));
    }
}

TEST_CASE("formatMany is local time, not UTC") {
    const double jul4_16Z = 1720108800000.0; // 2024-07-04T16:00:00Z
    ScopedTimezone newYork("America/New_York");
    const auto results = formatMany({jul4_16Z}, "yyyy-MM-dd HH:mm EEE", english);
    REQUIRE(results.size() == 1);
    CHECK(results[0] == "2024-07-04 12:00 Thu");
    CHECK(results[0] == formatInternal(jul4_16Z, "yyyy-MM-dd HH:mm EEE", false, english));
}

TEST_CASE("non-finite and out-of-range timestamps become empty strings (Q3)") {
    ScopedTimezone utc("UTC");
    const std::vector<double> timestamps = {kJune15NoonZ, kNaN, kInf, -kInf, MAX_TIMESTAMP_MS + 1, kMarch5Z};
    const auto results = formatMany(timestamps, "MMMM d", english);
    REQUIRE(results.size() == 6);
    CHECK(results[0] == "June 15");
    CHECK(results[1] == "");
    CHECK(results[2] == "");
    CHECK(results[3] == "");
    CHECK(results[4] == "");
    CHECK(results[5] == "March 5");
}

TEST_CASE("parseMany maps invalid strings to NaN and keeps order") {
    ScopedTimezone utc("UTC");
    const auto results = parseMany({"2024-06-15T12:00:00Z", "not-a-date", "2024-03-05T14:07:09.045Z", ""});
    REQUIRE(results.size() == 4);
    CHECK(results[0] == kJune15NoonZ);
    CHECK(std::isnan(results[1]));
    CHECK(results[2] == kMarch5Z);
    CHECK(std::isnan(results[3]));
}

TEST_CASE("getComponentsMany yields nullopt for invalid timestamps") {
    ScopedTimezone utc("UTC");
    const auto results = getComponentsMany({kJune15NoonZ, kNaN, kInf, MAX_TIMESTAMP_MS + 1});
    REQUIRE(results.size() == 4);
    REQUIRE(results[0].has_value());
    CHECK(results[0]->year == 2024);
    CHECK(results[0]->month == 6);
    CHECK(results[0]->day == 15);
    CHECK(results[0]->hour == 12);
    CHECK_FALSE(results[1].has_value());
    CHECK_FALSE(results[2].has_value());
    CHECK_FALSE(results[3].has_value());
}

TEST_CASE("empty batches are allowed") {
    CHECK(parseMany({}).empty());
    CHECK(formatMany({}, "yyyy", english).empty());
    CHECK(getComponentsMany({}).empty());
}

TEST_CASE("batches above kMaxBatchSize throw (B-07)") {
    CHECK_NOTHROW(requireBatchSize(0));
    CHECK_NOTHROW(requireBatchSize(kMaxBatchSize));
    CHECK_THROWS_AS(requireBatchSize(kMaxBatchSize + 1), std::invalid_argument);

    const std::vector<double> tooMany(kMaxBatchSize + 1, 0.0);
    CHECK_THROWS_AS(formatMany(tooMany, "yyyy", english), std::invalid_argument);
    CHECK_THROWS_AS(getComponentsMany(tooMany), std::invalid_argument);

    const std::vector<std::string> tooManyStrings(kMaxBatchSize + 1, "2024-01-01");
    CHECK_THROWS_AS(parseMany(tooManyStrings), std::invalid_argument);

    try {
        requireBatchSize(kMaxBatchSize + 1);
        CHECK(false);
    } catch (const std::invalid_argument& e) {
        const std::string message = e.what();
        CHECK(message.find("100000") != std::string::npos);
        CHECK(message.size() < 80);
    }
}

TEST_CASE("patterns above the parser length cap throw (B-07)") {
    ScopedTimezone utc("UTC");
    const std::string atCap(kMaxFormatPatternLength, 'x');
    const std::string overCap(kMaxFormatPatternLength + 1, 'x');

    CHECK_NOTHROW(requireFormatPattern(atCap));
    CHECK_THROWS_AS(requireFormatPattern(overCap), std::invalid_argument);

    const auto ok = formatMany({kJune15NoonZ}, atCap, english);
    REQUIRE(ok.size() == 1);
    CHECK(ok[0] == atCap);

    CHECK_THROWS_AS(formatMany({kJune15NoonZ}, overCap, english), std::invalid_argument);
    try {
        formatMany({kJune15NoonZ}, overCap, english);
        CHECK(false);
    } catch (const std::invalid_argument& e) {
        const std::string message = e.what();
        CHECK(message.find("128") != std::string::npos);
        CHECK(message.find(overCap) == std::string::npos);
        CHECK(message.size() < 100);
    }
}

} // TEST_SUITE
