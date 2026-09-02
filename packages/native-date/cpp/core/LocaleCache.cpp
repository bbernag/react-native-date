#include "LocaleCache.hpp"

#include <algorithm>
#include <cstdint>
#include <utility>

namespace nativedate::core {

// MARK: - LocaleCache

std::string_view LocaleCache::monthName(int month, NameForm form) const noexcept {
    if (month < 1 || month > 12) {
        return {};
    }
    const size_t index = static_cast<size_t>(month - 1);
    switch (form) {
        case NameForm::Full:
            return monthNames[index];
        case NameForm::Abbreviated:
        case NameForm::Short:
            return monthNamesShort[index];
        case NameForm::Narrow:
            return monthMinimal[index];
    }
    return monthNames[index];
}

std::string_view LocaleCache::dayName(int dayOfWeek, NameForm form) const noexcept {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
        return {};
    }
    const size_t index = static_cast<size_t>(dayOfWeek);
    switch (form) {
        case NameForm::Full:
            return dayNames[index];
        case NameForm::Abbreviated:
            return dayNamesShort[index];
        case NameForm::Short:
            return dayVeryShort[index];
        case NameForm::Narrow:
            return dayMinimal[index];
    }
    return dayNames[index];
}

namespace {

template <size_t N>
bool freezeList(std::vector<std::string>& source, std::array<std::string, N>& target) {
    if (source.size() != N) {
        return false;
    }
    for (size_t i = 0; i < N; i++) {
        if (source[i].empty() || !isValidUtf8(source[i])) {
            return false;
        }
        target[i] = std::move(source[i]);
    }
    return true;
}

} // namespace

bool keepPrefix(std::vector<std::string>& list, size_t count) {
    if (list.size() < count) {
        return false;
    }
    list.resize(count);
    return true;
}

std::shared_ptr<const LocaleCache> makeLocaleCache(std::string localeId, LocaleNameLists lists) {
    auto cache = std::make_shared<LocaleCache>();
    cache->localeId = std::move(localeId);
    const bool complete = freezeList(lists.monthNames, cache->monthNames) &&
                          freezeList(lists.monthNamesShort, cache->monthNamesShort) &&
                          freezeList(lists.monthMinimal, cache->monthMinimal) &&
                          freezeList(lists.dayNames, cache->dayNames) &&
                          freezeList(lists.dayNamesShort, cache->dayNamesShort) &&
                          freezeList(lists.dayVeryShort, cache->dayVeryShort) &&
                          freezeList(lists.dayMinimal, cache->dayMinimal);
    if (!complete) {
        return nullptr;
    }
    return cache;
}

// MARK: - LocaleStore

std::shared_ptr<const LocaleCache> LocaleStore::snapshot(const Loader& loadDefault) {
    {
        std::lock_guard<std::mutex> lock(mutex_);
        if (current_) {
            return current_;
        }
    }

    // Platform work runs with no lock held; a concurrent loader or replace()
    // may install a snapshot first, in which case theirs is kept.
    std::shared_ptr<const LocaleCache> loaded = loadDefault();

    std::lock_guard<std::mutex> lock(mutex_);
    if (!current_ && loaded) {
        current_ = std::move(loaded);
    }
    return current_;
}

std::shared_ptr<const LocaleCache> LocaleStore::peek() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return current_;
}

void LocaleStore::replace(std::shared_ptr<const LocaleCache> next) {
    if (!next) {
        return;
    }
    std::shared_ptr<const LocaleCache> previous;
    {
        std::lock_guard<std::mutex> lock(mutex_);
        previous = std::exchange(current_, std::move(next));
    }
    // `previous` is released here, outside the lock.
}

// MARK: - Locale identifiers

std::string normalizeLocaleId(std::string_view localeId) {
    std::string result(localeId);
    std::replace(result.begin(), result.end(), '_', '-');
    return result;
}

namespace {

// ASCII-only classification: <cctype> depends on the process C locale.
bool isAsciiAlnum(char c) {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9');
}

char asciiLower(char c) {
    return (c >= 'A' && c <= 'Z') ? static_cast<char>(c - 'A' + 'a') : c;
}

} // namespace

bool isSafeLocaleTag(std::string_view localeId) {
    if (localeId.empty() || localeId.size() > kMaxLocaleIdLength) {
        return false;
    }
    return std::all_of(localeId.begin(), localeId.end(), [](char c) { return isAsciiAlnum(c) || c == '-'; });
}

