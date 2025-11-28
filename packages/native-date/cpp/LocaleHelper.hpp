#pragma once

#include <string>
#include <vector>
#include <mutex>

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
 * Cached locale strings for fast lookup
 * Loaded once per locale, invalidated on setLocale()
 */
struct LocaleCache {
    bool loaded = false;
    std::string localeCode;

    // Month names (index 0-11 for months 1-12)
    std::vector<std::string> monthNames;        // January, February, ...
    std::vector<std::string> monthNamesShort;   // Jan, Feb, ...
    std::vector<std::string> monthMinimal;      // J, F, M, ...

    // Day names (index 0-6, Sunday=0)
    std::vector<std::string> dayNames;          // Sunday, Monday, ...
    std::vector<std::string> dayNamesShort;     // Sun, Mon, ...
    std::vector<std::string> dayVeryShort;      // Su, Mo, ...
    std::vector<std::string> dayMinimal;        // S, M, T, ...
};

/**
 * Platform-specific locale helper for localized date names
 * Uses NSDateFormatter on iOS and DateFormatSymbols on Android
 * Caches strings for fast repeated lookups (~1000x faster than bridge calls)
 */
class LocaleHelper {
public:
    /**
     * Get the current locale code
     * @return Locale code (e.g., "en", "es", "fr")
     */
    static std::string getCurrentLocale();

    /**
     * Set the locale for date formatting
     * @param locale Locale code (e.g., "en", "es", "fr")
     * @return true if the locale was set successfully
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
     * @param abbreviated If true, return abbreviated name (Jan vs January)
     * @return Localized month name
     */
    static std::string getMonthName(int month, bool abbreviated);

    /**
     * Get localized day name
     * @param dayOfWeek Day of week (0 = Sunday, 6 = Saturday)
     * @param abbreviated If true, return abbreviated name (Sun vs Sunday)
     * @return Localized day name
     */
    static std::string getDayName(int dayOfWeek, bool abbreviated);

    /**
     * Get very short/minimal localized day name (e.g., "S", "M", "T")
     * @param dayOfWeek Day of week (0 = Sunday, 6 = Saturday)
     * @return Single letter or very short day name
     */
    static std::string getDayMinimal(int dayOfWeek);

    /**
     * Get very short localized day name (e.g., "Su", "Mo", "Tu")
     * @param dayOfWeek Day of week (0 = Sunday, 6 = Saturday)
     * @return Two-letter day name
     */
    static std::string getDayVeryShort(int dayOfWeek);

    /**
     * Get very short/minimal localized month name (e.g., "J", "F", "M")
     * @param month Month number (1-12)
     * @return Single letter month name
     */
    static std::string getMonthMinimal(int month);

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
    // Cache storage
    static LocaleCache cache;
    static std::mutex cacheMutex;

    /**
     * Check if locale has been set (cache is loaded)
     * @throws std::runtime_error if setLocale() was not called
     */
    static void requireLocaleSet();

    /**
     * Platform-specific cache loading (implemented in .mm/.cpp)
     * Loads all month and day names in bulk for efficiency
     */
    static void loadCacheFromPlatform();
};

} // namespace margelo::nitro::rnpackages_nativedate
