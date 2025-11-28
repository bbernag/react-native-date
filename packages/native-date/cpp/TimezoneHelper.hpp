#pragma once

#include <string>
#include <vector>
#include <cstdint>

namespace margelo::nitro::rnpackages_nativedate {

/**
 * Platform-specific timezone helper
 * Uses NSTimeZone on iOS and java.time.ZoneId on Android
 * Both platforms have full IANA timezone database with DST rules
 */
class TimezoneHelper {
public:
    /**
     * Get the device's current timezone identifier (IANA name)
     * e.g., "America/Los_Angeles", "Europe/Paris"
     */
    static std::string getSystemTimezone();

    /**
     * Get the UTC offset in minutes for a specific timezone at a specific timestamp
     * This properly handles DST transitions
     *
     * @param timezone IANA timezone name (e.g., "America/Los_Angeles")
     * @param timestampMs Unix timestamp in milliseconds
     * @return Offset in minutes (positive = east of UTC, negative = west)
     */
    static int getOffsetForTimestamp(const std::string& timezone, int64_t timestampMs);

    /**
     * Get all available timezone identifiers
     * @return Vector of IANA timezone names
     */
    static std::vector<std::string> getAvailableTimezones();

    /**
     * Check if a timezone identifier is valid
     * @param timezone IANA timezone name to validate
     * @return true if the timezone is recognized by the system
     */
    static bool isValidTimezone(const std::string& timezone);

    /**
     * Normalize timezone abbreviations to IANA names
     * e.g., "PST" -> "America/Los_Angeles"
     * If already an IANA name, returns as-is
     */
    static std::string normalizeTimezone(const std::string& timezone);
};

} // namespace margelo::nitro::rnpackages_nativedate
