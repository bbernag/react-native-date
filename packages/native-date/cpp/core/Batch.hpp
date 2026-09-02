#pragma once

#include "Civil.hpp"
#include "Providers.hpp"

#include <cstddef>
#include <optional>
#include <stdexcept>
#include <string>
#include <vector>

// Nitro-free batch loops behind parseManyAsync / formatManyAsync /
// getComponentsManyAsync. The Promise wrapper stays in HybridNativeDate;
// these functions are the work the worker thread runs (value-captured inputs,
// no HybridObject). Locale names are read through LocaleProvider, which on
// device is a LocaleStore snapshot (thread-safe after the locale-cache fix).

namespace nativedate::core {

/**
 * Largest vector the batch APIs accept. Larger inputs throw
 * std::invalid_argument so a single call cannot pin the Nitro thread pool
 * (B-07). 100 000 elements is well above any realistic UI list and still
 * cheap to allocate.
 */
inline constexpr std::size_t kMaxBatchSize = 100000;

/**
 * Longest format pattern the batch formatter accepts. Same cap as
 * parseWithFormat (128 characters) so a hostile pattern cannot turn one
 * async call into unbounded token work (B-07).
 */
inline constexpr std::size_t kMaxFormatPatternLength = 128;

/** Throws std::invalid_argument when `count` is above kMaxBatchSize. */
inline void requireBatchSize(std::size_t count) {
    if (count > kMaxBatchSize) {
        throw std::invalid_argument("batch size exceeds 100000 elements");
    }
}

/** Throws std::invalid_argument when `pattern` is longer than kMaxFormatPatternLength. */
inline void requireFormatPattern(const std::string& pattern) {
    if (pattern.size() > kMaxFormatPatternLength) {
        throw std::invalid_argument("formatMany: pattern longer than 128 characters");
    }
}

/**
 * Parse each ISO-8601 string with parseISO8601. Invalid elements become NaN;
 * order is preserved. Throws when the vector is larger than kMaxBatchSize.
 */
std::vector<double> parseMany(const std::vector<std::string>& dateStrings);

/**
 * Format each timestamp with formatInternal in local time (same tokens,
 * quotes, brackets, and locale names as format()). Non-finite or out-of-range
 * timestamps become an empty string; order is preserved.
 *
 * @throws std::invalid_argument when the vector is larger than kMaxBatchSize
 *         or `pattern` is longer than kMaxFormatPatternLength
 */
std::vector<std::string> formatMany(const std::vector<double>& timestamps, const std::string& pattern,
                                    const LocaleProvider& locale);

/**
 * Local-time components for each timestamp. Invalid (non-finite or
 * out-of-range) elements are nullopt so the adapter can emit NaN fields.
 * Throws when the vector is larger than kMaxBatchSize.
 */
std::vector<std::optional<InternalDateComponents>> getComponentsMany(const std::vector<double>& timestamps);

} // namespace nativedate::core
