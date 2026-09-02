#pragma once

#include <cstdint>
#include <string>

namespace nativedate::core {

/**
 * Pure (Nitro-free, platform-free) unit selection for relative time and
 * duration formatting. Both platform helpers and the Jest mock must derive
 * the same (value, unit) from the same millisecond difference so that
 * `formatDistance` reports the same magnitude everywhere; only the words come
 * from the platform formatter.
 */

/** Calendar unit chosen for a relative-time bucket. */
enum class RelativeUnit {
    Minute,
    Hour,
    Day,
    Month,
    Year,
};

/**
 * Approximation word the date-fns-style table attaches to a bucket.
 * The English renderer spells it out ("about 2 hours", "less than a
 * minute", "over 1 year"); localized platform formatters drop it and render
 * the plain quantity ("2 hours").
 */
enum class RelativeQualifier {
    None,
    LessThan,
    About,
    Over,
};

enum class RelativeDirection {
    Past,
    Future,
};

struct RelativeBucket {
    int64_t value;
    RelativeUnit unit;
    RelativeQualifier qualifier;
    RelativeDirection direction;
};

/**
 * Choose the bucket for `timestamp - baseTimestamp` using the date-fns
 * `formatDistance` thresholds (seconds / minutes / hours / days are the
 * absolute difference; months = days / 30, years = days / 365; `round` is
 * half away from zero):
 *
 * | absolute difference       | value, unit         | qualifier |
 * |---------------------------|---------------------|-----------|
 * | < 30 s                    | 1 minute            | LessThan  |
 * | < 90 s                    | 1 minute            | None      |
 * | < 45 min                  | round(min) minutes  | None      |
 * | < 90 min                  | 1 hour              | About     |
 * | < 24 h                    | round(h) hours      | About     |
 * | < 42 h                    | 1 day               | None      |
 * | < 30 days                 | round(d) days       | None      |
 * | < 45 days                 | 1 month             | About     |
 * | < 365 days                | round(d / 30) months| None      |
 * | < 1.5 years               | 1 year              | About     |
 * | < 2.5 years               | 1 year              | Over      |
 * | otherwise                 | round(y) years      | About     |
 *
 * Direction is Future when the difference is strictly positive, Past
 * otherwise (a zero difference reads "less than a minute ago").
 *
 * @throws std::invalid_argument when either input, or their difference, is
 *         not a finite number.
 */
RelativeBucket relativeBucket(double timestamp, double baseTimestamp);

/** Same table applied to an already computed difference in milliseconds. */
RelativeBucket relativeBucketFromDiff(double diffMs);

/**
 * English rendering of a bucket, e.g. "about 2 hours" or, with `addSuffix`,
 * "about 2 hours ago" / "in about 2 hours". Used when no platform formatter
 * is available and by the Jest mock's reference behavior.
 */
std::string formatRelativeEnglish(const RelativeBucket& bucket, bool addSuffix);

/** Duration split into whole calendar-free components (24 h days). */
struct DurationParts {
    int64_t days;
    int64_t hours;
    int64_t minutes;
    int64_t seconds;
};

/**
 * Largest absolute duration `decomposeDuration` will represent, in
 * milliseconds. Equal to JavaScript's `Number.MAX_SAFE_INTEGER` so every
 * integral millisecond count a caller can pass exactly is representable;
 * larger magnitudes are clamped to it.
 */
constexpr double kMaxDurationMs = 9007199254740991.0;

/**
 * Split an absolute duration into days / hours / minutes / seconds.
 * Negative input is treated as its magnitude; sub-second precision is
 * truncated; magnitudes above `kMaxDurationMs` are clamped.
 *
 * @throws std::invalid_argument when `milliseconds` is NaN or infinite.
 */
DurationParts decomposeDuration(double milliseconds);

/**
 * English rendering with leading zero units dropped, e.g. "1d 2h 3m 4s",
 * "1h 0m 0s", "0s".
 */
std::string formatDurationEnglish(const DurationParts& parts);

} // namespace nativedate::core
