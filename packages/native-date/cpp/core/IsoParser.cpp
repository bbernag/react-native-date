#include "IsoParser.hpp"

#include "Civil.hpp"

#include <cstddef>
#include <stdexcept>
#include <string>
#include <string_view>

namespace nativedate::core {

namespace {

// Longest input the parser accepts. The longest valid form,
// "YYYY-MM-DDTHH:mm:ss.SSSSSSSSS+hh:mm", is 35 characters; the cap only bounds
// the work done on the JS thread and the size of error messages (B-07).
constexpr std::size_t kMaxInputLength = 128;

// How much of the offending input an error message quotes (B-07).
constexpr std::size_t kMaxQuotedLength = 64;

// Accepted calendar-year range. Four digits are mandatory, so this is the full
// range the grammar can express; it is spelled out so callers can rely on it.
constexpr int kMinYear = 0;
constexpr int kMaxYear = 9999;

// Maximum number of fractional-second digits (nanosecond precision). Digits
// beyond the third are validated but discarded: the fraction is TRUNCATED to
// milliseconds, never rounded, so "….9999Z" is 999 ms, not the next second.
constexpr std::size_t kMaxFractionDigits = 9;

[[noreturn]] void fail(std::string_view input, const char* reason) {
    std::string message = "Invalid ISO-8601 date string (";
    message += reason;
    message += "): '";
    if (input.size() > kMaxQuotedLength) {
        message.append(input.data(), kMaxQuotedLength);
        message += "...";
    } else {
        message.append(input.data(), input.size());
    }
    message += '\'';
    throw std::invalid_argument(message);
}

inline bool isAsciiDigit(char c) {
    return c >= '0' && c <= '9';
}

// Read exactly `count` ASCII digits at `s[pos]`. Returns false when the input
// is too short or any character is not a digit.
bool readDigits(std::string_view s, std::size_t pos, std::size_t count, int& out) {
    if (pos + count > s.size()) return false;
    int value = 0;
    for (std::size_t i = 0; i < count; ++i) {
        const char c = s[pos + i];
        if (!isAsciiDigit(c)) return false;
        value = value * 10 + (c - '0');
    }
    out = value;
    return true;
}

} // namespace

// Grammar (strict; every separator and range is checked):
//
//   date     := YYYY '-' MM '-' DD
//   time     := ('T' | ' ') HH ':' mm [ ':' ss [ '.' S{1,9} ] ]
//   offset   := 'Z' | ('+' | '-') hh [ [':'] mm ]
//   input    := date [ time ] [ offset ]
//
// - Year 0000-9999, month 01-12, day 01..daysInMonth, hour 00-23, minute and
//   second 00-59. "24:00:00" is rejected (use the next day's midnight).
// - Offset hours 00-23, minutes 00-59. Nothing may follow the offset.
// - A designator (`Z` or a numeric offset) makes the value an absolute instant;
//   without one the wall clock is interpreted as LOCAL time, including the
//   date-only form (v2 contract, matches date-fns and differs from Date.parse).
// - Uppercase `T` and `Z` only; a single space may replace `T`.
double parseISO8601(const std::string& dateString) {
    const std::string_view s(dateString);

    if (s.size() > kMaxInputLength) fail(s, "input longer than 128 characters");
    if (s.size() < 10) fail(s, "expected YYYY-MM-DD");

    InternalDateComponents dc = {1970, 1, 1, 0, 0, 0, 0, 0};

    // Date: YYYY-MM-DD
    if (!readDigits(s, 0, 4, dc.year) || s[4] != '-' ||
        !readDigits(s, 5, 2, dc.month) || s[7] != '-' ||
        !readDigits(s, 8, 2, dc.day)) {
        fail(s, "expected YYYY-MM-DD");
    }
    if (dc.year < kMinYear || dc.year > kMaxYear) fail(s, "year out of range");
    if (dc.month < 1 || dc.month > 12) fail(s, "month out of range");
    if (dc.day < 1 || dc.day > daysInMonth(dc.year, dc.month)) fail(s, "day out of range");

    std::size_t pos = 10;

    // Time: (T| )HH:mm[:ss[.S{1,9}]]
    if (pos < s.size() && (s[pos] == 'T' || s[pos] == ' ')) {
        pos++;
        if (!readDigits(s, pos, 2, dc.hour)) fail(s, "expected HH:mm after the date");
        pos += 2;
        if (pos >= s.size() || s[pos] != ':') fail(s, "expected ':' between hours and minutes");
        pos++;
        if (!readDigits(s, pos, 2, dc.minute)) fail(s, "expected two-digit minutes");
        pos += 2;

        if (pos < s.size() && s[pos] == ':') {
            pos++;
            if (!readDigits(s, pos, 2, dc.second)) fail(s, "expected two-digit seconds");
            pos += 2;

            if (pos < s.size() && s[pos] == '.') {
                pos++;
                std::size_t digits = 0;
                int ms = 0;
                while (pos < s.size() && isAsciiDigit(s[pos])) {
                    if (digits < 3) ms = ms * 10 + (s[pos] - '0');
                    digits++;
                    pos++;
                }
                if (digits == 0 || digits > kMaxFractionDigits) {
                    fail(s, "expected 1-9 fractional-second digits");
                }
                while (digits < 3) {
                    ms *= 10;
                    digits++;
                }
                dc.millisecond = ms;
            }
        }

        if (dc.hour > 23) fail(s, "hour out of range");
        if (dc.minute > 59) fail(s, "minute out of range");
        if (dc.second > 59) fail(s, "second out of range");
    }

    // Offset: Z | ±hh[[:]mm]
    bool hasOffset = false;
    int64_t offsetMs = 0;
    if (pos < s.size()) {
        const char c = s[pos];
        if (c == 'Z') {
            hasOffset = true;
            pos++;
        } else if (c == '+' || c == '-') {
            hasOffset = true;
            pos++;
            int offsetHours = 0;
            int offsetMinutes = 0;
            if (!readDigits(s, pos, 2, offsetHours)) fail(s, "expected ±hh[:mm] offset");
            pos += 2;
            if (pos < s.size() && (s[pos] == ':' || isAsciiDigit(s[pos]))) {
                if (s[pos] == ':') pos++;
                if (!readDigits(s, pos, 2, offsetMinutes)) fail(s, "expected two-digit offset minutes");
                pos += 2;
            }
            if (offsetHours > 23 || offsetMinutes > 59) fail(s, "offset out of range");
            offsetMs = (static_cast<int64_t>(offsetHours) * 60 + offsetMinutes) * MS_PER_MINUTE;
            // "+05:00" means the wall clock is 5h AHEAD of UTC, so subtract.
            if (c == '+') offsetMs = -offsetMs;
        } else {
            fail(s, "unexpected character after the date");
        }
    }

    if (pos != s.size()) fail(s, "unexpected trailing characters");

    if (hasOffset) {
        return componentsToTimestamp(dc) + static_cast<double>(offsetMs);
    }
    return componentsToTimestampLocal(dc);
}

} // namespace nativedate::core
