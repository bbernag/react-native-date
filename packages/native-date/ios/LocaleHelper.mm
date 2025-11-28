#import <Foundation/Foundation.h>
#include "LocaleHelper.hpp"
#include <stdexcept>

namespace margelo::nitro::rnpackages_nativedate {

// Static member definitions
LocaleCache LocaleHelper::cache;
std::mutex LocaleHelper::cacheMutex;

// Current locale identifier (empty = system default)
static NSString* g_currentLocale = nil;

// Get NSLocale for current setting
static NSLocale* getCurrentNSLocale() {
    if (g_currentLocale != nil && g_currentLocale.length > 0) {
        return [NSLocale localeWithLocaleIdentifier:g_currentLocale];
    }
    return [NSLocale currentLocale];
}

void LocaleHelper::requireLocaleSet() {
    std::lock_guard<std::mutex> lock(cacheMutex);
    if (!cache.loaded) {
        throw std::runtime_error("Locale not set. Call setLocale() before using locale-dependent functions.");
    }
}

void LocaleHelper::loadCacheFromPlatform() {
    @autoreleasepool {
        NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
        [formatter setLocale:getCurrentNSLocale()];

        // Load month names (12 entries each)
        cache.monthNames.clear();
        cache.monthNamesShort.clear();
        cache.monthMinimal.clear();
        cache.monthNames.reserve(12);
        cache.monthNamesShort.reserve(12);
        cache.monthMinimal.reserve(12);

        NSArray<NSString *> *months = [formatter monthSymbols];
        NSArray<NSString *> *monthsShort = [formatter shortMonthSymbols];
        NSArray<NSString *> *monthsMinimal = [formatter veryShortMonthSymbols];

        for (int i = 0; i < 12; i++) {
            cache.monthNames.push_back(std::string([months[i] UTF8String]));
            cache.monthNamesShort.push_back(std::string([monthsShort[i] UTF8String]));
            cache.monthMinimal.push_back(std::string([monthsMinimal[i] UTF8String]));
        }

        // Load day names (7 entries each, Sunday=0)
        cache.dayNames.clear();
        cache.dayNamesShort.clear();
        cache.dayVeryShort.clear();
        cache.dayMinimal.clear();
        cache.dayNames.reserve(7);
        cache.dayNamesShort.reserve(7);
        cache.dayVeryShort.reserve(7);
        cache.dayMinimal.reserve(7);

        NSArray<NSString *> *days = [formatter weekdaySymbols];
        NSArray<NSString *> *daysShort = [formatter shortWeekdaySymbols];
        NSArray<NSString *> *daysMinimal = [formatter veryShortWeekdaySymbols];
        NSArray<NSString *> *daysVeryShort = [formatter shortStandaloneWeekdaySymbols];
        if (daysVeryShort == nil || daysVeryShort.count == 0) {
            daysVeryShort = daysShort;
        }

        for (int i = 0; i < 7; i++) {
            cache.dayNames.push_back(std::string([days[i] UTF8String]));
            cache.dayNamesShort.push_back(std::string([daysShort[i] UTF8String]));
            cache.dayMinimal.push_back(std::string([daysMinimal[i] UTF8String]));

            // Truncate veryShort to 2 characters
            NSString *veryShort = daysVeryShort[i];
            if (veryShort.length > 2) {
                veryShort = [veryShort substringToIndex:2];
            }
            cache.dayVeryShort.push_back(std::string([veryShort UTF8String]));
        }
    }
}

std::string LocaleHelper::getCurrentLocale() {
    @autoreleasepool {
        if (g_currentLocale != nil && g_currentLocale.length > 0) {
            return std::string([g_currentLocale UTF8String]);
        }
        // Return system locale's language code
        NSLocale *locale = [NSLocale currentLocale];
        NSString *languageCode = [locale languageCode];
        return std::string([languageCode UTF8String]);
    }
}

bool LocaleHelper::setLocale(const std::string& locale) {
    @autoreleasepool {
        NSString *localeId = [NSString stringWithUTF8String:locale.c_str()];

        // Verify locale is valid by trying to create it
        NSLocale *testLocale = [NSLocale localeWithLocaleIdentifier:localeId];
        if (testLocale == nil) {
            return false;
        }

        // Check if the locale has valid date symbols
        NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
        [formatter setLocale:testLocale];
        NSArray *monthSymbols = [formatter monthSymbols];

        if (monthSymbols == nil || monthSymbols.count == 0) {
            return false;
        }

        g_currentLocale = localeId;

        // Eagerly reload cache with new locale
        {
            std::lock_guard<std::mutex> lock(cacheMutex);
            loadCacheFromPlatform();
            cache.loaded = true;
        }

        return true;
    }
}

std::vector<std::string> LocaleHelper::getAvailableLocales() {
    @autoreleasepool {
        std::vector<std::string> result;

        // Get all available locale identifiers
        NSArray<NSString *> *localeIds = [NSLocale availableLocaleIdentifiers];

        // Extract unique language codes
        NSMutableSet<NSString *> *languageCodes = [NSMutableSet set];
        for (NSString *localeId in localeIds) {
            NSLocale *locale = [NSLocale localeWithLocaleIdentifier:localeId];
            NSString *languageCode = [locale languageCode];
            if (languageCode != nil && languageCode.length > 0) {
                [languageCodes addObject:languageCode];
            }
        }

        // Sort alphabetically
        NSArray<NSString *> *sortedCodes = [[languageCodes allObjects] sortedArrayUsingSelector:@selector(compare:)];

        result.reserve([sortedCodes count]);
        for (NSString *code in sortedCodes) {
            result.push_back(std::string([code UTF8String]));
        }

        return result;
    }
}

bool LocaleHelper::isValidLocale(const std::string& locale) {
    @autoreleasepool {
        NSString *localeId = [NSString stringWithUTF8String:locale.c_str()];
        NSLocale *testLocale = [NSLocale localeWithLocaleIdentifier:localeId];

        if (testLocale == nil) {
            return false;
        }

        // Verify it has date symbols
        NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
        [formatter setLocale:testLocale];
        NSArray *monthSymbols = [formatter monthSymbols];

        return monthSymbols != nil && monthSymbols.count > 0;
    }
}

std::string LocaleHelper::getMonthName(int month, bool abbreviated) {
    if (month < 1 || month > 12) {
        return "";
    }

    requireLocaleSet();

    int index = month - 1;
    if (abbreviated) {
        return cache.monthNamesShort[index];
    }
    return cache.monthNames[index];
}

std::string LocaleHelper::getDayName(int dayOfWeek, bool abbreviated) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
        return "";
    }

    requireLocaleSet();

    if (abbreviated) {
        return cache.dayNamesShort[dayOfWeek];
    }
    return cache.dayNames[dayOfWeek];
}

