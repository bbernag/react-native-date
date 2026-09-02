#pragma once

#include "Providers.hpp"

#include <string>

namespace nativedate::core {

/**
 * Format a timestamp with a date-fns / dayjs style pattern.
 * Localized month and weekday names come from `locale`.
 * @param useUTC true to format the UTC wall clock, false for local time
 */
std::string formatInternal(double timestamp, const std::string& pattern, bool useUTC,
                           const LocaleProvider& locale);

/** Zero-pad `value` to `width` digits. */
std::string padZero(int value, int width = 2);

} // namespace nativedate::core
