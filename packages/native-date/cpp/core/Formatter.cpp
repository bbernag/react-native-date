#include "Formatter.hpp"

#include "Civil.hpp"

#include <iomanip>
#include <sstream>
#include <utility>
#include <vector>

namespace nativedate::core {

// Token identifiers for format patterns
enum class FormatToken {
    // Year
    YEAR_4,         // yyyy, YYYY → "2024"
    YEAR_2,         // yy, YY → "24"
    // Month
    MONTH_NAME,     // MMMM → "December"
    MONTH_SHORT,    // MMM → "Dec"
    MONTH_2,        // MM → "12"
    MONTH_1,        // M → "D" (single letter)
    // Day
    DAY_2,          // dd, DD → "25"
    DAY_1,          // d, D → "25" (no leading zero)
    // Day name
    DAY_NAME,       // EEEE, dddd → "Wednesday"
    DAY_SHORT,      // EEE, ddd → "Wed"
    DAY_MIN,        // EE → "We"
    DAY_LETTER,     // E → "W"
    // Hour
    HOUR_24,        // HH → "14"
    HOUR_24_1,      // H → "14" (no leading zero)
    HOUR_12,        // hh → "02"
    HOUR_12_1,      // h → "2" (no leading zero)
    // Minute
    MINUTE,         // mm → "30"
    MINUTE_1,       // m → "30" (no leading zero)
    // Second
    SECOND,         // ss → "45"
    SECOND_1,       // s → "45" (no leading zero)
    // Millisecond
    MILLISECOND,    // SSS → "123"
    // AM/PM
    AMPM_UPPER,     // A → "PM"
    AMPM_LOWER,     // a → "p"
    AMPM_FULL,      // aa → "pm"
    AMPM_DOT,       // aaa → "p.m."
};

// Static token list - sorted by length (longest first) to ensure correct matching
static const std::vector<std::pair<std::string, FormatToken>> formatTokens = {
    // 4-char tokens
    {"yyyy", FormatToken::YEAR_4},
    {"YYYY", FormatToken::YEAR_4},
    {"MMMM", FormatToken::MONTH_NAME},
    {"EEEE", FormatToken::DAY_NAME},
    {"dddd", FormatToken::DAY_NAME},    // dayjs style
    // 3-char tokens
    {"MMM", FormatToken::MONTH_SHORT},
    {"EEE", FormatToken::DAY_SHORT},
    {"ddd", FormatToken::DAY_SHORT},    // dayjs style
    {"SSS", FormatToken::MILLISECOND},
    {"aaa", FormatToken::AMPM_DOT},
    // 2-char tokens
    {"yy", FormatToken::YEAR_2},
    {"YY", FormatToken::YEAR_2},
    {"MM", FormatToken::MONTH_2},
    {"dd", FormatToken::DAY_2},
    {"DD", FormatToken::DAY_2},
    {"EE", FormatToken::DAY_MIN},
    {"HH", FormatToken::HOUR_24},
    {"hh", FormatToken::HOUR_12},
    {"mm", FormatToken::MINUTE},
    {"ss", FormatToken::SECOND},
    {"aa", FormatToken::AMPM_FULL},
    // 1-char tokens
    {"M", FormatToken::MONTH_1},
    {"d", FormatToken::DAY_1},
    {"D", FormatToken::DAY_1},
    {"E", FormatToken::DAY_LETTER},
    {"H", FormatToken::HOUR_24_1},
    {"h", FormatToken::HOUR_12_1},
    {"m", FormatToken::MINUTE_1},
    {"s", FormatToken::SECOND_1},
    {"A", FormatToken::AMPM_UPPER},
    {"a", FormatToken::AMPM_LOWER},
};

// Fast inline number to string (no std::to_string overhead)
inline void appendInt(std::string& s, int value) {
    if (value < 10) {
        s += ('0' + value);
    } else if (value < 100) {
        s += ('0' + value / 10);
        s += ('0' + value % 10);
    } else {
        // Fallback for larger numbers
        char buf[12];
        int i = 0;
        int v = value;
        do {
            buf[i++] = '0' + (v % 10);
            v /= 10;
        } while (v > 0);
        while (i > 0) s += buf[--i];
    }
}

// Fast inline padded number append
inline void appendPad2(std::string& s, int value) {
    s += ('0' + (value / 10) % 10);
    s += ('0' + value % 10);
}

inline void appendPad3(std::string& s, int value) {
    s += ('0' + (value / 100) % 10);
    s += ('0' + (value / 10) % 10);
    s += ('0' + value % 10);
}

inline void appendPad4(std::string& s, int value) {
    s += ('0' + (value / 1000) % 10);
    s += ('0' + (value / 100) % 10);
    s += ('0' + (value / 10) % 10);
    s += ('0' + value % 10);
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
    // Fast path for common cases (no ostringstream overhead)
    if (width == 2) {
        char buf[3];
        buf[0] = '0' + (value / 10) % 10;
        buf[1] = '0' + value % 10;
        buf[2] = '\0';
        return std::string(buf);
    }
    if (width == 3) {
        char buf[4];
        buf[0] = '0' + (value / 100) % 10;
        buf[1] = '0' + (value / 10) % 10;
        buf[2] = '0' + value % 10;
        buf[3] = '\0';
        return std::string(buf);
    }
    if (width == 4) {
        char buf[5];
        buf[0] = '0' + (value / 1000) % 10;
        buf[1] = '0' + (value / 100) % 10;
        buf[2] = '0' + (value / 10) % 10;
        buf[3] = '0' + value % 10;
        buf[4] = '\0';
        return std::string(buf);
    }
    // Fallback for other widths
    std::ostringstream ss;
    ss << std::setfill('0') << std::setw(width) << value;
    return ss.str();
}

} // namespace nativedate::core
