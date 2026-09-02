#include "doctest.h"

#include "RelativeBuckets.hpp"

#include <cmath>
#include <limits>
#include <stdexcept>

using namespace nativedate::core;

namespace {
constexpr double kSecond = 1000.0;
constexpr double kMinute = 60 * kSecond;
constexpr double kHour = 60 * kMinute;
constexpr double kDay = 24 * kHour;

bool sameBucket(const RelativeBucket& bucket, int64_t value, RelativeUnit unit, RelativeQualifier qualifier) {
    return bucket.value == value && bucket.unit == unit && bucket.qualifier == qualifier;
}
} // namespace

TEST_SUITE("RelativeBuckets") {

TEST_CASE("bucket boundaries follow the date-fns table") {
    // < 30 s → less than a minute; 30 s → 1 minute
    CHECK(sameBucket(relativeBucketFromDiff(29 * kSecond), 1, RelativeUnit::Minute, RelativeQualifier::LessThan));
    CHECK(sameBucket(relativeBucketFromDiff(30 * kSecond), 1, RelativeUnit::Minute, RelativeQualifier::None));
    CHECK(sameBucket(relativeBucketFromDiff(89 * kSecond), 1, RelativeUnit::Minute, RelativeQualifier::None));
    // 90 s → 2 minutes (the ICU-only table said 1 minute; C-10)
    CHECK(sameBucket(relativeBucketFromDiff(90 * kSecond), 2, RelativeUnit::Minute, RelativeQualifier::None));
    // 44 min 30 s is still the minutes bucket, rounded half away from zero
    CHECK(sameBucket(relativeBucketFromDiff(44 * kMinute + 30 * kSecond), 45, RelativeUnit::Minute, RelativeQualifier::None));
    CHECK(sameBucket(relativeBucketFromDiff(45 * kMinute), 1, RelativeUnit::Hour, RelativeQualifier::About));
    CHECK(sameBucket(relativeBucketFromDiff(89 * kMinute + 30 * kSecond), 1, RelativeUnit::Hour, RelativeQualifier::About));
    CHECK(sameBucket(relativeBucketFromDiff(90 * kMinute), 2, RelativeUnit::Hour, RelativeQualifier::About));
    CHECK(sameBucket(relativeBucketFromDiff(24 * kHour - 1), 24, RelativeUnit::Hour, RelativeQualifier::About));
    CHECK(sameBucket(relativeBucketFromDiff(24 * kHour), 1, RelativeUnit::Day, RelativeQualifier::None));
    CHECK(sameBucket(relativeBucketFromDiff(42 * kHour), 2, RelativeUnit::Day, RelativeQualifier::None));
    CHECK(sameBucket(relativeBucketFromDiff(29 * kDay), 29, RelativeUnit::Day, RelativeQualifier::None));
    CHECK(sameBucket(relativeBucketFromDiff(30 * kDay), 1, RelativeUnit::Month, RelativeQualifier::About));
    CHECK(sameBucket(relativeBucketFromDiff(45 * kDay), 2, RelativeUnit::Month, RelativeQualifier::None));
    CHECK(sameBucket(relativeBucketFromDiff(360 * kDay), 12, RelativeUnit::Month, RelativeQualifier::None));
    CHECK(sameBucket(relativeBucketFromDiff(365 * kDay), 1, RelativeUnit::Year, RelativeQualifier::About));
    CHECK(sameBucket(relativeBucketFromDiff(1.5 * 365 * kDay), 1, RelativeUnit::Year, RelativeQualifier::Over));
    CHECK(sameBucket(relativeBucketFromDiff(2.5 * 365 * kDay), 3, RelativeUnit::Year, RelativeQualifier::About));
    CHECK(sameBucket(relativeBucketFromDiff(10 * 365 * kDay), 10, RelativeUnit::Year, RelativeQualifier::About));
}

TEST_CASE("sign decides direction, zero reads as past") {
    CHECK(relativeBucketFromDiff(2 * kHour).direction == RelativeDirection::Future);
    CHECK(relativeBucketFromDiff(-2 * kHour).direction == RelativeDirection::Past);
    CHECK(relativeBucketFromDiff(0).direction == RelativeDirection::Past);

    const RelativeBucket past = relativeBucketFromDiff(-3 * kDay);
    CHECK(sameBucket(past, 3, RelativeUnit::Day, RelativeQualifier::None));

    const RelativeBucket fromTimestamps = relativeBucket(1000 * kDay, 1003 * kDay);
    CHECK(fromTimestamps.direction == RelativeDirection::Past);
    CHECK(sameBucket(fromTimestamps, 3, RelativeUnit::Day, RelativeQualifier::None));
}

TEST_CASE("English rendering only adds direction words when addSuffix is set") {
    const RelativeBucket future = relativeBucketFromDiff(2 * kHour);
    CHECK(formatRelativeEnglish(future, false) == "about 2 hours");
    CHECK(formatRelativeEnglish(future, true) == "in about 2 hours");

    const RelativeBucket past = relativeBucketFromDiff(-2 * kHour);
    CHECK(formatRelativeEnglish(past, false) == "about 2 hours");
    CHECK(formatRelativeEnglish(past, true) == "about 2 hours ago");

    CHECK(formatRelativeEnglish(relativeBucketFromDiff(-10 * kSecond), true) == "less than a minute ago");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(10 * kSecond), false) == "less than a minute");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(-60 * kSecond), true) == "1 minute ago");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(60 * kSecond), true) == "in 1 minute");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(5 * kMinute), false) == "5 minutes");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(-30 * kHour), true) == "1 day ago");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(40 * kDay), true) == "in about 1 month");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(-90 * kDay), false) == "3 months");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(400 * kDay), true) == "in about 1 year");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(-700 * kDay), true) == "over 1 year ago");
    CHECK(formatRelativeEnglish(relativeBucketFromDiff(3 * 365 * kDay), false) == "about 3 years");
}

