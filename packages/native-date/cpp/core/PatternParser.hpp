#pragma once

#include <string>

namespace nativedate::core {

/**
 * Parse a date string using a custom format pattern.
 * Supported tokens: yyyy, yy, MM, M, dd, d, HH, H, hh, h, mm, m, ss, s, SSS, a, A.
 * The result is interpreted as local time (like date-fns).
 * @return timestamp in milliseconds, or NaN when the string does not match
 */
double parseWithFormat(const std::string& dateString, const std::string& pattern);

} // namespace nativedate::core
