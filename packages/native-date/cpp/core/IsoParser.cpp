#include "IsoParser.hpp"

#include "Civil.hpp"
#include "Digits.hpp"

#include <stdexcept>

namespace nativedate::core {

double parseISO8601(const std::string& dateString) {
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

    // Check for timezone indicator: Z or +/- offset
    bool hasTimezone = false;
    int tzOffsetMs = 0;

    if (len > 0 && s[len - 1] == 'Z') {
        hasTimezone = true;
        // UTC - no offset needed
    } else if (len > 10) {
        // Look for + or - for timezone offset
        for (size_t i = len - 1; i > 10; i--) {
            if (s[i] == '+' || s[i] == '-') {
                hasTimezone = true;
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

                tzOffsetMs = (tzHours * 60 + tzMinutes) * 60 * 1000;
                if (!negative) {
                    tzOffsetMs = -tzOffsetMs; // Positive offset means subtract from UTC
                }
                break;
            }
        }
    }

    // If no timezone indicator, interpret as LOCAL time (like date-fns)
    // If has timezone, interpret as UTC and apply offset
    if (hasTimezone) {
        double result = componentsToTimestamp(dc); // UTC
        return result + tzOffsetMs;
    } else {
        return componentsToTimestampLocal(dc); // Local time
    }
}

} // namespace nativedate::core
