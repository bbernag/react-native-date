#include "HybridNativeDate.hpp"
#include "TimezoneHelper.hpp"
#include "LocaleHelper.hpp"
#include "RelativeTimeHelper.hpp"
#include <ctime>
#if !defined(_WIN32)
#include <sys/time.h>
#endif
#include <sstream>
#include <iomanip>
#include <stdexcept>
#include <cmath>
#include <algorithm>
#include <limits>

namespace margelo::nitro::rnpackages_nativedate {

// Constants for time calculations
static constexpr int64_t MS_PER_SECOND = 1000;
static constexpr int64_t MS_PER_MINUTE = 60 * MS_PER_SECOND;
static constexpr int64_t MS_PER_HOUR = 60 * MS_PER_MINUTE;
static constexpr int64_t MS_PER_DAY = 24 * MS_PER_HOUR;
static constexpr int64_t MS_PER_WEEK = 7 * MS_PER_DAY;

// Days in each month (non-leap year)
static const int DAYS_IN_MONTH[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};

static bool isLeapYearInt(int year) {
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

static int daysInMonth(int year, int month) {
    if (month == 2 && isLeapYearInt(year)) {
        return 29;
    }
    return DAYS_IN_MONTH[month - 1];
}

// Fast inline digit parsing (no validation, assumes valid input)
static inline int parse2Digits(const char* s) {
    return (s[0] - '0') * 10 + (s[1] - '0');
}

static inline int parse4Digits(const char* s) {
    return (s[0] - '0') * 1000 + (s[1] - '0') * 100 + (s[2] - '0') * 10 + (s[3] - '0');
}

// MARK: - Core

double HybridNativeDate::now() {
#if defined(_WIN32)
    auto now = std::chrono::system_clock::now();
    auto duration = now.time_since_epoch();
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration);
    return static_cast<double>(millis.count());
#else
    struct timeval tv;
    gettimeofday(&tv, nullptr);
    return (static_cast<double>(tv.tv_sec) * 1000.0) + (static_cast<double>(tv.tv_usec) / 1000.0);
#endif
}

double HybridNativeDate::parse(const std::string& dateString) {
    return parseISO8601(dateString);
}

double HybridNativeDate::parseFormat(const std::string& dateString, const std::string& pattern) {
    double result = parseWithFormat(dateString, pattern);
    if (std::isnan(result)) {
        throw std::invalid_argument("Unable to parse date string: '" + dateString + "' with pattern: '" + pattern + "'");
    }
    return result;
}

double HybridNativeDate::tryParseFormat(const std::string& dateString, const std::string& pattern) {
    return parseWithFormat(dateString, pattern);
}

double HybridNativeDate::parseWithFormat(const std::string& dateString, const std::string& pattern) {
    // Parse a date string using a custom format pattern
    // Supported tokens: yyyy, yy, MM, M, dd, d, HH, H, hh, h, mm, m, ss, s, SSS, a, A

    InternalDateComponents dc = {1970, 1, 1, 0, 0, 0, 0, 0};
    bool hasHour12 = false;
    bool isPM = false;

    size_t datePos = 0;
    size_t patternPos = 0;
    const size_t dateLen = dateString.length();
    const size_t patternLen = pattern.length();

    while (patternPos < patternLen && datePos < dateLen) {
        char c = pattern[patternPos];
        size_t remaining = patternLen - patternPos;

        // Handle escaped text with single quotes
        if (c == '\'') {
            patternPos++;
            if (patternPos < patternLen && pattern[patternPos] == '\'') {
                // Escaped single quote
                if (dateString[datePos] != '\'') return std::numeric_limits<double>::quiet_NaN();
                datePos++;
                patternPos++;
                continue;
            }
            // Skip until closing quote
            while (patternPos < patternLen && datePos < dateLen) {
                if (pattern[patternPos] == '\'') {
                    patternPos++;
                    break;
                }
                if (dateString[datePos] != pattern[patternPos]) {
                    return std::numeric_limits<double>::quiet_NaN();
                }
                datePos++;
                patternPos++;
            }
            continue;
        }

        // Try to match tokens
        bool matched = false;

        // yyyy - 4 digit year
        if (remaining >= 4 && pattern.substr(patternPos, 4) == "yyyy") {
            if (datePos + 4 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            dc.year = parse4Digits(dateString.c_str() + datePos);
            datePos += 4;
            patternPos += 4;
            matched = true;
        }
        // yy - 2 digit year
        else if (remaining >= 2 && pattern.substr(patternPos, 2) == "yy") {
            if (datePos + 2 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            int year2 = parse2Digits(dateString.c_str() + datePos);
            dc.year = (year2 >= 70) ? 1900 + year2 : 2000 + year2;
            datePos += 2;
            patternPos += 2;
            matched = true;
        }
        // MM - 2 digit month
        else if (remaining >= 2 && pattern.substr(patternPos, 2) == "MM") {
            if (datePos + 2 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            dc.month = parse2Digits(dateString.c_str() + datePos);
            datePos += 2;
            patternPos += 2;
            matched = true;
        }
        // M - 1-2 digit month
        else if (c == 'M' && (remaining < 2 || pattern[patternPos + 1] != 'M')) {
            int month = 0;
            while (datePos < dateLen && dateString[datePos] >= '0' && dateString[datePos] <= '9') {
                month = month * 10 + (dateString[datePos] - '0');
                datePos++;
            }
            dc.month = month;
            patternPos++;
            matched = true;
        }
        // dd - 2 digit day
        else if (remaining >= 2 && pattern.substr(patternPos, 2) == "dd") {
            if (datePos + 2 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            dc.day = parse2Digits(dateString.c_str() + datePos);
            datePos += 2;
            patternPos += 2;
            matched = true;
        }
        // d - 1-2 digit day
        else if (c == 'd' && (remaining < 2 || pattern[patternPos + 1] != 'd')) {
            int day = 0;
            while (datePos < dateLen && dateString[datePos] >= '0' && dateString[datePos] <= '9') {
                day = day * 10 + (dateString[datePos] - '0');
                datePos++;
            }
            dc.day = day;
            patternPos++;
            matched = true;
        }
        // HH - 2 digit hour (24h)
        else if (remaining >= 2 && pattern.substr(patternPos, 2) == "HH") {
            if (datePos + 2 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            dc.hour = parse2Digits(dateString.c_str() + datePos);
            datePos += 2;
            patternPos += 2;
            matched = true;
        }
        // H - 1-2 digit hour (24h)
        else if (c == 'H' && (remaining < 2 || pattern[patternPos + 1] != 'H')) {
            int hour = 0;
            while (datePos < dateLen && dateString[datePos] >= '0' && dateString[datePos] <= '9') {
                hour = hour * 10 + (dateString[datePos] - '0');
                datePos++;
            }
            dc.hour = hour;
            patternPos++;
            matched = true;
        }
        // hh - 2 digit hour (12h)
        else if (remaining >= 2 && pattern.substr(patternPos, 2) == "hh") {
            if (datePos + 2 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            dc.hour = parse2Digits(dateString.c_str() + datePos);
            hasHour12 = true;
            datePos += 2;
            patternPos += 2;
            matched = true;
        }
        // h - 1-2 digit hour (12h)
        else if (c == 'h' && (remaining < 2 || pattern[patternPos + 1] != 'h')) {
            int hour = 0;
            while (datePos < dateLen && dateString[datePos] >= '0' && dateString[datePos] <= '9') {
                hour = hour * 10 + (dateString[datePos] - '0');
                datePos++;
            }
            dc.hour = hour;
            hasHour12 = true;
            patternPos++;
            matched = true;
        }
        // mm - 2 digit minute
        else if (remaining >= 2 && pattern.substr(patternPos, 2) == "mm") {
            if (datePos + 2 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            dc.minute = parse2Digits(dateString.c_str() + datePos);
            datePos += 2;
            patternPos += 2;
            matched = true;
        }
        // m - 1-2 digit minute (only if not followed by another m)
        else if (c == 'm' && (remaining < 2 || pattern[patternPos + 1] != 'm')) {
            int minute = 0;
            while (datePos < dateLen && dateString[datePos] >= '0' && dateString[datePos] <= '9') {
                minute = minute * 10 + (dateString[datePos] - '0');
                datePos++;
            }
            dc.minute = minute;
            patternPos++;
            matched = true;
        }
        // ss - 2 digit second
        else if (remaining >= 2 && pattern.substr(patternPos, 2) == "ss") {
            if (datePos + 2 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            dc.second = parse2Digits(dateString.c_str() + datePos);
            datePos += 2;
            patternPos += 2;
            matched = true;
        }
        // s - 1-2 digit second
        else if (c == 's' && (remaining < 2 || pattern[patternPos + 1] != 's')) {
            int second = 0;
            while (datePos < dateLen && dateString[datePos] >= '0' && dateString[datePos] <= '9') {
                second = second * 10 + (dateString[datePos] - '0');
                datePos++;
            }
            dc.second = second;
            patternPos++;
            matched = true;
        }
        // SSS - 3 digit millisecond
        else if (remaining >= 3 && pattern.substr(patternPos, 3) == "SSS") {
            if (datePos + 3 > dateLen) return std::numeric_limits<double>::quiet_NaN();
            dc.millisecond = (dateString[datePos] - '0') * 100 +
                             (dateString[datePos + 1] - '0') * 10 +
                             (dateString[datePos + 2] - '0');
            datePos += 3;
            patternPos += 3;
            matched = true;
        }
        // A or a - AM/PM marker
        else if (c == 'A' || c == 'a') {
            // Match AM/PM in various forms
            char first = dateString[datePos];
            if (first == 'P' || first == 'p') {
                isPM = true;
            } else if (first == 'A' || first == 'a') {
                isPM = false;
            } else {
                return std::numeric_limits<double>::quiet_NaN();
            }
            datePos++;
            // Skip optional 'M' or 'm'
            if (datePos < dateLen && (dateString[datePos] == 'M' || dateString[datePos] == 'm')) {
                datePos++;
            }
            patternPos++;
            matched = true;
        }

        // No token matched - expect literal character match
        if (!matched) {
            if (dateString[datePos] != pattern[patternPos]) {
                return std::numeric_limits<double>::quiet_NaN();
            }
            datePos++;
            patternPos++;
        }
    }

    // Convert 12-hour to 24-hour if needed
    if (hasHour12) {
        if (isPM && dc.hour != 12) {
            dc.hour += 12;
        } else if (!isPM && dc.hour == 12) {
            dc.hour = 0;
        }
    }

    // Validate components
    if (dc.month < 1 || dc.month > 12) return std::numeric_limits<double>::quiet_NaN();
    if (dc.day < 1 || dc.day > 31) return std::numeric_limits<double>::quiet_NaN();
    if (dc.hour < 0 || dc.hour > 23) return std::numeric_limits<double>::quiet_NaN();
    if (dc.minute < 0 || dc.minute > 59) return std::numeric_limits<double>::quiet_NaN();
    if (dc.second < 0 || dc.second > 59) return std::numeric_limits<double>::quiet_NaN();

    return componentsToTimestamp(dc);
}

std::string HybridNativeDate::format(double timestamp, const std::string& pattern) {
    // Use local time by default
    return formatInternal(timestamp, pattern, false);
}

std::string HybridNativeDate::formatUTC(double timestamp, const std::string& pattern) {
    // Use UTC time
    return formatInternal(timestamp, pattern, true);
}

std::string HybridNativeDate::formatFromString(const std::string& dateString, const std::string& pattern) {
    double timestamp = parseISO8601(dateString);
    return formatInternal(timestamp, pattern, false);
}

std::string HybridNativeDate::formatUTCFromString(const std::string& dateString, const std::string& pattern) {
    double timestamp = parseISO8601(dateString);
    return formatInternal(timestamp, pattern, true);
}

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

std::string HybridNativeDate::formatInternal(double timestamp, const std::string& pattern, bool useUTC) {
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
                    result += LocaleHelper::getMonthName(dc.month, false);
                    i += 4;
                } else if (remaining >= 3 && pattern[i+1] == 'M' && pattern[i+2] == 'M') {
                    result += LocaleHelper::getMonthName(dc.month, true);
                    i += 3;
                } else if (remaining >= 2 && pattern[i+1] == 'M') {
                    appendPad2(result, dc.month);
                    i += 2;
                } else {
                    result += LocaleHelper::getMonthMinimal(dc.month);
                    i++;
                }
                break;

            case 'd':
                if (remaining >= 4 && pattern[i+1] == 'd' && pattern[i+2] == 'd' && pattern[i+3] == 'd') {
                    result += LocaleHelper::getDayName(dayOfWeek, false);
                    i += 4;
                } else if (remaining >= 3 && pattern[i+1] == 'd' && pattern[i+2] == 'd') {
                    result += LocaleHelper::getDayName(dayOfWeek, true);
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
                    result += LocaleHelper::getDayName(dayOfWeek, false);
                    i += 4;
                } else if (remaining >= 3 && pattern[i+1] == 'E' && pattern[i+2] == 'E') {
                    result += LocaleHelper::getDayName(dayOfWeek, true);
                    i += 3;
                } else if (remaining >= 2 && pattern[i+1] == 'E') {
                    result += LocaleHelper::getDayVeryShort(dayOfWeek);
                    i += 2;
                } else {
                    result += LocaleHelper::getDayMinimal(dayOfWeek);
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

// MARK: - Getters

DateComponents HybridNativeDate::getComponents(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return DateComponents(
        static_cast<double>(dc.year),
        static_cast<double>(dc.month),
        static_cast<double>(dc.day),
        static_cast<double>(dc.hour),
        static_cast<double>(dc.minute),
        static_cast<double>(dc.second),
        static_cast<double>(dc.millisecond),
        static_cast<double>(dc.dayOfWeek)
    );
}

double HybridNativeDate::getYear(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return static_cast<double>(dc.year);
}

double HybridNativeDate::getMonth(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return static_cast<double>(dc.month);
}

double HybridNativeDate::getDate(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return static_cast<double>(dc.day);
}

double HybridNativeDate::getDay(double timestamp) {
    return static_cast<double>(getDayOfWeek(timestamp));
}

double HybridNativeDate::getHours(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return static_cast<double>(dc.hour);
}

double HybridNativeDate::getMinutes(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return static_cast<double>(dc.minute);
}

double HybridNativeDate::getSeconds(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return static_cast<double>(dc.second);
}

double HybridNativeDate::getMilliseconds(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return static_cast<double>(dc.millisecond);
}

// MARK: - String Input Getters (single bridge crossing)

DateComponents HybridNativeDate::getComponentsFromString(const std::string& dateString) {
    return getComponents(parseISO8601(dateString));
}

double HybridNativeDate::getYearFromString(const std::string& dateString) {
    return getYear(parseISO8601(dateString));
}

double HybridNativeDate::getMonthFromString(const std::string& dateString) {
    return getMonth(parseISO8601(dateString));
}

double HybridNativeDate::getDateFromString(const std::string& dateString) {
    return getDate(parseISO8601(dateString));
}

double HybridNativeDate::getDayFromString(const std::string& dateString) {
    return getDay(parseISO8601(dateString));
}

double HybridNativeDate::getHoursFromString(const std::string& dateString) {
    return getHours(parseISO8601(dateString));
}

double HybridNativeDate::getMinutesFromString(const std::string& dateString) {
    return getMinutes(parseISO8601(dateString));
}

double HybridNativeDate::getSecondsFromString(const std::string& dateString) {
    return getSeconds(parseISO8601(dateString));
}

double HybridNativeDate::getMillisecondsFromString(const std::string& dateString) {
    return getMilliseconds(parseISO8601(dateString));
}

// MARK: - Date Info

double HybridNativeDate::getDaysInMonth(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return static_cast<double>(daysInMonth(dc.year, dc.month));
}

bool HybridNativeDate::isLeapYear(double timestamp) {
    InternalDateComponents dc = timestampToComponents(timestamp);
    return isLeapYearInt(dc.year);
}

bool HybridNativeDate::isWeekend(double timestamp) {
    int dayOfWeek = getDayOfWeek(timestamp);
    return dayOfWeek == 0 || dayOfWeek == 6; // Sunday or Saturday
}

bool HybridNativeDate::isValid(double timestamp) {
    return !std::isnan(timestamp) && !std::isinf(timestamp);
}

// MARK: - Arithmetic

double HybridNativeDate::add(double timestamp, double amount, TimeUnit unit) {
    int64_t amountInt = static_cast<int64_t>(amount);

    switch (unit) {
        case TimeUnit::MILLISECOND:
            return timestamp + amount;
        case TimeUnit::SECOND:
            return timestamp + (amount * MS_PER_SECOND);
        case TimeUnit::MINUTE:
            return timestamp + (amount * MS_PER_MINUTE);
        case TimeUnit::HOUR:
            return timestamp + (amount * MS_PER_HOUR);
        case TimeUnit::DAY:
            return timestamp + (amount * MS_PER_DAY);
        case TimeUnit::WEEK:
            return timestamp + (amount * MS_PER_WEEK);
        case TimeUnit::MONTH: {
            InternalDateComponents dc = timestampToComponents(timestamp);
            int totalMonths = dc.month - 1 + static_cast<int>(amountInt);
            dc.year += totalMonths / 12;
            dc.month = (totalMonths % 12) + 1;
            if (dc.month <= 0) {
                dc.month += 12;
                dc.year -= 1;
            }
            // Clamp day to valid range for new month
            int maxDay = daysInMonth(dc.year, dc.month);
            if (dc.day > maxDay) {
                dc.day = maxDay;
            }
            return componentsToTimestamp(dc);
        }
        case TimeUnit::YEAR: {
            InternalDateComponents dc = timestampToComponents(timestamp);
            dc.year += amountInt;
            // Handle Feb 29 -> Feb 28 for non-leap years
            if (dc.month == 2 && dc.day == 29 && !isLeapYearInt(dc.year)) {
                dc.day = 28;
            }
            return componentsToTimestamp(dc);
        }
    }
    return timestamp;
}

double HybridNativeDate::subtract(double timestamp, double amount, TimeUnit unit) {
    return add(timestamp, -amount, unit);
}

// MARK: - Comparisons

bool HybridNativeDate::isBefore(double timestamp1, double timestamp2) {
    return timestamp1 < timestamp2;
}

bool HybridNativeDate::isAfter(double timestamp1, double timestamp2) {
    return timestamp1 > timestamp2;
}

bool HybridNativeDate::isSame(double timestamp1, double timestamp2, TimeUnit unit) {
    double start1 = truncateToUnit(timestamp1, unit);
    double start2 = truncateToUnit(timestamp2, unit);
    return start1 == start2;
}

// MARK: - Helpers

// Fast day boundary calculation using integer math (handles negative timestamps)
inline int64_t floorDayStartMs(int64_t ms) {
    int64_t remainder = ms % MS_PER_DAY;
    if (remainder < 0) remainder += MS_PER_DAY;
    return ms - remainder;
}

inline int64_t posMod(int64_t value, int64_t modulus) {
    int64_t rem = value % modulus;
    if (rem < 0) rem += modulus;
    return rem;
}

inline int64_t floorDiv(int64_t numerator, int64_t denominator) {
    int64_t quot = numerator / denominator;
    int64_t rem = numerator % denominator;
    if (rem != 0 && ((rem < 0) != (denominator < 0))) {
        --quot;
    }
    return quot;
}

double HybridNativeDate::startOf(double timestamp, TimeUnit unit) {
    int64_t ms = static_cast<int64_t>(timestamp);

    // Fast path for time-based units (no component conversion needed)
    switch (unit) {
        case TimeUnit::MILLISECOND:
            return timestamp;
        case TimeUnit::SECOND:
            return static_cast<double>((ms / 1000) * 1000);
        case TimeUnit::MINUTE:
            return static_cast<double>((ms / MS_PER_MINUTE) * MS_PER_MINUTE);
        case TimeUnit::HOUR:
            return static_cast<double>((ms / MS_PER_HOUR) * MS_PER_HOUR);
        case TimeUnit::DAY:
            return static_cast<double>(floorDayStartMs(ms));
        default:
            // DAY, WEEK, MONTH, YEAR need full component conversion
            return truncateToUnit(timestamp, unit);
    }
}

double HybridNativeDate::endOf(double timestamp, TimeUnit unit) {
    int64_t ms = static_cast<int64_t>(timestamp);

    // Fast path for time-based units
    switch (unit) {
        case TimeUnit::MILLISECOND:
            return timestamp;
        case TimeUnit::SECOND:
            return static_cast<double>(((ms / 1000) * 1000) + 999);
        case TimeUnit::MINUTE:
            return static_cast<double>(((ms / MS_PER_MINUTE) * MS_PER_MINUTE) + MS_PER_MINUTE - 1);
        case TimeUnit::HOUR:
            return static_cast<double>(((ms / MS_PER_HOUR) * MS_PER_HOUR) + MS_PER_HOUR - 1);
        case TimeUnit::DAY: {
            int64_t dayStartMs = floorDayStartMs(ms);
            return static_cast<double>(dayStartMs + MS_PER_DAY - 1);
        }
        case TimeUnit::WEEK: {
            double start = truncateToUnit(timestamp, TimeUnit::WEEK);
            return start + (7 * MS_PER_DAY) - 1;
        }
        case TimeUnit::MONTH: {
            InternalDateComponents dc = timestampToComponents(timestamp);
            dc.day = daysInMonth(dc.year, dc.month);
            dc.hour = 23;
            dc.minute = 59;
            dc.second = 59;
            dc.millisecond = 999;
            return componentsToTimestamp(dc);
        }
        case TimeUnit::YEAR: {
            InternalDateComponents dc = timestampToComponents(timestamp);
            dc.month = 12;
            dc.day = 31;
            dc.hour = 23;
            dc.minute = 59;
            dc.second = 59;
            dc.millisecond = 999;
            return componentsToTimestamp(dc);
        }
        default:
            return timestamp;
    }
}

double HybridNativeDate::diff(double timestamp1, double timestamp2, TimeUnit unit) {
    int64_t diffMs = static_cast<int64_t>(timestamp1) - static_cast<int64_t>(timestamp2);

    switch (unit) {
        case TimeUnit::MILLISECOND:
            return static_cast<double>(diffMs);
        case TimeUnit::SECOND:
            return static_cast<double>(floorDiv(diffMs, MS_PER_SECOND));
        case TimeUnit::MINUTE:
            return static_cast<double>(floorDiv(diffMs, MS_PER_MINUTE));
        case TimeUnit::HOUR:
            return static_cast<double>(floorDiv(diffMs, MS_PER_HOUR));
        case TimeUnit::DAY:
            return static_cast<double>(floorDiv(diffMs, MS_PER_DAY));
        case TimeUnit::WEEK:
            return static_cast<double>(floorDiv(diffMs, MS_PER_WEEK));
        case TimeUnit::MONTH: {
            InternalDateComponents dc1 = timestampToComponents(timestamp1);
            InternalDateComponents dc2 = timestampToComponents(timestamp2);
            return (dc1.year - dc2.year) * 12 + (dc1.month - dc2.month);
        }
        case TimeUnit::YEAR: {
            InternalDateComponents dc1 = timestampToComponents(timestamp1);
            InternalDateComponents dc2 = timestampToComponents(timestamp2);
            return dc1.year - dc2.year;
        }
    }
    return 0;
}

double HybridNativeDate::clamp(double timestamp, double minVal, double maxVal) {
    if (timestamp < minVal) return minVal;
    if (timestamp > maxVal) return maxVal;
    return timestamp;
}

double HybridNativeDate::min(const std::vector<double>& timestamps) {
    if (timestamps.empty()) {
        return std::numeric_limits<double>::quiet_NaN();
    }
    double result = timestamps[0];
    for (size_t i = 1; i < timestamps.size(); ++i) {
        if (timestamps[i] < result) {
            result = timestamps[i];
        }
    }
    return result;
}

double HybridNativeDate::max(const std::vector<double>& timestamps) {
    if (timestamps.empty()) {
        return std::numeric_limits<double>::quiet_NaN();
    }
    double result = timestamps[0];
    for (size_t i = 1; i < timestamps.size(); ++i) {
        if (timestamps[i] > result) {
            result = timestamps[i];
        }
    }
    return result;
}

// MARK: - Relative Time Formatting

std::string HybridNativeDate::formatDistance(double timestamp, double baseTimestamp, bool addSuffix) {
    return RelativeTimeHelper::formatDistance(timestamp, baseTimestamp, addSuffix);
}

std::string HybridNativeDate::formatDuration(double milliseconds) {
    return RelativeTimeHelper::formatDuration(milliseconds);
}

// MARK: - Timezone

std::string HybridNativeDate::getTimezone() {
    // Use platform-specific timezone helper
    return TimezoneHelper::getSystemTimezone();
}

double HybridNativeDate::getTimezoneOffset() {
    // Get current offset for the device's timezone
    std::string systemTz = TimezoneHelper::getSystemTimezone();
    int64_t nowMs = static_cast<int64_t>(now());
    return static_cast<double>(TimezoneHelper::getOffsetForTimestamp(systemTz, nowMs));
}

// MARK: - Private Helpers

int64_t HybridNativeDate::getMillisForUnit(TimeUnit unit) {
    switch (unit) {
        case TimeUnit::MILLISECOND: return 1;
        case TimeUnit::SECOND: return MS_PER_SECOND;
        case TimeUnit::MINUTE: return MS_PER_MINUTE;
        case TimeUnit::HOUR: return MS_PER_HOUR;
        case TimeUnit::DAY: return MS_PER_DAY;
        case TimeUnit::WEEK: return MS_PER_WEEK;
        case TimeUnit::MONTH: return MS_PER_DAY * 30; // Approximate
        case TimeUnit::YEAR: return MS_PER_DAY * 365; // Approximate
    }
    return 1;
}

double HybridNativeDate::truncateToUnit(double timestamp, TimeUnit unit) {
    // Use local time components for all units (consistent behavior)
    InternalDateComponents dc = timestampToComponents(timestamp);

    switch (unit) {
        case TimeUnit::MILLISECOND:
            break;
        case TimeUnit::SECOND:
            dc.millisecond = 0;
            break;
        case TimeUnit::MINUTE:
            dc.millisecond = 0;
            dc.second = 0;
            break;
        case TimeUnit::HOUR:
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            break;
        case TimeUnit::DAY:
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            dc.hour = 0;
            break;
        case TimeUnit::WEEK: {
            // Get start of day in local time, then subtract to Sunday
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            dc.hour = 0;
            double localDayStart = componentsToTimestamp(dc);
            // dayOfWeek is already in local time from timestampToComponents
            return localDayStart - (static_cast<double>(dc.dayOfWeek) * MS_PER_DAY);
        }
        case TimeUnit::MONTH:
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            dc.hour = 0;
            dc.day = 1;
            break;
        case TimeUnit::YEAR:
            dc.millisecond = 0;
            dc.second = 0;
            dc.minute = 0;
            dc.hour = 0;
            dc.day = 1;
            dc.month = 1;
            break;
    }

    return componentsToTimestamp(dc);
}

HybridNativeDate::InternalDateComponents HybridNativeDate::timestampToComponents(double timestamp, bool useUTC) {
    int64_t ms = static_cast<int64_t>(timestamp);
    std::time_t seconds = ms / 1000;
    std::tm tmBuffer;
    std::tm* tm;

    if (useUTC) {
#if defined(_WIN32)
        gmtime_s(&tmBuffer, &seconds);
        tm = &tmBuffer;
#else
        tm = gmtime_r(&seconds, &tmBuffer);
#endif
    } else {
#if defined(_WIN32)
        localtime_s(&tmBuffer, &seconds);
        tm = &tmBuffer;
#else
        tm = localtime_r(&seconds, &tmBuffer);
#endif
    }

    InternalDateComponents dc;
    dc.year = tm->tm_year + 1900;
    dc.month = tm->tm_mon + 1;
    dc.day = tm->tm_mday;
    dc.hour = tm->tm_hour;
    dc.minute = tm->tm_min;
    dc.second = tm->tm_sec;
    dc.millisecond = ms % 1000;
    dc.dayOfWeek = tm->tm_wday; // 0 = Sunday

    return dc;
}

double HybridNativeDate::componentsToTimestamp(const InternalDateComponents& dc) {
    std::tm tm = {};
    tm.tm_year = dc.year - 1900;
    tm.tm_mon = dc.month - 1;
    tm.tm_mday = dc.day;
    tm.tm_hour = dc.hour;
    tm.tm_min = dc.minute;
    tm.tm_sec = dc.second;

#if defined(_WIN32)
    std::time_t time = _mkgmtime(&tm);
#else
    std::time_t time = timegm(&tm);
#endif

    return static_cast<double>(time) * 1000.0 + dc.millisecond;
}

double HybridNativeDate::parseISO8601(const std::string& dateString) {
    const char* s = dateString.c_str();
    const size_t len = dateString.length();

    // Minimum valid: "YYYY-MM-DD" (10 chars)
    if (len < 10) {
        throw std::invalid_argument("Unable to parse date string: " + dateString);
    }

    InternalDateComponents dc = {1970, 1, 1, 0, 0, 0, 0, 0};

    // Parse date: YYYY-MM-DD
    dc.year = parse4Digits(s);
    dc.month = parse2Digits(s + 5);
    dc.day = parse2Digits(s + 8);

    // Check for time component: T or space at position 10
    if (len > 10 && (s[10] == 'T' || s[10] == ' ')) {
        // Parse time: HH:mm:ss
        if (len >= 19) {
            dc.hour = parse2Digits(s + 11);
            dc.minute = parse2Digits(s + 14);
            dc.second = parse2Digits(s + 17);
        }

        // Parse milliseconds: .SSS
        size_t msStart = 19;
        if (len > msStart && s[msStart] == '.') {
            msStart++;
            int ms = 0;
            int digits = 0;
            while (msStart < len && s[msStart] >= '0' && s[msStart] <= '9' && digits < 3) {
                ms = ms * 10 + (s[msStart] - '0');
                msStart++;
                digits++;
            }
            // Pad to 3 digits
            while (digits < 3) { ms *= 10; digits++; }
            dc.millisecond = ms;
        }
    }

    double result = componentsToTimestamp(dc);

    // Handle timezone: Z or +HH:mm or -HH:mm
    // Find timezone indicator from the end
    if (len > 0) {
        if (s[len - 1] == 'Z') {
            // UTC - already correct
        } else {
            // Look for + or - for timezone offset
            for (size_t i = len - 1; i > 10; i--) {
                if (s[i] == '+' || s[i] == '-') {
                    bool negative = (s[i] == '-');
                    int tzHours = 0;
                    int tzMinutes = 0;

                    // Parse timezone hours
                    if (i + 2 < len) {
                        tzHours = parse2Digits(s + i + 1);
                    }
                    // Parse timezone minutes (may have colon or not)
                    if (i + 4 < len) {
                        size_t minStart = (s[i + 3] == ':') ? i + 4 : i + 3;
                        if (minStart + 1 < len) {
                            tzMinutes = parse2Digits(s + minStart);
                        }
                    }

                    int offsetMs = (tzHours * 60 + tzMinutes) * 60 * 1000;
                    result += negative ? offsetMs : -offsetMs;
                    break;
                }
            }
        }
    }

    return result;
}

std::string HybridNativeDate::padZero(int value, int width) {
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

int HybridNativeDate::getDayOfWeek(double timestamp) {
    // Calculate day of week (0 = Sunday, 6 = Saturday)
    // Using the fact that Jan 1, 1970 was a Thursday (day 4)
    int64_t ms = static_cast<int64_t>(timestamp);
    if (ms >= 0) {
        int64_t days = ms / MS_PER_DAY;
        return static_cast<int>((days + 4) % 7);
    }
    int64_t days = floorDiv(ms, MS_PER_DAY);
    return static_cast<int>(posMod(days + 4, static_cast<int64_t>(7)));
}

// MARK: - New Timezone Methods

double HybridNativeDate::getTimezoneOffsetForTimestamp(double timestamp) {
    // Get the offset at a specific timestamp for the device's timezone
    // This properly handles DST using platform APIs
    std::string systemTz = TimezoneHelper::getSystemTimezone();
    int64_t timestampMs = static_cast<int64_t>(timestamp);
    return static_cast<double>(TimezoneHelper::getOffsetForTimestamp(systemTz, timestampMs));
}

double HybridNativeDate::getOffsetInTimezone(double timestamp, const std::string& timezone) {
    // Get the offset for a specific timezone at a specific timestamp
    // Returns offset in minutes (positive = east of UTC, negative = west)
    if (timezone == "UTC") {
        return 0;
    }
    std::string normalizedTz = TimezoneHelper::normalizeTimezone(timezone);
    int64_t timestampMs = static_cast<int64_t>(timestamp);
    return static_cast<double>(TimezoneHelper::getOffsetForTimestamp(normalizedTz, timestampMs));
}

double HybridNativeDate::toTimezone(double timestamp, const std::string& timezone) {
    if (timezone == "UTC") {
        return timestamp;
    }
    // Convert UTC timestamp to display time in the specified timezone
    // Uses platform timezone APIs which properly handle DST
    std::string normalizedTz = TimezoneHelper::normalizeTimezone(timezone);
    int64_t timestampMs = static_cast<int64_t>(timestamp);
    int offsetMinutes = TimezoneHelper::getOffsetForTimestamp(normalizedTz, timestampMs);
    return timestamp + (offsetMinutes * 60 * 1000);
}

std::string HybridNativeDate::formatInTimezone(double timestamp, const std::string& pattern, const std::string& timezone) {
    if (timezone == "UTC") {
        return formatUTC(timestamp, pattern);
    }
    // Adjust timestamp to target timezone, then format as UTC
    // (since toTimezone already applies the timezone offset)
    double adjustedTimestamp = toTimezone(timestamp, timezone);
    return formatUTC(adjustedTimestamp, pattern);
}

std::vector<std::string> HybridNativeDate::getAvailableTimezones() {
    // Get all available timezones from the platform
    return TimezoneHelper::getAvailableTimezones();
}

bool HybridNativeDate::isValidTimezone(const std::string& timezone) {
    // Validate timezone using platform APIs
    return TimezoneHelper::isValidTimezone(timezone);
}

// MARK: - Timezone-aware predicates (InTz)

bool HybridNativeDate::isTodayInTz(double timestamp, const std::string& timezone) {
    // Format both dates as yyyy-MM-dd in the target timezone and compare
    std::string dateStr = formatInTimezone(timestamp, "yyyy-MM-dd", timezone);
    std::string todayStr = formatInTimezone(now(), "yyyy-MM-dd", timezone);
    return dateStr == todayStr;
}

bool HybridNativeDate::isTomorrowInTz(double timestamp, const std::string& timezone) {
    // Get tomorrow's timestamp (add 1 day to now)
    double tomorrowTs = add(now(), 1, TimeUnit::DAY);
    std::string dateStr = formatInTimezone(timestamp, "yyyy-MM-dd", timezone);
    std::string tomorrowStr = formatInTimezone(tomorrowTs, "yyyy-MM-dd", timezone);
    return dateStr == tomorrowStr;
}

bool HybridNativeDate::isYesterdayInTz(double timestamp, const std::string& timezone) {
    // Get yesterday's timestamp (subtract 1 day from now)
    double yesterdayTs = subtract(now(), 1, TimeUnit::DAY);
    std::string dateStr = formatInTimezone(timestamp, "yyyy-MM-dd", timezone);
    std::string yesterdayStr = formatInTimezone(yesterdayTs, "yyyy-MM-dd", timezone);
    return dateStr == yesterdayStr;
}

bool HybridNativeDate::isSameDayInTz(double timestamp1, double timestamp2, const std::string& timezone) {
    // Format both as yyyy-MM-dd in timezone and compare
    std::string date1 = formatInTimezone(timestamp1, "yyyy-MM-dd", timezone);
    std::string date2 = formatInTimezone(timestamp2, "yyyy-MM-dd", timezone);
    return date1 == date2;
}

bool HybridNativeDate::isSameMonthInTz(double timestamp1, double timestamp2, const std::string& timezone) {
    // Format both as yyyy-MM in timezone and compare
    std::string date1 = formatInTimezone(timestamp1, "yyyy-MM", timezone);
    std::string date2 = formatInTimezone(timestamp2, "yyyy-MM", timezone);
    return date1 == date2;
}

bool HybridNativeDate::isSameYearInTz(double timestamp1, double timestamp2, const std::string& timezone) {
    // Format both as yyyy in timezone and compare
    std::string date1 = formatInTimezone(timestamp1, "yyyy", timezone);
    std::string date2 = formatInTimezone(timestamp2, "yyyy", timezone);
    return date1 == date2;
}

double HybridNativeDate::startOfDayInTz(double timestamp, const std::string& timezone) {
    // Get the date string in target timezone (e.g., "2024-06-15")
    std::string dateStr = formatInTimezone(timestamp, "yyyy-MM-dd", timezone);

    // Parse as UTC midnight for that date
    std::string utcMidnightStr = dateStr + "T00:00:00.000Z";
    double utcMidnight = parseISO8601(utcMidnightStr);

    // Get offset for target timezone at that time (in minutes)
    double offsetMinutes = getOffsetInTimezone(utcMidnight, timezone);

    // Adjust: if timezone is UTC-7 (offset=-420), midnight local = 07:00 UTC
    // So we SUBTRACT the offset (negative offset means we ADD hours)
    return utcMidnight - (offsetMinutes * 60 * 1000);
}

double HybridNativeDate::endOfDayInTz(double timestamp, const std::string& timezone) {
    // End of day = start of next day - 1ms
    double nextDay = add(timestamp, 1, TimeUnit::DAY);
    return startOfDayInTz(nextDay, timezone) - 1;
}

// MARK: - Locale

std::string HybridNativeDate::getLocale() {
    return LocaleHelper::getCurrentLocale();
}

bool HybridNativeDate::setLocale(const std::string& locale) {
    return LocaleHelper::setLocale(locale);
}

std::vector<std::string> HybridNativeDate::getAvailableLocales() {
    return LocaleHelper::getAvailableLocales();
}

// MARK: - Async Batch Operations

std::shared_ptr<Promise<std::vector<double>>> HybridNativeDate::parseManyAsync(const std::vector<std::string>& dateStrings) {
    // Capture dateStrings by value for thread safety
    return Promise<std::vector<double>>::async([dateStrings]() -> std::vector<double> {
        std::vector<double> results;
        results.reserve(dateStrings.size());

        for (const auto& dateString : dateStrings) {
            try {
                results.push_back(parseISO8601(dateString));
            } catch (...) {
                // On error, push NaN to indicate invalid date
                results.push_back(std::numeric_limits<double>::quiet_NaN());
            }
        }

        return results;
    });
}

std::shared_ptr<Promise<std::vector<std::string>>> HybridNativeDate::formatManyAsync(const std::vector<double>& timestamps, const std::string& pattern) {
    // Capture by value for thread safety
    return Promise<std::vector<std::string>>::async([timestamps, pattern]() -> std::vector<std::string> {
        std::vector<std::string> results;
        results.reserve(timestamps.size());

        for (double timestamp : timestamps) {
            InternalDateComponents dc = timestampToComponents(timestamp);

            std::string result = pattern;

            // Replace patterns
            auto replacePattern = [&result](const std::string& pat, const std::string& value) {
                size_t pos = 0;
                while ((pos = result.find(pat, pos)) != std::string::npos) {
                    result.replace(pos, pat.length(), value);
                    pos += value.length();
                }
            };

            replacePattern("yyyy", std::to_string(dc.year));
            replacePattern("MM", padZero(dc.month));
            replacePattern("dd", padZero(dc.day));
            replacePattern("HH", padZero(dc.hour));
            replacePattern("mm", padZero(dc.minute));
            replacePattern("ss", padZero(dc.second));
            replacePattern("SSS", padZero(dc.millisecond, 3));

            results.push_back(result);
        }

        return results;
    });
}

std::shared_ptr<Promise<std::vector<DateComponents>>> HybridNativeDate::getComponentsManyAsync(const std::vector<double>& timestamps) {
    // Capture by value for thread safety
    return Promise<std::vector<DateComponents>>::async([timestamps]() -> std::vector<DateComponents> {
        std::vector<DateComponents> results;
        results.reserve(timestamps.size());

        for (double timestamp : timestamps) {
            InternalDateComponents dc = timestampToComponents(timestamp);
            int dayOfWeek = getDayOfWeek(timestamp);

            results.push_back(DateComponents(
                static_cast<double>(dc.year),
                static_cast<double>(dc.month),
                static_cast<double>(dc.day),
                static_cast<double>(dc.hour),
                static_cast<double>(dc.minute),
                static_cast<double>(dc.second),
                static_cast<double>(dc.millisecond),
                static_cast<double>(dayOfWeek)
            ));
        }

        return results;
    });
}

std::string HybridNativeDate::getLocaleDisplayName(const std::string& localeCode) {
    return LocaleHelper::getLocaleDisplayName(localeCode);
}

LocaleInfo HybridNativeDate::getLocaleInfo(const std::string& localeCode) {
    LocaleInfoData data = LocaleHelper::getLocaleInfo(localeCode);
    return LocaleInfo(
        data.code,
        data.languageCode,
        data.regionCode,
        data.displayName,
        data.nativeName
    );
}

std::vector<LocaleInfo> HybridNativeDate::getAvailableLocalesInfo() {
    std::vector<LocaleInfoData> dataList = LocaleHelper::getAvailableLocalesInfo();
    std::vector<LocaleInfo> result;
    result.reserve(dataList.size());

    for (const auto& data : dataList) {
        result.push_back(LocaleInfo(
            data.code,
            data.languageCode,
            data.regionCode,
            data.displayName,
            data.nativeName
        ));
    }

    return result;
}

} // namespace margelo::nitro::rnpackages_nativedate
