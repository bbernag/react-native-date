#include "PlatformTimezoneProvider.hpp"

#include "TimezoneHelper.hpp"

namespace margelo::nitro::rnpackages_nativedate {

std::optional<int> PlatformTimezoneProvider::offsetMinutes(std::string_view zone, int64_t utcMs) const {
    // TimezoneHelper normalizes abbreviations itself and falls back to the
    // system zone for unknown names, so the result is always engaged.
    return TimezoneHelper::getOffsetForTimestamp(std::string(zone), utcMs);
}

bool PlatformTimezoneProvider::isValidZone(std::string_view zone) const {
    return TimezoneHelper::isValidTimezone(std::string(zone));
}

std::string PlatformTimezoneProvider::systemZone() const {
    return TimezoneHelper::getSystemTimezone();
}

std::vector<std::string> PlatformTimezoneProvider::availableZones() const {
    return TimezoneHelper::getAvailableTimezones();
}

} // namespace margelo::nitro::rnpackages_nativedate
