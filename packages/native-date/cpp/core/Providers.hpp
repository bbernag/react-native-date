#pragma once

#include <cstdint>
#include <optional>
#include <string>
#include <string_view>
#include <vector>

// Provider interfaces that the Nitro-free core depends on.
//
// The platform layer (NSTimeZone / java.time on the device, table-driven fakes in
// the host unit tests) implements these; the core never touches platform APIs
// or Nitro headers directly.

namespace nativedate::core {

/**
 * Source of IANA timezone data.
 */
struct TimezoneProvider {
    virtual ~TimezoneProvider() = default;

    /**
     * UTC offset in minutes (positive = east of UTC) for `zone` at `utcMs`.
     * Returns std::nullopt when the zone is unknown.
     */
    virtual std::optional<int> offsetMinutes(std::string_view zone, int64_t utcMs) const = 0;

    /** Whether `zone` is a timezone identifier the platform recognises. */
    virtual bool isValidZone(std::string_view zone) const = 0;

    /** The device's current timezone identifier, e.g. "America/Los_Angeles". */
    virtual std::string systemZone() const = 0;

    /** Every timezone identifier the platform knows. */
    virtual std::vector<std::string> availableZones() const = 0;
};

/**
 * Length of a localized month or weekday name.
 */
enum class NameForm {
    Full,        // "January", "Sunday"
    Abbreviated, // "Jan", "Sun"
    Short,       // "Su" (weekdays only; months fall back to Abbreviated)
    Narrow,      // "J", "S"
};

/**
 * Source of localized calendar names.
 */
struct LocaleProvider {
    virtual ~LocaleProvider() = default;

    /** Name of `month` (1 = January .. 12 = December) in the given form. */
    virtual std::string monthName(int month, NameForm form) const = 0;

    /** Name of `dayOfWeek` (0 = Sunday .. 6 = Saturday) in the given form. */
    virtual std::string dayName(int dayOfWeek, NameForm form) const = 0;

    /** The locale code the names are drawn from, e.g. "en", "es". */
    virtual std::string currentLocale() const = 0;
};

} // namespace nativedate::core
