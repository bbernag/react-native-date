#include "PatternParser.hpp"

#include "Civil.hpp"
#include "Digits.hpp"

#include <limits>

namespace nativedate::core {

double parseWithFormat(const std::string& dateString, const std::string& pattern) {
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

    // No timezone in format patterns - interpret as local time (like date-fns)
    return componentsToTimestampLocal(dc);
}

} // namespace nativedate::core
