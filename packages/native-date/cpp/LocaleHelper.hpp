#pragma once

#include "core/LocaleCache.hpp"
#include "core/Providers.hpp"

#include <memory>
#include <string>
#include <vector>

namespace margelo::nitro::rnpackages_nativedate {

/**
 * Locale information structure
 */
struct LocaleInfoData {
    std::string code;
    std::string languageCode;
    std::string regionCode;
    std::string displayName;
    std::string nativeName;
};

/**
 * Platform-specific locale helper for localized date names
 * Uses NSDateFormatter on iOS and android.icu DateFormatSymbols on Android.
 *
 * Names live in an immutable `LocaleCache` snapshot held by a `LocaleStore`.
 * On first use, if `setLocale()` was never called, the device locale is loaded
 * (outside the lock) and installed; `setLocale()` builds a fresh snapshot and
 * swaps it in. Readers index the snapshot they hold, so a concurrent
 * `setLocale()` can never invalidate what they read.
 */
class LocaleHelper {
public:
    /**
     * Get the effective locale code: the one passed to `setLocale()`, or the
     * device language (e.g. "en", "es") when nothing was set.
     */
    static std::string getCurrentLocale();

    /**
     * Set the locale for date formatting
     * @param locale Locale code (e.g., "en", "es", "pt-BR"; "pt_BR" is accepted too)
     * @return true if the locale is available on the device and its names loaded
     */
    static bool setLocale(const std::string& locale);

    /**
     * Get all available locale codes
     * @return Vector of locale codes
     */
    static std::vector<std::string> getAvailableLocales();

    /**
     * Check if a locale is valid/supported
     * @param locale Locale code to validate
     * @return true if the locale is supported
     */
    static bool isValidLocale(const std::string& locale);

    /**
     * Get localized month name
     * @param month Month number (1-12)
     * @param form Name length; `Short` falls back to `Abbreviated` for months
     * @return Localized month name; empty when out of range or no locale could be loaded
     */
    static std::string monthName(int month, nativedate::core::NameForm form);

    /**
     * Get localized day name
     * @param dayOfWeek Day of week (0 = Sunday, 6 = Saturday)
     * @param form Name length
     * @return Localized day name; empty when out of range or no locale could be loaded
     */
    static std::string dayName(int dayOfWeek, nativedate::core::NameForm form);

    /**
     * Get display name for a locale code (in English)
     * @param localeCode Locale code (e.g., "en_US", "es")
     * @return Display name (e.g., "English (United States)")
     */
    static std::string getLocaleDisplayName(const std::string& localeCode);

    /**
     * Get full locale information for a locale code
     * @param localeCode Locale code (e.g., "en_US", "es")
     * @return LocaleInfoData with all locale information
     */
    static LocaleInfoData getLocaleInfo(const std::string& localeCode);

    /**
     * Get full locale information for all available locales
     * @return Vector of LocaleInfoData for all available locales
     */
    static std::vector<LocaleInfoData> getAvailableLocalesInfo();

private:
    static nativedate::core::LocaleStore store_;

    /** Current snapshot, loading the device locale on first use. May be nullptr if loading failed. */
    static std::shared_ptr<const nativedate::core::LocaleCache> names();

    /**
     * Platform-specific loading of the device locale's names (implemented in .mm/.cpp).
     * Runs with no lock held; returns nullptr when the platform cannot supply them.
     */
    static std::shared_ptr<const nativedate::core::LocaleCache> loadDefaultFromPlatform();
};

inline std::shared_ptr<const nativedate::core::LocaleCache> LocaleHelper::names() {
    return store_.snapshot(&LocaleHelper::loadDefaultFromPlatform);
}

inline std::string LocaleHelper::monthName(int month, nativedate::core::NameForm form) {
    const auto snapshot = names();
    return snapshot ? std::string(snapshot->monthName(month, form)) : std::string();
}

inline std::string LocaleHelper::dayName(int dayOfWeek, nativedate::core::NameForm form) {
    const auto snapshot = names();
    return snapshot ? std::string(snapshot->dayName(dayOfWeek, form)) : std::string();
}

} // namespace margelo::nitro::rnpackages_nativedate
