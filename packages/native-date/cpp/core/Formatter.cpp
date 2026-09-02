#include "Formatter.hpp"

#include "Civil.hpp"

#include <iomanip>
#include <sstream>

namespace nativedate::core {

// Token table (the parser in PatternParser.cpp mirrors this):
//   yyyy YYYY  zero-padded year (wider or signed outside 0000-9999)
//   yy   YY    last two digits of the year
//   MMMM MMM   full / abbreviated month name (locale)
//   MM   M     zero-padded month / narrow month name (locale)
//   dddd ddd   full / abbreviated weekday name (locale)
//   dd   DD    zero-padded day          d D   day
//   EEEE EEE EE E  full / abbreviated / short / narrow weekday name (locale)
//   HH   H     hour 00-23               hh h  hour 01-12
//   mm   m     minute                   ss s  second
//   SSS        millisecond 000-999
//   A          "AM"/"PM"                a aa aaa  "a"/"p", "am"/"pm", "a.m."/"p.m."
//   'text' [text] ''  literals; any other character is copied verbatim.

// Fast inline number to string (no std::to_string overhead); handles any int.
inline void appendInt(std::string& s, int value) {
    if (value >= 0 && value < 10) {
        s += static_cast<char>('0' + value);
    } else if (value >= 10 && value < 100) {
        s += static_cast<char>('0' + value / 10);
        s += static_cast<char>('0' + value % 10);
    } else {
        // Fallback for larger and negative numbers
        char buf[12];
        int i = 0;
        unsigned v = value < 0 ? 0u - static_cast<unsigned>(value) : static_cast<unsigned>(value);
        do {
            buf[i++] = static_cast<char>('0' + (v % 10));
            v /= 10;
        } while (v > 0);
        if (value < 0) s += '-';
        while (i > 0) s += buf[--i];
    }
}

// Zero-padded appenders. Each assumes a value in its digit range and falls
// back to the plain signed decimal outside it, so an out-of-range component
// (a wrapped year, a negative pre-epoch millisecond) can never turn into
// non-digit garbage bytes (C-06).
inline void appendPad2(std::string& s, int value) {
    if (value < 0 || value > 99) {
        appendInt(s, value);
        return;
    }
    s += static_cast<char>('0' + value / 10);
    s += static_cast<char>('0' + value % 10);
}

inline void appendPad3(std::string& s, int value) {
    if (value < 0 || value > 999) {
        appendInt(s, value);
        return;
    }
    s += static_cast<char>('0' + value / 100);
    s += static_cast<char>('0' + (value / 10) % 10);
    s += static_cast<char>('0' + value % 10);
}

// Years: 0000-9999 are zero-padded; negative years keep the sign in front of
// the padded magnitude ("-0001"); years beyond 9999 print in full ("10000").
inline void appendPad4(std::string& s, int value) {
    if (value < 0 && value > -10000) {
        s += '-';
        value = -value;
    } else if (value < 0 || value > 9999) {
        appendInt(s, value);
        return;
    }
    s += static_cast<char>('0' + value / 1000);
    s += static_cast<char>('0' + (value / 100) % 10);
    s += static_cast<char>('0' + (value / 10) % 10);
    s += static_cast<char>('0' + value % 10);
}

std::string formatInternal(double timestamp, const std::string& pattern, bool useUTC,
                           const LocaleProvider& locale) {
    InternalDateComponents dc = timestampToComponents(timestamp, useUTC);
    int dayOfWeek = dc.dayOfWeek;

    // Calculate 12-hour format
    int hour12 = dc.hour % 12;
    if (hour12 == 0) hour12 = 12;
    bool isPM = dc.hour >= 12;

    std::string result;
    result.reserve(pattern.length() + 32);

    size_t i = 0;
    const size_t len = pattern.length();

    while (i < len) {
        char c = pattern[i];

        // Handle escaped text with brackets [text] (dayjs style)
        if (c == '[') {
            i++;
            while (i < len && pattern[i] != ']') {
                result += pattern[i++];
            }
            if (i < len) i++;
            continue;
        }

        // Handle escaped text with single quotes 'text' (date-fns style)
        if (c == '\'') {
            i++;
            if (i < len && pattern[i] == '\'') {
                result += '\'';
                i++;
                continue;
            }
            while (i < len) {
                if (pattern[i] == '\'') {
                    if (i + 1 < len && pattern[i + 1] == '\'') {
                        result += '\'';
                        i += 2;
                    } else {
                        i++;
                        break;
                    }
                } else {
                    result += pattern[i++];
                }
            }
            continue;
        }

        // Fast token matching using first character switch
        size_t remaining = len - i;
        bool matched = true;

        switch (c) {
            case 'y':
            case 'Y':
                if (remaining >= 4 && pattern[i+1] == c && pattern[i+2] == c && pattern[i+3] == c) {
                    appendPad4(result, dc.year);
                    i += 4;
                } else if (remaining >= 2 && pattern[i+1] == c) {
                    appendPad2(result, dc.year % 100);
                    i += 2;
                } else {
                    matched = false;
                }
                break;

            case 'M':
                if (remaining >= 4 && pattern[i+1] == 'M' && pattern[i+2] == 'M' && pattern[i+3] == 'M') {
                    result += locale.monthName(dc.month, NameForm::Full);
                    i += 4;
                } else if (remaining >= 3 && pattern[i+1] == 'M' && pattern[i+2] == 'M') {
                    result += locale.monthName(dc.month, NameForm::Abbreviated);
                    i += 3;
                } else if (remaining >= 2 && pattern[i+1] == 'M') {
                    appendPad2(result, dc.month);
                    i += 2;
                } else {
                    result += locale.monthName(dc.month, NameForm::Narrow);
                    i++;
                }
                break;

            case 'd':
                if (remaining >= 4 && pattern[i+1] == 'd' && pattern[i+2] == 'd' && pattern[i+3] == 'd') {
                    result += locale.dayName(dayOfWeek, NameForm::Full);
                    i += 4;
                } else if (remaining >= 3 && pattern[i+1] == 'd' && pattern[i+2] == 'd') {
                    result += locale.dayName(dayOfWeek, NameForm::Abbreviated);
                    i += 3;
                } else if (remaining >= 2 && pattern[i+1] == 'd') {
                    appendPad2(result, dc.day);
                    i += 2;
                } else {
                    appendInt(result, dc.day);
                    i++;
                }
                break;

            case 'D':
                if (remaining >= 2 && pattern[i+1] == 'D') {
                    appendPad2(result, dc.day);
                    i += 2;
                } else {
                    appendInt(result, dc.day);
                    i++;
                }
                break;

            case 'E':
                if (remaining >= 4 && pattern[i+1] == 'E' && pattern[i+2] == 'E' && pattern[i+3] == 'E') {
                    result += locale.dayName(dayOfWeek, NameForm::Full);
                    i += 4;
                } else if (remaining >= 3 && pattern[i+1] == 'E' && pattern[i+2] == 'E') {
                    result += locale.dayName(dayOfWeek, NameForm::Abbreviated);
                    i += 3;
                } else if (remaining >= 2 && pattern[i+1] == 'E') {
                    result += locale.dayName(dayOfWeek, NameForm::Short);
                    i += 2;
                } else {
                    result += locale.dayName(dayOfWeek, NameForm::Narrow);
                    i++;
                }
                break;

            case 'H':
                if (remaining >= 2 && pattern[i+1] == 'H') {
                    appendPad2(result, dc.hour);
                    i += 2;
                } else {
                    appendInt(result, dc.hour);
                    i++;
                }
                break;

            case 'h':
                if (remaining >= 2 && pattern[i+1] == 'h') {
                    appendPad2(result, hour12);
                    i += 2;
                } else {
                    appendInt(result, hour12);
                    i++;
                }
                break;

            case 'm':
                if (remaining >= 2 && pattern[i+1] == 'm') {
                    appendPad2(result, dc.minute);
                    i += 2;
                } else {
                    appendInt(result, dc.minute);
                    i++;
                }
                break;

            case 's':
                if (remaining >= 2 && pattern[i+1] == 's') {
                    appendPad2(result, dc.second);
                    i += 2;
                } else {
                    appendInt(result, dc.second);
                    i++;
                }
                break;

            case 'S':
                if (remaining >= 3 && pattern[i+1] == 'S' && pattern[i+2] == 'S') {
                    appendPad3(result, dc.millisecond);
                    i += 3;
                } else {
                    matched = false;
                }
                break;

            case 'A':
                result += isPM ? "PM" : "AM";
                i++;
                break;

            case 'a':
                if (remaining >= 3 && pattern[i+1] == 'a' && pattern[i+2] == 'a') {
                    result += isPM ? "p.m." : "a.m.";
                    i += 3;
                } else if (remaining >= 2 && pattern[i+1] == 'a') {
                    result += isPM ? "pm" : "am";
                    i += 2;
                } else {
                    result += isPM ? "p" : "a";
                    i++;
                }
                break;

            default:
                matched = false;
                break;
        }

        // No match - copy character as literal
        if (!matched) {
            result += c;
            i++;
        }
    }

    return result;
}

std::string padZero(int value, int width) {
    // Fast paths for the common widths (no ostringstream overhead). Values
    // outside the width's digit range take the fallback, which prints the
    // signed decimal instead of emitting garbage bytes (C-06).
    if (value >= 0) {
        std::string result;
        if (width == 2 && value <= 99) {
            appendPad2(result, value);
            return result;
        }
        if (width == 3 && value <= 999) {
            appendPad3(result, value);
            return result;
        }
        if (width == 4 && value <= 9999) {
            appendPad4(result, value);
            return result;
        }
    }
    // Fallback for other widths and out-of-range values
    std::ostringstream ss;
    ss << std::setfill('0') << std::setw(width) << std::internal << value;
    return ss.str();
}

} // namespace nativedate::core
