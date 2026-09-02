#import <Foundation/Foundation.h>
#include "LocaleHelper.hpp"

#include <utility>

namespace margelo::nitro::rnpackages_nativedate {

using nativedate::core::isSafeLocaleTag;
using nativedate::core::LocaleCache;
using nativedate::core::LocaleNameLists;
using nativedate::core::localeIdsEqual;
using nativedate::core::LocaleStore;
using nativedate::core::makeLocaleCache;
using nativedate::core::normalizeLocaleId;
using nativedate::core::utf8Prefix;

LocaleStore LocaleHelper::store_;

namespace {

// std::string from an NSString; empty when nil or when Foundation cannot encode it.
std::string toStdString(NSString* string) {
    if (string == nil) {
        return {};
    }
    const char* utf8 = [string UTF8String];
    return utf8 != nullptr ? std::string(utf8) : std::string();
}

// Copies the first `count` symbols into `out`; false when the array is missing or short.
bool copySymbols(NSArray<NSString*>* symbols, NSUInteger count, std::vector<std::string>& out) {
    if (symbols == nil || symbols.count < count) {
        return false;
    }
    out.clear();
    out.reserve(count);
    for (NSUInteger i = 0; i < count; i++) {
        out.push_back(toStdString(symbols[i]));
    }
    return true;
}

// Gregorian month and weekday symbols for `locale`; nullptr when any list is incomplete.
std::shared_ptr<const LocaleCache> loadNames(NSLocale* locale, std::string localeId) {
    // Force the Gregorian calendar: the locale's default calendar may be
    // Islamic, Hebrew, ... whose months do not line up with 1..12.
    NSCalendar* calendar = [NSCalendar calendarWithIdentifier:NSCalendarIdentifierGregorian];
    if (calendar == nil) {
        return nullptr;
    }
    calendar.locale = locale;
    NSDateFormatter* formatter = [[NSDateFormatter alloc] init];
    formatter.locale = locale;
    formatter.calendar = calendar;

    LocaleNameLists lists;
    std::vector<std::string> shortDays;
    const bool complete = copySymbols(formatter.monthSymbols, 12, lists.monthNames) &&
                          copySymbols(formatter.shortMonthSymbols, 12, lists.monthNamesShort) &&
                          copySymbols(formatter.veryShortMonthSymbols, 12, lists.monthMinimal) &&
                          copySymbols(formatter.weekdaySymbols, 7, lists.dayNames) &&
                          copySymbols(formatter.shortWeekdaySymbols, 7, lists.dayNamesShort) &&
                          copySymbols(formatter.veryShortWeekdaySymbols, 7, lists.dayMinimal);
    if (!complete) {
        return nullptr;
    }

    // NSDateFormatter has no "Su"/"Mo" width: take the first two code points of
    // the short standalone form (or the short form when standalone is missing).
    if (!copySymbols(formatter.shortStandaloneWeekdaySymbols, 7, shortDays)) {
        shortDays = lists.dayNamesShort;
    }
    lists.dayVeryShort.reserve(7);
    for (const auto& day : shortDays) {
        lists.dayVeryShort.push_back(utf8Prefix(day, 2));
    }

    return makeLocaleCache(std::move(localeId), std::move(lists));
}

// Language code of `locale`, falling back to its full identifier when Foundation has none.
std::string languageOf(NSLocale* locale) {
    std::string language = toStdString(locale.languageCode);
    if (language.empty()) {
        language = toStdString(locale.localeIdentifier);
    }
    return language;
}

// The entry of `availableLocaleIdentifiers` naming `normalizedId` ("en_US" matches "en-us"), or nil.
NSString* availableIdentifierFor(const std::string& normalizedId) {
    for (NSString* candidate in [NSLocale availableLocaleIdentifiers]) {
        if (localeIdsEqual(normalizedId, toStdString(candidate))) {
            return candidate;
        }
    }
    return nil;
}

// NSString for a caller-supplied id, or nil when it is not a safe ASCII tag.
NSString* safeIdentifier(const std::string& localeCode) {
    if (!isSafeLocaleTag(normalizeLocaleId(localeCode))) {
        return nil;
    }
    return [NSString stringWithUTF8String:localeCode.c_str()];
}

// Display name of `localeId` as rendered by `inLocale`, or `fallback` when Foundation has none.
std::string displayName(NSLocale* inLocale, NSString* localeId, const std::string& fallback) {
    std::string name = toStdString([inLocale localizedStringForLocaleIdentifier:localeId]);
    return name.empty() ? fallback : name;
}

} // namespace

std::shared_ptr<const LocaleCache> LocaleHelper::loadDefaultFromPlatform() {
    @autoreleasepool {
        NSLocale* locale = [NSLocale currentLocale];
        return loadNames(locale, languageOf(locale));
    }
}

std::string LocaleHelper::getCurrentLocale() {
    if (const auto snapshot = names()) {
        return snapshot->localeId;
    }
    @autoreleasepool {
        return languageOf([NSLocale currentLocale]);
    }
}

bool LocaleHelper::setLocale(const std::string& locale) {
    const std::string normalized = normalizeLocaleId(locale);
    if (!isSafeLocaleTag(normalized)) {
        return false;
    }
    @autoreleasepool {
        NSString* identifier = availableIdentifierFor(normalized);
        if (identifier == nil) {
            return false;
        }
        auto loaded = loadNames([NSLocale localeWithLocaleIdentifier:identifier],
                                normalizeLocaleId(toStdString(identifier)));
        if (!loaded) {
            return false;
        }
        store_.replace(std::move(loaded));
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
            result.push_back(toStdString(code));
        }

        return result;
    }
}

bool LocaleHelper::isValidLocale(const std::string& locale) {
    const std::string normalized = normalizeLocaleId(locale);
    if (!isSafeLocaleTag(normalized)) {
        return false;
    }
    @autoreleasepool {
        return availableIdentifierFor(normalized) != nil;
    }
}

std::string LocaleHelper::getLocaleDisplayName(const std::string& localeCode) {
    @autoreleasepool {
        NSString *localeId = safeIdentifier(localeCode);
        if (localeId == nil) {
            return localeCode;
        }

        // Get display name in English
        NSLocale *englishLocale = [NSLocale localeWithLocaleIdentifier:@"en"];
        return displayName(englishLocale, localeId, localeCode);
    }
}

LocaleInfoData LocaleHelper::getLocaleInfo(const std::string& localeCode) {
    @autoreleasepool {
        LocaleInfoData info;
        info.code = localeCode;

        NSString *localeId = safeIdentifier(localeCode);
        if (localeId == nil) {
            info.displayName = localeCode;
            info.nativeName = localeCode;
            return info;
        }
        NSLocale *locale = [NSLocale localeWithLocaleIdentifier:localeId];

        info.languageCode = toStdString([locale languageCode]);
        if (info.languageCode.empty()) {
            info.languageCode = toStdString([locale localeIdentifier]);
        }
        info.regionCode = toStdString([locale countryCode]);

        // Display name in English, then in the locale's own language
        NSLocale *englishLocale = [NSLocale localeWithLocaleIdentifier:@"en"];
        info.displayName = displayName(englishLocale, localeId, localeCode);
        info.nativeName = displayName(locale, localeId, info.displayName);

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
            result.push_back(getLocaleInfo(toStdString(code)));
        }

        return result;
    }
}

} // namespace margelo::nitro::rnpackages_nativedate
