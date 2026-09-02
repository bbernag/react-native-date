#pragma once

#include "core/Providers.hpp"

namespace margelo::nitro::rnpackages_nativedate {

/**
 * TimezoneProvider backed by the platform TimezoneHelper
 * (NSTimeZone on iOS, java.time on Android).
 */
class PlatformTimezoneProvider final : public nativedate::core::TimezoneProvider {
public:
    std::optional<int> offsetMinutes(std::string_view zone, int64_t utcMs) const override;
    bool isValidZone(std::string_view zone) const override;
    std::string systemZone() const override;
    std::vector<std::string> availableZones() const override;
};

} // namespace margelo::nitro::rnpackages_nativedate
