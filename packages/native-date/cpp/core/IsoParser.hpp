#pragma once

#include <string>

namespace nativedate::core {

/**
 * Parse an ISO-8601 date string strictly.
 *
 * Accepted forms (every separator and range is validated):
 *   "YYYY-MM-DD"
 *   "YYYY-MM-DD(T| )HH:mm[:ss[.S{1,9}]]"
 * each optionally followed by an offset designator: "Z", "±hh:mm", "±hhmm" or "±hh".
 *
 * - Year 0000-9999, month 01-12, day 01..daysInMonth; hour 00-23 ("24:00" is
 *   rejected), minute/second 00-59; offset hours 00-23, minutes 00-59.
 * - Fractional seconds are truncated (not rounded) to milliseconds.
 * - Strings with a designator are absolute instants; strings without one,
 *   including the date-only form, are interpreted as LOCAL wall-clock time.
 * - Input longer than 128 characters is rejected.
 *
 * @throws std::invalid_argument on any other input; the message quotes at most
 *         the first 64 characters of the input.
 */
double parseISO8601(const std::string& dateString);

} // namespace nativedate::core