TEST_CASE("non-finite timestamps throw std::invalid_argument") {
    const double nan = std::numeric_limits<double>::quiet_NaN();
    const double inf = std::numeric_limits<double>::infinity();
    CHECK_THROWS_AS(relativeBucket(nan, 0), std::invalid_argument);
    CHECK_THROWS_AS(relativeBucket(0, nan), std::invalid_argument);
    CHECK_THROWS_AS(relativeBucket(inf, 0), std::invalid_argument);
    CHECK_THROWS_AS(relativeBucket(0, -inf), std::invalid_argument);
    CHECK_THROWS_AS(relativeBucketFromDiff(nan), std::invalid_argument);
    CHECK_THROWS_AS(relativeBucketFromDiff(inf), std::invalid_argument);
    // Two finite inputs whose difference overflows are rejected too.
    const double huge = std::numeric_limits<double>::max();
    CHECK_THROWS_AS(relativeBucket(huge, -huge), std::invalid_argument);
}

TEST_CASE("duration decomposition splits into d/h/m/s and truncates sub-seconds") {
    const DurationParts parts = decomposeDuration(kDay + 2 * kHour + 3 * kMinute + 4 * kSecond + 999);
    CHECK(parts.days == 1);
    CHECK(parts.hours == 2);
    CHECK(parts.minutes == 3);
    CHECK(parts.seconds == 4);
    CHECK(formatDurationEnglish(parts) == "1d 2h 3m 4s");

    CHECK(formatDurationEnglish(decomposeDuration(kHour)) == "1h 0m 0s");
    CHECK(formatDurationEnglish(decomposeDuration(90 * kSecond)) == "1m 30s");
    CHECK(formatDurationEnglish(decomposeDuration(0)) == "0s");
    CHECK(formatDurationEnglish(decomposeDuration(999)) == "0s");
}

TEST_CASE("negative durations format as their magnitude") {
    const DurationParts parts = decomposeDuration(-(2 * kHour + 30 * kMinute));
    CHECK(parts.days == 0);
    CHECK(parts.hours == 2);
    CHECK(parts.minutes == 30);
    CHECK(parts.seconds == 0);
    CHECK(formatDurationEnglish(parts) == "2h 30m 0s");
}

TEST_CASE("durations reject NaN/Inf and clamp to kMaxDurationMs") {
    const double nan = std::numeric_limits<double>::quiet_NaN();
    const double inf = std::numeric_limits<double>::infinity();
    CHECK_THROWS_AS(decomposeDuration(nan), std::invalid_argument);
    CHECK_THROWS_AS(decomposeDuration(inf), std::invalid_argument);
    CHECK_THROWS_AS(decomposeDuration(-inf), std::invalid_argument);

    const DurationParts atMax = decomposeDuration(kMaxDurationMs);
    const DurationParts beyondMax = decomposeDuration(std::numeric_limits<double>::max());
    const DurationParts beyondMin = decomposeDuration(-std::numeric_limits<double>::max());
    CHECK(atMax.days == beyondMax.days);
    CHECK(atMax.seconds == beyondMax.seconds);
    CHECK(atMax.days == beyondMin.days);
    CHECK(atMax.days == static_cast<int64_t>(kMaxDurationMs / kDay));
}

} // TEST_SUITE
