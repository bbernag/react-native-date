#include "PatternParser.hpp"

#include "Civil.hpp"

#include <cstddef>
#include <limits>
#include <stdexcept>

namespace nativedate::core {

namespace {

constexpr double kNaN = std::numeric_limits<double>::quiet_NaN();

// Input caps (B-07): parsing runs synchronously on the JS thread, so bound the
// work. Both are far above any realistic date string or pattern.
constexpr std::size_t kMaxDateStringLength = 256;
constexpr std::size_t kMaxPatternLength = 128;

inline bool isAsciiDigit(char c) {
    return c >= '0' && c <= '9';
}

inline char toLowerAscii(char c) {
    return (c >= 'A' && c <= 'Z') ? static_cast<char>(c + ('a' - 'A')) : c;
}

// Read exactly `count` digits at `s[pos]`, advancing `pos`. Fails when the
// input is too short or a non-digit is found.
bool readFixedDigits(const std::string& s, std::size_t& pos, std::size_t count, int& out) {
    if (pos + count > s.size()) return false;
    int value = 0;
    for (std::size_t i = 0; i < count; ++i) {
        const char c = s[pos + i];
        if (!isAsciiDigit(c)) return false;
        value = value * 10 + (c - '0');
    }
    out = value;
    pos += count;
    return true;
}

// Read 1..`maxDigits` digits at `s[pos]`, advancing `pos`. Fails on zero digits
// and when a digit follows the last permitted one ("999" for a 2-digit token),
// so a run of digits can never silently overflow (B-03).
bool readVariableDigits(const std::string& s, std::size_t& pos, std::size_t maxDigits, int& out) {
    int value = 0;
    std::size_t digits = 0;
    while (pos < s.size() && isAsciiDigit(s[pos])) {
        if (digits == maxDigits) return false;
        value = value * 10 + (s[pos] - '0');
        digits++;
        pos++;
    }
    if (digits == 0) return false;
    out = value;
    return true;
}

// Match an AM/PM marker in any of the forms the formatter emits:
// "a"/"p" (`a`), "am"/"pm" (`aa`), "a.m."/"p.m." (`aaa`), "AM"/"PM" (`A`),
// case-insensitively. Every marker token accepts every form.
bool readAmPm(const std::string& s, std::size_t& pos, bool& isPM) {
    if (pos >= s.size()) return false;
    const char first = toLowerAscii(s[pos]);
    if (first != 'a' && first != 'p') return false;
    isPM = (first == 'p');
    pos++;
    if (pos < s.size() && s[pos] == '.') {
        // "a.m." / "p.m."
        if (pos + 2 < s.size() && toLowerAscii(s[pos + 1]) == 'm' && s[pos + 2] == '.') {
            pos += 3;
            return true;
        }
        return false;
    }
    if (pos < s.size() && toLowerAscii(s[pos]) == 'm') {
        pos++;
    }
    return true;
}

// Number of consecutive occurrences of `c` at `pattern[pos]`, capped at `max`.
std::size_t runLength(const std::string& pattern, std::size_t pos, char c, std::size_t max) {
    std::size_t n = 0;
    while (n < max && pos + n < pattern.size() && pattern[pos + n] == c) {
        n++;
    }
    return n;
}

} // namespace

// Token table (mirrors Formatter.cpp; parsing needs no locale, so the name
// tokens the formatter emits are rejected rather than guessed):
//
//   yyyy YYYY  4-digit year (0000-9999)      hh h   hour 01-12 (2 / 1-2 digits)
//   yy   YY    2-digit year (70-99 → 19xx,   mm m   minute 00-59
//              00-69 → 20xx)                 ss s   second 00-59
//   MM   M     month 01-12 (note: the      SSS    millisecond 000-999
//              formatter's `M` is the narrow month NAME, so it does not round-trip)
//   dd   DD    day 01..daysInMonth           a aa aaa A  AM/PM marker
//   d    D     day 1..daysInMonth (1-2 dig.) 'text' [text] ''  literals
//   HH   H     hour 00-23
//   MMM MMMM ddd dddd E EE EEE EEEE  → not supported: NaN
//   any other character                → must match the input literally
//
// Rules:
// - Fixed-width tokens (`yyyy`, `MM`, `dd`, `HH`, `hh`, `mm`, `ss`, `SSS`, ...)
//   require exactly that many digits. Variable-width tokens (`M`, `d`, `H`,
//   `h`, `m`, `s`) read one or two digits and fail if a third follows (B-03).
// - The whole pattern AND the whole input must be consumed; a trailing suffix
//   or a truncated input yields NaN. No prefix parsing (C-05). Components whose
//   token the pattern omits keep their default (1970-01-01 00:00:00.000).
// - `hh`/`h` require 1-12. When no `a`/`A` marker appears the hour is taken as
//   AM (12 → 00), matching date-fns (C-14).
// - The result is local wall-clock time; there is no zone/offset token.
double parseWithFormat(const std::string& dateString, const std::string& pattern) {
    if (dateString.size() > kMaxDateStringLength) {
        throw std::invalid_argument("parseFormat: date string longer than 256 characters");
    }
    if (pattern.size() > kMaxPatternLength) {
        throw std::invalid_argument("parseFormat: pattern longer than 128 characters");
    }

    InternalDateComponents dc = {1970, 1, 1, 0, 0, 0, 0, 0};
    bool hasHour12 = false;
    bool isPM = false;

    std::size_t datePos = 0;
    std::size_t patternPos = 0;
    const std::size_t dateLen = dateString.length();
    const std::size_t patternLen = pattern.length();

    while (patternPos < patternLen) {
        const char c = pattern[patternPos];

        // Escaped text with brackets [text] (dayjs style)
        if (c == '[') {
            patternPos++;
            while (patternPos < patternLen && pattern[patternPos] != ']') {
                if (datePos >= dateLen || dateString[datePos] != pattern[patternPos]) return kNaN;
                datePos++;
                patternPos++;
            }
            if (patternPos < patternLen) patternPos++; // closing ']'
            continue;
        }

        // Escaped text with single quotes 'text' (date-fns style); '' is a literal quote
        if (c == '\'') {
            patternPos++;
            if (patternPos < patternLen && pattern[patternPos] == '\'') {
                if (datePos >= dateLen || dateString[datePos] != '\'') return kNaN;
                datePos++;
                patternPos++;
                continue;
            }
            while (patternPos < patternLen) {
                if (pattern[patternPos] == '\'') {
                    if (patternPos + 1 < patternLen && pattern[patternPos + 1] == '\'') {
                        if (datePos >= dateLen || dateString[datePos] != '\'') return kNaN;
                        datePos++;
                        patternPos += 2;
                        continue;
                    }
                    patternPos++;
                    break;
                }
                if (datePos >= dateLen || dateString[datePos] != pattern[patternPos]) return kNaN;
                datePos++;
                patternPos++;
            }
            continue;
        }

        // Fast token matching using first character switch (same shape as
        // formatInternal); `run` is the length of the token's character run.
        const std::size_t run = runLength(pattern, patternPos, c, 4);
        bool matched = true;

        switch (c) {
            case 'y':
            case 'Y':
                if (run >= 4) {
                    if (!readFixedDigits(dateString, datePos, 4, dc.year)) return kNaN;
                    patternPos += 4;
                } else if (run >= 2) {
                    int year2 = 0;
                    if (!readFixedDigits(dateString, datePos, 2, year2)) return kNaN;
                    dc.year = (year2 >= 70) ? 1900 + year2 : 2000 + year2;
                    patternPos += 2;
                } else {
                    matched = false;
                }
                break;

            case 'M':
                if (run >= 3) return kNaN; // month names need a locale
                if (run == 2) {
                    if (!readFixedDigits(dateString, datePos, 2, dc.month)) return kNaN;
                    patternPos += 2;
                } else {
                    if (!readVariableDigits(dateString, datePos, 2, dc.month)) return kNaN;
                    patternPos++;
                }
                break;

            case 'd':
                if (run >= 3) return kNaN; // weekday names need a locale
                [[fallthrough]];
            case 'D':
                if (run >= 2) {
                    if (!readFixedDigits(dateString, datePos, 2, dc.day)) return kNaN;
                    patternPos += 2;
                } else {
                    if (!readVariableDigits(dateString, datePos, 2, dc.day)) return kNaN;
                    patternPos++;
                }
                break;

            case 'E':
                return kNaN; // weekday names need a locale

            case 'H':
                if (run >= 2) {
                    if (!readFixedDigits(dateString, datePos, 2, dc.hour)) return kNaN;
                    patternPos += 2;
                } else {
                    if (!readVariableDigits(dateString, datePos, 2, dc.hour)) return kNaN;
                    patternPos++;
                }
                break;

            case 'h':
                hasHour12 = true;
                if (run >= 2) {
                    if (!readFixedDigits(dateString, datePos, 2, dc.hour)) return kNaN;
                    patternPos += 2;
                } else {
                    if (!readVariableDigits(dateString, datePos, 2, dc.hour)) return kNaN;
                    patternPos++;
                }
                break;

            case 'm':
                if (run >= 2) {
                    if (!readFixedDigits(dateString, datePos, 2, dc.minute)) return kNaN;
                    patternPos += 2;
                } else {
                    if (!readVariableDigits(dateString, datePos, 2, dc.minute)) return kNaN;
                    patternPos++;
                }
                break;

            case 's':
                if (run >= 2) {
                    if (!readFixedDigits(dateString, datePos, 2, dc.second)) return kNaN;
                    patternPos += 2;
                } else {
                    if (!readVariableDigits(dateString, datePos, 2, dc.second)) return kNaN;
                    patternPos++;
                }
                break;

            case 'S':
                if (run >= 3) {
                    if (!readFixedDigits(dateString, datePos, 3, dc.millisecond)) return kNaN;
                    patternPos += 3;
                } else {
                    matched = false;
                }
                break;

            case 'A':
                if (!readAmPm(dateString, datePos, isPM)) return kNaN;
                patternPos++;
                break;

            case 'a':
                if (!readAmPm(dateString, datePos, isPM)) return kNaN;
                patternPos += run > 3 ? 3 : run;
                break;

            default:
                matched = false;
                break;
        }

        // No token matched - expect literal character match
        if (!matched) {
            if (datePos >= dateLen || dateString[datePos] != c) return kNaN;
            datePos++;
            patternPos++;
        }
    }

    // The whole input must be consumed (no prefix parsing)
    if (datePos != dateLen) return kNaN;

    // Convert 12-hour to 24-hour; without a marker the hour is AM
    if (hasHour12) {
        if (dc.hour < 1 || dc.hour > 12) return kNaN;
        if (isPM && dc.hour != 12) {
            dc.hour += 12;
        } else if (!isPM && dc.hour == 12) {
            dc.hour = 0;
        }
    }

    // Validate components
    if (dc.month < 1 || dc.month > 12) return kNaN;
    if (dc.day < 1 || dc.day > daysInMonth(dc.year, dc.month)) return kNaN;
    if (dc.hour < 0 || dc.hour > 23) return kNaN;
    if (dc.minute < 0 || dc.minute > 59) return kNaN;
    if (dc.second < 0 || dc.second > 59) return kNaN;
    if (dc.millisecond < 0 || dc.millisecond > 999) return kNaN;

    // No timezone in format patterns - interpret as local time (like date-fns)
    return componentsToTimestampLocal(dc);
}

} // namespace nativedate::core