std::string LocaleHelper::getDayMinimal(int dayOfWeek) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
        return "";
    }

    requireLocaleSet();
    return cache.dayMinimal[dayOfWeek];
}

std::string LocaleHelper::getDayVeryShort(int dayOfWeek) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
        return "";
    }

    requireLocaleSet();
    return cache.dayVeryShort[dayOfWeek];
}

std::string LocaleHelper::getMonthMinimal(int month) {
    if (month < 1 || month > 12) {
        return "";
    }

    requireLocaleSet();
    return cache.monthMinimal[month - 1];
}

std::string LocaleHelper::getLocaleDisplayName(const std::string& localeCode) {
    @autoreleasepool {
        NSString *localeId = [NSString stringWithUTF8String:localeCode.c_str()];

        // Get display name in English
        NSLocale *englishLocale = [NSLocale localeWithLocaleIdentifier:@"en"];
        NSString *displayName = [englishLocale localizedStringForLocaleIdentifier:localeId];

        if (displayName != nil && displayName.length > 0) {
            return std::string([displayName UTF8String]);
        }

        return localeCode;
    }
}

LocaleInfoData LocaleHelper::getLocaleInfo(const std::string& localeCode) {
    @autoreleasepool {
        NSString *localeId = [NSString stringWithUTF8String:localeCode.c_str()];
        NSLocale *locale = [NSLocale localeWithLocaleIdentifier:localeId];

        LocaleInfoData info;
        info.code = localeCode;

        // Extract language code
        NSString *languageCode = [locale languageCode];
        if (languageCode != nil) {
            info.languageCode = std::string([languageCode UTF8String]);
        }

        // Extract region code
        NSString *regionCode = [locale countryCode];
        if (regionCode != nil) {
            info.regionCode = std::string([regionCode UTF8String]);
        }

        // Get display name in English
        NSLocale *englishLocale = [NSLocale localeWithLocaleIdentifier:@"en"];
        NSString *displayName = [englishLocale localizedStringForLocaleIdentifier:localeId];
        if (displayName != nil && displayName.length > 0) {
            info.displayName = std::string([displayName UTF8String]);
        } else {
            info.displayName = localeCode;
        }

        // Get native name (display name in its own language)
        NSString *nativeName = [locale localizedStringForLocaleIdentifier:localeId];
        if (nativeName != nil && nativeName.length > 0) {
            info.nativeName = std::string([nativeName UTF8String]);
        } else {
            info.nativeName = info.displayName;
        }

        return info;
    }
}

std::vector<LocaleInfoData> LocaleHelper::getAvailableLocalesInfo() {
    @autoreleasepool {
        std::vector<LocaleInfoData> result;

        // Get all available locale identifiers
        NSArray<NSString *> *localeIds = [NSLocale availableLocaleIdentifiers];

        // Extract unique language codes
        NSMutableSet<NSString *> *languageCodes = [NSMutableSet set];
        for (NSString *localeId in localeIds) {
            NSLocale *locale = [NSLocale localeWithLocaleIdentifier:localeId];
            NSString *languageCode = [locale languageCode];
            if (languageCode != nil && languageCode.length > 0) {
                [languageCodes addObject:languageCode];
            }
        }

        // Sort alphabetically
        NSArray<NSString *> *sortedCodes = [[languageCodes allObjects] sortedArrayUsingSelector:@selector(compare:)];

        result.reserve([sortedCodes count]);
        for (NSString *code in sortedCodes) {
            std::string codeStr = std::string([code UTF8String]);
            result.push_back(getLocaleInfo(codeStr));
        }

        return result;
    }
}

} // namespace margelo::nitro::rnpackages_nativedate
