#pragma once

// Fast inline digit parsing shared by the ISO and pattern parsers
// (no validation, assumes valid input).

namespace nativedate::core {

inline int parse2Digits(const char* s) {
    return (s[0] - '0') * 10 + (s[1] - '0');
}

inline int parse4Digits(const char* s) {
    return (s[0] - '0') * 1000 + (s[1] - '0') * 100 + (s[2] - '0') * 10 + (s[3] - '0');
}

} // namespace nativedate::core
