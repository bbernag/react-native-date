#pragma once

#include "Providers.hpp"

#include <array>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <string_view>
#include <vector>

// Immutable locale-name snapshot, the store that swaps it atomically, and the
// pure string helpers the platform loaders use to build one (UTF-8 validation,
// code-point slicing, locale-id normalization). No platform headers here.

namespace nativedate::core {

/**
 * Month and weekday names for one locale, complete and valid UTF-8.
 *
 * Instances are immutable once built; readers hold a `shared_ptr<const>` and
 * index it without any lock. Build one with `makeLocaleCache`.
 */
struct LocaleCache {
    /** Identifier the names were loaded for, e.g. "en", "pt-BR". */
    std::string localeId;

    // Index 0 = January .. 11 = December
    std::array<std::string, 12> monthNames;      // January, February, ...
    std::array<std::string, 12> monthNamesShort; // Jan, Feb, ...
    std::array<std::string, 12> monthMinimal;    // J, F, M, ...

    // Index 0 = Sunday .. 6 = Saturday
    std::array<std::string, 7> dayNames;      // Sunday, Monday, ...
    std::array<std::string, 7> dayNamesShort; // Sun, Mon, ...
    std::array<std::string, 7> dayVeryShort;  // Su, Mo, ...
    std::array<std::string, 7> dayMinimal;    // S, M, T, ...

    /** Name of `month` (1..12) in `form`; empty when out of range. `Short` falls back to `Abbreviated`. */
    std::string_view monthName(int month, NameForm form) const noexcept;

    /** Name of `dayOfWeek` (0 = Sunday .. 6) in `form`; empty when out of range. */
    std::string_view dayName(int dayOfWeek, NameForm form) const noexcept;
};

/**
 * Raw name lists as returned by a platform, before validation.
 */
struct LocaleNameLists {
    std::vector<std::string> monthNames;
    std::vector<std::string> monthNamesShort;
    std::vector<std::string> monthMinimal;
    std::vector<std::string> dayNames;
    std::vector<std::string> dayNamesShort;
    std::vector<std::string> dayVeryShort;
    std::vector<std::string> dayMinimal;
};

/**
 * Validate `lists` and freeze them into a snapshot.
 *
 * Fails closed: returns nullptr when any month list does not hold exactly 12
 * entries, any day list does not hold exactly 7, any entry is empty, or any
 * entry is not well-formed UTF-8.
 */
std::shared_ptr<const LocaleCache> makeLocaleCache(std::string localeId, LocaleNameLists lists);

/**
 * Keep the first `count` entries of `list`.
 *
 * Returns false when `list` is shorter than `count` (fail closed). Extra
 * entries are dropped so ICU's 13-slot month array (and similar pads) can be
 * reduced to Gregorian 12/7 before `makeLocaleCache`.
 */
bool keepPrefix(std::vector<std::string>& list, size_t count);

/**
 * Holder of the current `LocaleCache` snapshot.
 *
 * The only mutable state is the pointer, guarded by a mutex that is never held
 * while platform code runs: `snapshot()` copies the pointer under the lock,
 * loads the default outside it, and installs the result only if nothing else
 * was installed in the meantime. `replace()` swaps a fully built snapshot in.
 */
class LocaleStore {
public:
    using Loader = std::function<std::shared_ptr<const LocaleCache>()>;

    /**
     * Current snapshot; when none is installed yet, `loadDefault` is run
     * outside the lock and its result installed (an explicit `replace` that
     * raced in wins). Returns nullptr only when the loader returned nullptr,
     * in which case the next call tries again.
     */
    std::shared_ptr<const LocaleCache> snapshot(const Loader& loadDefault);

    /** Current snapshot without loading; nullptr when none is installed. */
    std::shared_ptr<const LocaleCache> peek() const;

    /** Install `next` as the current snapshot. Ignores nullptr. */
    void replace(std::shared_ptr<const LocaleCache> next);

private:
    mutable std::mutex mutex_;
    std::shared_ptr<const LocaleCache> current_;
};

// MARK: - Locale identifiers

/** Longest locale identifier accepted from callers. */
inline constexpr size_t kMaxLocaleIdLength = 64;

/** Replace every '_' with '-' so "en_US" and "en-US" name the same locale. */
std::string normalizeLocaleId(std::string_view localeId);

/**
 * Whether `localeId` is safe to hand to platform string APIs: non-empty, at most
 * `kMaxLocaleIdLength` bytes, and only `[A-Za-z0-9-]` (run `normalizeLocaleId` first).
 */
bool isSafeLocaleTag(std::string_view localeId);

/** Case-insensitive comparison after normalizing both identifiers. */
bool localeIdsEqual(std::string_view a, std::string_view b);

// MARK: - UTF-8

/** Whether `text` is well-formed UTF-8 (no overlongs, surrogates, or code points above U+10FFFF). */
bool isValidUtf8(std::string_view text);

/**
 * The first `count` code points of `text`. Never splits a multi-byte sequence;
 * a malformed byte counts as one code point so the result is always a prefix.
 */
std::string utf8Prefix(std::string_view text, size_t count);

/** Convert UTF-16 (JNI `jchar` / NSString order) to UTF-8; lone surrogates become U+FFFD. */
std::string utf8FromUtf16(std::u16string_view text);

} // namespace nativedate::core
