#import <Foundation/Foundation.h>
#include "RelativeTimeHelper.hpp"
#include "LocaleHelper.hpp"
#include "core/RelativeBuckets.hpp"

namespace margelo::nitro::rnpackages_nativedate {

using nativedate::core::DurationParts;
using nativedate::core::RelativeBucket;
using nativedate::core::RelativeDirection;
using nativedate::core::RelativeUnit;

// Get the current NSLocale based on LocaleHelper setting
static NSLocale* getCurrentNSLocale() {
    std::string localeCode = LocaleHelper::getCurrentLocale();
    if (!localeCode.empty()) {
        NSString *localeId = [NSString stringWithUTF8String:localeCode.c_str()];
        return [NSLocale localeWithLocaleIdentifier:localeId];
    }
    return [NSLocale currentLocale];
}

static NSCalendar* getGregorianCalendar() {
    NSCalendar *calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
    calendar.locale = getCurrentNSLocale();
    return calendar;
}

static NSCalendarUnit calendarUnitFor(RelativeUnit unit) {
    switch (unit) {
        case RelativeUnit::Minute:
            return NSCalendarUnitMinute;
        case RelativeUnit::Hour:
            return NSCalendarUnitHour;
        case RelativeUnit::Day:
            return NSCalendarUnitDay;
        case RelativeUnit::Month:
            return NSCalendarUnitMonth;
        case RelativeUnit::Year:
            return NSCalendarUnitYear;
    }
    return NSCalendarUnitMinute;
}

// Build NSDateComponents holding exactly the bucket's unit with the given
// (possibly negative) amount.
static NSDateComponents* componentsFor(RelativeUnit unit, NSInteger amount) {
    NSDateComponents *components = [[NSDateComponents alloc] init];
    [components setValue:amount forComponent:calendarUnitFor(unit)];
    return components;
}

static std::string toStdString(NSString *value) {
    if (value == nil || value.length == 0) {
        return std::string();
    }
    return std::string([value UTF8String]);
}

// Localized "in 2 hours" / "2 hours ago" for the bucket. Requires iOS 13
// (NSRelativeDateTimeFormatter); returns "" otherwise so the caller falls
// back to English.
static std::string formatWithDirection(const RelativeBucket& bucket) {
    if (@available(iOS 13.0, *)) {
        NSRelativeDateTimeFormatter *formatter = [[NSRelativeDateTimeFormatter alloc] init];
        formatter.locale = getCurrentNSLocale();
        formatter.calendar = getGregorianCalendar();
        formatter.unitsStyle = NSRelativeDateTimeFormatterUnitsStyleFull;
        // Numeric keeps "in 1 day" rather than "tomorrow" so the wording
        // tracks the bucket table on every platform.
        formatter.dateTimeStyle = NSRelativeDateTimeFormatterStyleNumeric;

        NSInteger amount = static_cast<NSInteger>(bucket.value);
        if (bucket.direction == RelativeDirection::Past) {
            amount = -amount;
        }
        return toStdString([formatter localizedStringFromDateComponents:componentsFor(bucket.unit, amount)]);
    }
    return std::string();
}

// Localized bare quantity ("2 hours") for the bucket with no direction words.
static std::string formatQuantity(const RelativeBucket& bucket) {
    NSDateComponentsFormatter *formatter = [[NSDateComponentsFormatter alloc] init];
    formatter.calendar = getGregorianCalendar();
    formatter.unitsStyle = NSDateComponentsFormatterUnitsStyleFull;
    formatter.allowedUnits = calendarUnitFor(bucket.unit);
    formatter.zeroFormattingBehavior = NSDateComponentsFormatterZeroFormattingBehaviorNone;

    NSDateComponents *components = componentsFor(bucket.unit, static_cast<NSInteger>(bucket.value));
    return toStdString([formatter stringFromDateComponents:components]);
}

std::string RelativeTimeHelper::formatDistance(double timestamp, double baseTimestamp, bool addSuffix) {
    // Throws std::invalid_argument for non-finite input before touching Foundation.
    const RelativeBucket bucket = nativedate::core::relativeBucket(timestamp, baseTimestamp);

    @autoreleasepool {
        std::string result = addSuffix ? formatWithDirection(bucket) : formatQuantity(bucket);
        if (!result.empty()) {
            return result;
        }
        return nativedate::core::formatRelativeEnglish(bucket, addSuffix);
    }
}

std::string RelativeTimeHelper::formatDuration(double milliseconds) {
    // Throws std::invalid_argument for NaN/Inf; clamps to kMaxDurationMs.
    const DurationParts parts = nativedate::core::decomposeDuration(milliseconds);

    @autoreleasepool {
        NSDateComponentsFormatter *formatter = [[NSDateComponentsFormatter alloc] init];
        formatter.calendar = getGregorianCalendar();
        formatter.unitsStyle = NSDateComponentsFormatterUnitsStyleAbbreviated;
        formatter.allowedUnits = NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
        formatter.zeroFormattingBehavior = NSDateComponentsFormatterZeroFormattingBehaviorDropLeading;

        NSDateComponents *components = [[NSDateComponents alloc] init];
        components.day = static_cast<NSInteger>(parts.days);
        components.hour = static_cast<NSInteger>(parts.hours);
        components.minute = static_cast<NSInteger>(parts.minutes);
        components.second = static_cast<NSInteger>(parts.seconds);

        std::string result = toStdString([formatter stringFromDateComponents:components]);
        if (!result.empty()) {
            return result;
        }
        return nativedate::core::formatDurationEnglish(parts);
    }
}

} // namespace margelo::nitro::rnpackages_nativedate
