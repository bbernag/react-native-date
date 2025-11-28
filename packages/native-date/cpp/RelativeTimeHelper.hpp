#pragma once

#include <string>

namespace margelo::nitro::rnpackages_nativedate {

/**
 * Platform-specific relative time formatting helper
 * Uses RelativeDateTimeFormatter on iOS and android.icu.text.RelativeDateTimeFormatter on Android
 * Falls back to English strings if platform API is unavailable
 */
class RelativeTimeHelper {
public:
    /**
     * Format the distance between two timestamps in human-readable format
     * Uses the current locale set via LocaleHelper::setLocale()
     *
     * @param timestamp The date to compare (milliseconds since epoch)
     * @param baseTimestamp The date to compare against (milliseconds since epoch)
     * @param addSuffix Whether to add "ago" or "in" suffix
     * @return Localized distance string (e.g., "2 hours ago", "hace 2 horas")
     */
    static std::string formatDistance(double timestamp, double baseTimestamp, bool addSuffix);

    /**
     * Format a duration in milliseconds to human-readable format
     * Uses the current locale set via LocaleHelper::setLocale()
     *
     * @param milliseconds Duration in milliseconds
     * @return Localized duration string (e.g., "2h 30m 15s")
     */
    static std::string formatDuration(double milliseconds);

private:
    /**
     * Fallback English implementation when platform API is unavailable
     */
    static std::string formatDistanceEnglish(double diffMs, bool addSuffix);
    static std::string formatDurationEnglish(double milliseconds);
};

} // namespace margelo::nitro::rnpackages_nativedate
