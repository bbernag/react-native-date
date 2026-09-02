#pragma once

#include <array>
#include <cstddef>
#include <string>
#include <string_view>

// Timezone-name normalization shared by the core and both platform helpers.
//
// Header-only on purpose: the platform build lists (android/CMakeLists.txt,
// the podspec glob) pick it up without a new translation unit.
//
// The abbreviation table is deliberately small and US-centric. Abbreviations
// are ambiguous in the real world ("IST" is India, Israel and Ireland; "CST"
// is US Central and China Standard) so callers should prefer IANA identifiers
// such as "America/New_York". The table exists for backwards compatibility.

namespace nativedate::core::ZoneNames {

/** Canonical spelling of UTC that the core treats as offset 0 without a lookup. */
inline constexpr std::string_view kUtc = "UTC";

/**
 * Longest zone name accepted anywhere. The longest IANA identifier is 32
 * characters ("America/Argentina/ComodRivadavia"); 64 leaves headroom and keeps
 * error messages and JNI strings bounded.
 */
inline constexpr std::size_t kMaxNameLength = 64;

struct Abbreviation {
    std::string_view abbreviation; // uppercase
    std::string_view iana;
};

/**
 * Abbreviation -> IANA identifier. Lookup is case-insensitive.
 *
 * GMT and WET map to the fixed-offset "Etc/GMT" (never DST) so the result is
 * identical on every platform; "Europe/London" observes BST in summer.
 */
inline constexpr std::array<Abbreviation, 33> kAbbreviations{{
    // US
    {"EST", "America/New_York"},
    {"EDT", "America/New_York"},
    {"CST", "America/Chicago"},
    {"CDT", "America/Chicago"},
    {"MST", "America/Denver"},
    {"MDT", "America/Denver"},
    {"PST", "America/Los_Angeles"},
    {"PDT", "America/Los_Angeles"},
    {"AKST", "America/Anchorage"},
    {"AKDT", "America/Anchorage"},
    {"HST", "Pacific/Honolulu"},
    // Europe
    {"GMT", "Etc/GMT"},
    {"WET", "Etc/GMT"},
    {"BST", "Europe/London"},
    {"WEST", "Europe/London"},
    {"CET", "Europe/Paris"},
    {"CEST", "Europe/Paris"},
    {"EET", "Europe/Helsinki"},
    {"EEST", "Europe/Helsinki"},
    {"MSK", "Europe/Moscow"},
    // Asia
    {"IST", "Asia/Kolkata"},
    {"JST", "Asia/Tokyo"},
    {"KST", "Asia/Seoul"},
    {"HKT", "Asia/Hong_Kong"},
    {"SGT", "Asia/Singapore"},
    {"ICT", "Asia/Bangkok"},
    // Australia
    {"AEST", "Australia/Sydney"},
    {"AEDT", "Australia/Sydney"},
    {"ACST", "Australia/Adelaide"},
    {"ACDT", "Australia/Adelaide"},
    {"AWST", "Australia/Perth"},
    // New Zealand
    {"NZST", "Pacific/Auckland"},
    {"NZDT", "Pacific/Auckland"},
}};
// Catches an array size that no longer matches the initializer count (extra
// slots would be value-initialized to empty entries).
static_assert(!kAbbreviations.back().abbreviation.empty(), "kAbbreviations size must equal its entry count");

/**
 * Whether `name` looks like a zone identifier: 1..kMaxNameLength characters,
 * each in [A-Za-z0-9_/+-]. Every IANA identifier passes; anything that fails is
 * rejected before it reaches a platform API (the ASCII subset is also valid
 * JNI modified UTF-8, which NewStringUTF requires).
 */
inline bool isWellFormed(std::string_view name) {
    if (name.empty() || name.size() > kMaxNameLength) {
        return false;
    }
    for (char c : name) {
        bool ok = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ||
                  c == '_' || c == '/' || c == '+' || c == '-';
        if (!ok) {
            return false;
        }
    }
    return true;
}

/** ASCII case-insensitive equality. */
inline bool equalsIgnoreCase(std::string_view a, std::string_view b) {
    if (a.size() != b.size()) {
        return false;
    }
    for (std::size_t i = 0; i < a.size(); ++i) {
        char x = a[i];
        char y = b[i];
        if (x >= 'a' && x <= 'z') x = static_cast<char>(x - 'a' + 'A');
        if (y >= 'a' && y <= 'z') y = static_cast<char>(y - 'a' + 'A');
        if (x != y) {
            return false;
        }
    }
    return true;
}

/** "UTC", "utc", "Etc/UTC", "Z" (any case) all mean UTC. */
inline bool isUtcAlias(std::string_view name) {
    return equalsIgnoreCase(name, kUtc) || equalsIgnoreCase(name, "Etc/UTC") || equalsIgnoreCase(name, "Z");
}

/**
 * Map an abbreviation or alias to its canonical name.
 *
 * - UTC aliases become kUtc ("UTC").
 * - Known abbreviations (case-insensitive) become their IANA identifier.
 * - Anything else is returned unchanged; the caller decides whether it is a
 *   valid identifier (TimezoneProvider::isValidZone).
 */
inline std::string normalize(std::string_view name) {
    if (name.empty() || name.size() > kMaxNameLength) {
        return std::string(name);
    }
    if (isUtcAlias(name)) {
        return std::string(kUtc);
    }
    if (name.size() <= 4) { // every table key is at most 4 characters
        for (const Abbreviation& entry : kAbbreviations) {
            if (equalsIgnoreCase(entry.abbreviation, name)) {
                return std::string(entry.iana);
            }
        }
    }
    return std::string(name);
}

} // namespace nativedate::core::ZoneNames
