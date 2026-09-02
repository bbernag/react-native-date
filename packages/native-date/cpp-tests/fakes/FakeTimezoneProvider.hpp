#pragma once

#include "Providers.hpp"

#include <cstdint>
#include <map>
#include <string>
#include <vector>

namespace nativedate::test {

/**
 * Table-driven TimezoneProvider for host tests.
 *
 * Fixed-offset zones return a constant; DST zones carry a list of transitions
 * (UTC instant at which the offset changes) so a few real-world years can be
 * exercised deterministically without the platform tz database.
 */
class FakeTimezoneProvider final : public nativedate::core::TimezoneProvider {
public:
    struct Transition {
        int64_t atUtcMs;   // instant the new offset takes effect
        int offsetMinutes; // offset from this instant on
    };

    struct Zone {
        int standardOffsetMinutes;           // offset before the first transition
        std::vector<Transition> transitions; // sorted ascending by atUtcMs
    };

    FakeTimezoneProvider() {
        zones_["UTC"] = Zone{0, {}};
        zones_["Asia/Kolkata"] = Zone{330, {}};
        zones_["Asia/Tokyo"] = Zone{540, {}};
        zones_["Pacific/Honolulu"] = Zone{-600, {}};
        // America/New_York: EST (-300) / EDT (-240). Transitions are the real
        // 2023-2025 rules: 2nd Sunday of March 07:00 UTC, 1st Sunday of Nov 06:00 UTC.
        zones_["America/New_York"] = Zone{-300, {
            {1678604400000, -240}, // 2023-03-12T07:00:00Z
            {1699164000000, -300}, // 2023-11-05T06:00:00Z
            {1710054000000, -240}, // 2024-03-10T07:00:00Z
            {1730613600000, -300}, // 2024-11-03T06:00:00Z
            {1741503600000, -240}, // 2025-03-09T07:00:00Z
            {1762063200000, -300}, // 2025-11-02T06:00:00Z
        }};
        // Europe/Berlin: CET (+60) / CEST (+120), last Sunday of March/October 01:00 UTC.
        zones_["Europe/Berlin"] = Zone{60, {
            {1711846800000, 120}, // 2024-03-31T01:00:00Z
            {1729990800000, 60},  // 2024-10-27T01:00:00Z
        }};
    }

    std::optional<int> offsetMinutes(std::string_view zone, int64_t utcMs) const override {
        auto it = zones_.find(std::string(zone));
        if (it == zones_.end()) {
            return std::nullopt;
        }
        int offset = it->second.standardOffsetMinutes;
        for (const auto& transition : it->second.transitions) {
            if (utcMs >= transition.atUtcMs) {
                offset = transition.offsetMinutes;
            } else {
                break;
            }
        }
        return offset;
    }

    bool isValidZone(std::string_view zone) const override {
        return zones_.count(std::string(zone)) > 0;
    }

    std::string systemZone() const override {
        return systemZone_;
    }

    std::vector<std::string> availableZones() const override {
        std::vector<std::string> names;
        names.reserve(zones_.size());
        for (const auto& entry : zones_) {
            names.push_back(entry.first);
        }
        return names;
    }

    void setSystemZone(std::string zone) {
        systemZone_ = std::move(zone);
    }

private:
    std::map<std::string, Zone> zones_;
    std::string systemZone_ = "UTC";
};

} // namespace nativedate::test
