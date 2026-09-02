#include "Batch.hpp"

#include "Formatter.hpp"
#include "IsoParser.hpp"

#include <limits>

namespace nativedate::core {

namespace {
constexpr double kNaN = std::numeric_limits<double>::quiet_NaN();
} // namespace

std::vector<double> parseMany(const std::vector<std::string>& dateStrings) {
    requireBatchSize(dateStrings.size());

    std::vector<double> results;
    results.reserve(dateStrings.size());

    for (const auto& dateString : dateStrings) {
        try {
            results.push_back(parseISO8601(dateString));
        } catch (...) {
            // Per-element NaN: one bad string must not fail the batch (Q3).
            results.push_back(kNaN);
        }
    }

    return results;
}

std::vector<std::string> formatMany(const std::vector<double>& timestamps, const std::string& pattern,
                                    const LocaleProvider& locale) {
    requireBatchSize(timestamps.size());
    requireFormatPattern(pattern);

    std::vector<std::string> results;
    results.reserve(timestamps.size());

    for (double timestamp : timestamps) {
        if (!isValidTimestamp(timestamp)) {
            // Batch contract: numbers that cannot be formatted yield ""
            // (the numeric sibling APIs yield NaN).
            results.emplace_back();
            continue;
        }
        results.push_back(formatInternal(timestamp, pattern, false, locale));
    }

    return results;
}

std::vector<std::optional<InternalDateComponents>> getComponentsMany(const std::vector<double>& timestamps) {
    requireBatchSize(timestamps.size());

    std::vector<std::optional<InternalDateComponents>> results;
    results.reserve(timestamps.size());

    for (double timestamp : timestamps) {
        if (!isValidTimestamp(timestamp)) {
            results.emplace_back(std::nullopt);
            continue;
        }
        results.emplace_back(timestampToComponents(timestamp, false));
    }

    return results;
}

} // namespace nativedate::core
