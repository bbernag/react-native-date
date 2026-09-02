#pragma once

#include <string>

namespace nativedate::core {

/**
 * Parse an ISO-8601 date string ("YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss[.SSS][Z|±hh[:]mm]").
 * Strings without a timezone designator are interpreted as local time.
 * @throws std::invalid_argument when the string is too short to be a date
 */
double parseISO8601(const std::string& dateString);

} // namespace nativedate::core
