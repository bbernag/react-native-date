#pragma once

#include <string>

namespace margelo::nitro::rnpackages_nativedate {

/**
 * Platform-specific relative time formatting helper.
 *
 * Unit selection lives in the pure core (`core/RelativeBuckets.hpp`) so iOS,
 * Android, and the Jest mock agree on the magnitude; this class only turns
 * the chosen (value, unit) into localized words. iOS uses
 * NSRelativeDateTimeFormatter / NSDateComponentsFormatter, Android uses
 * android.icu.text.RelativeDateTimeFormatter / MeasureFormat, and both fall
 * back to the core's English rendering when the platform API is unavailable.
 */
class RelativeTimeHelper {
public:
    /**
     * Format the distance between two timestamps in human-readable format
     * Uses the current locale set via LocaleHelper::setLocale()
     *
     * @param timestamp The date to compare (milliseconds since epoch)
     * @param baseTimestamp The date to compare against (milliseconds since epoch)
     * @param addSuffix Whether to add the direction ("2 hours ago" / "in 2 hours");
     *        when false the bare quantity is returned ("2 hours")
     * @return Localized distance string (e.g., "2 hours ago", "hace 2 horas")
     * @throws std::invalid_argument when either timestamp is NaN or infinite
     */
    static std::string formatDistance(double timestamp, double baseTimestamp, bool addSuffix);

    /**
     * Format a duration in milliseconds to human-readable format
     * Uses the current locale set via LocaleHelper::setLocale()
     *
     * Negative durations format as their magnitude; magnitudes above
     * `nativedate::core::kMaxDurationMs` are clamped.
     *
     * @param milliseconds Duration in milliseconds
     * @return Localized duration string (e.g., "2h 30m 15s")
     * @throws std::invalid_argument when `milliseconds` is NaN or infinite
     */
    static std::string formatDuration(double milliseconds);
};

} // namespace margelo::nitro::rnpackages_nativedate
