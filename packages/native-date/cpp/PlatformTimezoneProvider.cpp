#include "PlatformTimezoneProvider.hpp"

#include "TimezoneHelper.hpp"
#include "core/ZoneNames.hpp"

namespace margelo::nitro::rnpackages_nativedate {

std::optional<int> PlatformTimezoneProvider::offsetMinutes(std::string_view zone, int64_t utcMs) const {
    // The core hands over normalized names (ZoneMath resolves them once per
    // call) and the helper never substitutes another zone, so an unknown name
    // comes back as std::nullopt.
    return TimezoneHelper::getOffsetForTimestamp(std::string(zone), utcMs);
}

bool PlatformTimezoneProvider::isValidZone(std::string_view zone) const {
    // Reached directly from the public isValidTimezone(), so accept the same
    // spellings the math APIs accept: UTC aliases and known abbreviations.
    std::string normalized = nativedate::core::ZoneNames::normalize(zone);
    if (normalized == nativedate::core::ZoneNames::kUtc) {
        return true;
    }
    if (!nativedate::core::ZoneNames::isWellFormed(normalized)) {
        return false;
    }
    return TimezoneHelper::isValidTimezone(normalized);
}

std::string PlatformTimezoneProvider::systemZone() const {
    return TimezoneHelper::getSystemTimezone();
}

std::vector<std::string> PlatformTimezoneProvider::availableZones() const {
    return TimezoneHelper::getAvailableTimezones();
}

} // namespace margelo::nitro::rnpackages_nativedate
