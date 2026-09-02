#pragma once

#include <cstdint>
#include <optional>
#include <string>
#include <vector>

namespace margelo::nitro::rnpackages_nativedate {

/**
 * Platform timezone helper: NSTimeZone on iOS, java.util.TimeZone on Android.
 * Both are backed by the full IANA database with DST rules.
 *
 * Every method expects an already-normalized IANA identifier (see
 * core/ZoneNames.hpp): the helper never maps abbreviations and never
 * substitutes the system zone or GMT for a name it does not know.
 *
 * Both implementations keep a small, mutex-guarded cache of platform zone
 * objects keyed by identifier, so repeated lookups of the same zone cost one
 * offset query rather than a name resolution.
 */
class TimezoneHelper {
public:
    /**
     * The device's current timezone identifier (IANA name),
     * e.g. "America/Los_Angeles". Cached for about one second.
     */
    static std::string getSystemTimezone();

    /**
     * UTC offset in minutes for `ianaZone` at `timestampMs`, DST included
     * (positive = east of UTC). std::nullopt when the platform does not know
     * the zone.
     */
    static std::optional<int> getOffsetForTimestamp(const std::string& ianaZone, int64_t timestampMs);

    /** Every timezone identifier the platform knows. */
    static std::vector<std::string> getAvailableTimezones();

    /** Whether the platform recognises `ianaZone`. */
    static bool isValidTimezone(const std::string& ianaZone);
};

} // namespace margelo::nitro::rnpackages_nativedate
