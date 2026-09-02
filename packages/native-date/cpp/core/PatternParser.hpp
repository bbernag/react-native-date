#pragma once

#include <string>

namespace nativedate::core {

/**
 * Parse a date string using a custom format pattern (strict).
 *
 * Tokens: yyyy/YYYY, yy/YY, MM, M, dd/DD, d/D, HH, H, hh, h, mm, m, ss, s, SSS,
 * a/aa/aaa/A; 'text', [text] and '' are literals; any other character must
 * match the input verbatim. Name tokens (MMM, MMMM, ddd, dddd, E...) are not
 * supported and yield NaN.
 *
 * - Fixed-width tokens require exactly that many digits; variable-width
 *   tokens (M, d, H, h, m, s) read 1-2 digits and fail on a third.
 * - The whole pattern and the whole input must be consumed (no prefix
 *   parsing). Components whose token is absent keep 1970-01-01 00:00:00.000.
 * - Ranges: month 1-12, day 1..daysInMonth, HH/H 0-23, hh/h 1-12 (AM when no
 *   marker is present), minute/second 0-59, millisecond 0-999.
 * - The result is interpreted as local time (like date-fns).
 *
 * @return timestamp in milliseconds, or NaN when the string does not match
 * @throws std::invalid_argument when `dateString` exceeds 256 or `pattern`
 *         exceeds 128 characters (the message does not echo the input)
 */
double parseWithFormat(const std::string& dateString, const std::string& pattern);

} // namespace nativedate::core