bool localeIdsEqual(std::string_view a, std::string_view b) {
    if (a.size() != b.size()) {
        return false;
    }
    for (size_t i = 0; i < a.size(); i++) {
        const char ca = a[i] == '_' ? '-' : a[i];
        const char cb = b[i] == '_' ? '-' : b[i];
        if (asciiLower(ca) != asciiLower(cb)) {
            return false;
        }
    }
    return true;
}

// MARK: - UTF-8

namespace {

/**
 * Length in bytes of the well-formed UTF-8 sequence starting at `text[pos]`,
 * or 0 when the bytes there are malformed.
 */
size_t utf8SequenceLength(std::string_view text, size_t pos) {
    const auto byte = [&](size_t i) -> int {
        return i < text.size() ? static_cast<unsigned char>(text[i]) : -1;
    };
    const auto isContinuation = [](int b) { return b >= 0x80 && b <= 0xBF; };

    const int lead = byte(pos);
    if (lead < 0x80) {
        return 1;
    }
    if (lead < 0xC2) {
        return 0; // continuation byte or overlong 2-byte lead
    }
    if (lead < 0xE0) {
        return isContinuation(byte(pos + 1)) ? 2 : 0;
    }
    if (lead < 0xF0) {
        const int b1 = byte(pos + 1);
        if (!isContinuation(b1) || !isContinuation(byte(pos + 2))) {
            return 0;
        }
        if (lead == 0xE0 && b1 < 0xA0) {
            return 0; // overlong
        }
        if (lead == 0xED && b1 >= 0xA0) {
            return 0; // UTF-16 surrogate
        }
        return 3;
    }
    if (lead < 0xF5) {
        const int b1 = byte(pos + 1);
        if (!isContinuation(b1) || !isContinuation(byte(pos + 2)) || !isContinuation(byte(pos + 3))) {
            return 0;
        }
        if (lead == 0xF0 && b1 < 0x90) {
            return 0; // overlong
        }
        if (lead == 0xF4 && b1 >= 0x90) {
            return 0; // above U+10FFFF
        }
        return 4;
    }
    return 0;
}

void appendCodePoint(std::string& out, uint32_t codePoint) {
    if (codePoint < 0x80) {
        out.push_back(static_cast<char>(codePoint));
    } else if (codePoint < 0x800) {
        out.push_back(static_cast<char>(0xC0 | (codePoint >> 6)));
        out.push_back(static_cast<char>(0x80 | (codePoint & 0x3F)));
    } else if (codePoint < 0x10000) {
        out.push_back(static_cast<char>(0xE0 | (codePoint >> 12)));
        out.push_back(static_cast<char>(0x80 | ((codePoint >> 6) & 0x3F)));
        out.push_back(static_cast<char>(0x80 | (codePoint & 0x3F)));
    } else {
        out.push_back(static_cast<char>(0xF0 | (codePoint >> 18)));
        out.push_back(static_cast<char>(0x80 | ((codePoint >> 12) & 0x3F)));
        out.push_back(static_cast<char>(0x80 | ((codePoint >> 6) & 0x3F)));
        out.push_back(static_cast<char>(0x80 | (codePoint & 0x3F)));
    }
}

constexpr uint32_t kReplacementCharacter = 0xFFFD;

} // namespace

bool isValidUtf8(std::string_view text) {
    size_t pos = 0;
    while (pos < text.size()) {
        const size_t length = utf8SequenceLength(text, pos);
        if (length == 0) {
            return false;
        }
        pos += length;
    }
    return true;
}

std::string utf8Prefix(std::string_view text, size_t count) {
    size_t pos = 0;
    size_t taken = 0;
    while (pos < text.size() && taken < count) {
        const size_t length = utf8SequenceLength(text, pos);
        pos += length == 0 ? 1 : length;
        taken++;
    }
    return std::string(text.substr(0, pos));
}

std::string utf8FromUtf16(std::u16string_view text) {
    std::string out;
    out.reserve(text.size());
    for (size_t i = 0; i < text.size(); i++) {
        const uint32_t unit = text[i];
        if (unit >= 0xD800 && unit <= 0xDBFF) {
            const bool hasLow = i + 1 < text.size() && text[i + 1] >= 0xDC00 && text[i + 1] <= 0xDFFF;
            if (hasLow) {
                const uint32_t low = text[i + 1];
                appendCodePoint(out, 0x10000 + ((unit - 0xD800) << 10) + (low - 0xDC00));
                i++;
            } else {
                appendCodePoint(out, kReplacementCharacter);
            }
        } else if (unit >= 0xDC00 && unit <= 0xDFFF) {
            appendCodePoint(out, kReplacementCharacter);
        } else {
            appendCodePoint(out, unit);
        }
    }
    return out;
}

} // namespace nativedate::core
