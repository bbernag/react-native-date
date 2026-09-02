#include "HybridNativeDate.hpp"
#include "LocaleHelper.hpp"
#include "RelativeTimeHelper.hpp"
#include "core/DateCore.hpp"
#include <cmath>
#include <limits>
#include <stdexcept>

namespace margelo::nitro::rnpackages_nativedate {

namespace core = nativedate::core;

// MARK: - Boundary conversions

static core::Unit toUnit(TimeUnit unit) {
    switch (unit) {
        case TimeUnit::MILLISECOND: return core::Unit::Millisecond;
        case TimeUnit::SECOND: return core::Unit::Second;
        case TimeUnit::MINUTE: return core::Unit::Minute;
        case TimeUnit::HOUR: return core::Unit::Hour;
        case TimeUnit::DAY: return core::Unit::Day;
        case TimeUnit::WEEK: return core::Unit::Week;
        case TimeUnit::MONTH: return core::Unit::Month;
        case TimeUnit::YEAR: return core::Unit::Year;
    }
    return core::Unit::Millisecond;
}

static DateComponents toDateComponents(const core::InternalDateComponents& dc) {
    return DateComponents(
        static_cast<double>(dc.year),
        static_cast<double>(dc.month),
        static_cast<double>(dc.day),
        static_cast<double>(dc.hour),
        static_cast<double>(dc.minute),
        static_cast<double>(dc.second),
        static_cast<double>(dc.millisecond),
        static_cast<double>(dc.dayOfWeek)
    );
}

static LocaleInfo toLocaleInfo(const LocaleInfoData& data) {
    return LocaleInfo(
        data.code,
        data.languageCode,
        data.regionCode,
        data.displayName,
        data.nativeName
    );
}

// MARK: - Core

double HybridNativeDate::now() {
    return core::nowMs();
}

double HybridNativeDate::parse(const std::string& dateString) {
    return core::parseISO8601(dateString);
}

double HybridNativeDate::parseFormat(const std::string& dateString, const std::string& pattern) {
    double result = core::parseWithFormat(dateString, pattern);
    if (std::isnan(result)) {
        throw std::invalid_argument("Unable to parse date string: '" + dateString + "' with pattern: '" + pattern + "'");
    }
    return result;
}

double HybridNativeDate::tryParseFormat(const std::string& dateString, const std::string& pattern) {
    return core::parseWithFormat(dateString, pattern);
}

std::string HybridNativeDate::format(double timestamp, const std::string& pattern) {
    // Use local time by default
    return core::formatInternal(timestamp, pattern, false, localeProvider_);
}

std::string HybridNativeDate::formatUTC(double timestamp, const std::string& pattern) {
    // Use UTC time
    return core::formatInternal(timestamp, pattern, true, localeProvider_);
}

std::string HybridNativeDate::formatFromString(const std::string& dateString, const std::string& pattern) {
    double timestamp = core::parseISO8601(dateString);
    return core::formatInternal(timestamp, pattern, false, localeProvider_);
}

std::string HybridNativeDate::formatUTCFromString(const std::string& dateString, const std::string& pattern) {
    double timestamp = core::parseISO8601(dateString);
    return core::formatInternal(timestamp, pattern, true, localeProvider_);
}

// MARK: - Getters

DateComponents HybridNativeDate::getComponents(double timestamp) {
    return toDateComponents(core::timestampToComponents(timestamp, false)); // local time
}

double HybridNativeDate::getYear(double timestamp) {
    return static_cast<double>(core::timestampToComponents(timestamp, false).year); // local time
}

double HybridNativeDate::getMonth(double timestamp) {
    return static_cast<double>(core::timestampToComponents(timestamp, false).month); // local time
}

double HybridNativeDate::getDate(double timestamp) {
    return static_cast<double>(core::timestampToComponents(timestamp, false).day); // local time
}

double HybridNativeDate::getDay(double timestamp) {
    return static_cast<double>(core::timestampToComponents(timestamp, false).dayOfWeek); // local time
}

double HybridNativeDate::getHours(double timestamp) {
    return static_cast<double>(core::timestampToComponents(timestamp, false).hour); // local time
}

double HybridNativeDate::getMinutes(double timestamp) {
    return static_cast<double>(core::timestampToComponents(timestamp, false).minute); // local time
}

double HybridNativeDate::getSeconds(double timestamp) {
    return static_cast<double>(core::timestampToComponents(timestamp, false).second); // local time
}

double HybridNativeDate::getMilliseconds(double timestamp) {
    return static_cast<double>(core::timestampToComponents(timestamp, false).millisecond); // local time
}

// MARK: - String Input Getters (single bridge crossing)

DateComponents HybridNativeDate::getComponentsFromString(const std::string& dateString) {
    return getComponents(core::parseISO8601(dateString));
}

double HybridNativeDate::getYearFromString(const std::string& dateString) {
    return getYear(core::parseISO8601(dateString));
}

double HybridNativeDate::getMonthFromString(const std::string& dateString) {
    return getMonth(core::parseISO8601(dateString));
}

double HybridNativeDate::getDateFromString(const std::string& dateString) {
    return getDate(core::parseISO8601(dateString));
}

double HybridNativeDate::getDayFromString(const std::string& dateString) {
    return getDay(core::parseISO8601(dateString));
}

double HybridNativeDate::getHoursFromString(const std::string& dateString) {
    return getHours(core::parseISO8601(dateString));
}

double HybridNativeDate::getMinutesFromString(const std::string& dateString) {
    return getMinutes(core::parseISO8601(dateString));
}

double HybridNativeDate::getSecondsFromString(const std::string& dateString) {
    return getSeconds(core::parseISO8601(dateString));
}

double HybridNativeDate::getMillisecondsFromString(const std::string& dateString) {
    return getMilliseconds(core::parseISO8601(dateString));
}

// MARK: - Date Info

double HybridNativeDate::getDaysInMonth(double timestamp) {
    core::InternalDateComponents dc = core::timestampToComponents(timestamp, false); // local time
    return static_cast<double>(core::daysInMonth(dc.year, dc.month));
}

bool HybridNativeDate::isLeapYear(double timestamp) {
    return core::isLeapYear(core::timestampToComponents(timestamp, false).year); // local time
}

bool HybridNativeDate::isWeekend(double timestamp) {
    return core::isWeekendDay(core::timestampToComponents(timestamp, false).dayOfWeek); // local time
}

bool HybridNativeDate::isValid(double timestamp) {
    return core::isValidTimestamp(timestamp);
}

// MARK: - Arithmetic

double HybridNativeDate::add(double timestamp, double amount, TimeUnit unit) {
    return core::add(timestamp, amount, toUnit(unit));
}

double HybridNativeDate::subtract(double timestamp, double amount, TimeUnit unit) {
    return core::subtract(timestamp, amount, toUnit(unit));
}

// MARK: - Comparisons

bool HybridNativeDate::isBefore(double timestamp1, double timestamp2) {
    return core::isBefore(timestamp1, timestamp2);
}

bool HybridNativeDate::isAfter(double timestamp1, double timestamp2) {
    return core::isAfter(timestamp1, timestamp2);
}

bool HybridNativeDate::isSame(double timestamp1, double timestamp2, TimeUnit unit) {
    return core::isSame(timestamp1, timestamp2, toUnit(unit));
}

// MARK: - Helpers

double HybridNativeDate::startOf(double timestamp, TimeUnit unit) {
    return core::startOf(timestamp, toUnit(unit));
}

double HybridNativeDate::endOf(double timestamp, TimeUnit unit) {
    return core::endOf(timestamp, toUnit(unit));
}

double HybridNativeDate::diff(double timestamp1, double timestamp2, TimeUnit unit) {
    return core::diff(timestamp1, timestamp2, toUnit(unit));
}

double HybridNativeDate::clamp(double timestamp, double minVal, double maxVal) {
    return core::clamp(timestamp, minVal, maxVal);
}

double HybridNativeDate::min(const std::vector<double>& timestamps) {
    return core::min(timestamps);
}

double HybridNativeDate::max(const std::vector<double>& timestamps) {
    return core::max(timestamps);
}

// MARK: - Relative Time Formatting

std::string HybridNativeDate::formatDistance(double timestamp, double baseTimestamp, bool addSuffix) {
    return RelativeTimeHelper::formatDistance(timestamp, baseTimestamp, addSuffix);
}

std::string HybridNativeDate::formatDuration(double milliseconds) {
    return RelativeTimeHelper::formatDuration(milliseconds);
}

// MARK: - Timezone

std::string HybridNativeDate::getTimezone() {
    return timezoneProvider_.systemZone();
}

double HybridNativeDate::getTimezoneOffset() {
    // Get current offset for the device's timezone
    return core::getTimezoneOffsetForTimestamp(now(), timezoneProvider_);
}

double HybridNativeDate::getTimezoneOffsetForTimestamp(double timestamp) {
    return core::getTimezoneOffsetForTimestamp(timestamp, timezoneProvider_);
}

double HybridNativeDate::getOffsetInTimezone(double timestamp, const std::string& timezone) {
    return core::getOffsetInTimezone(timestamp, timezone, timezoneProvider_);
}

double HybridNativeDate::toTimezone(double timestamp, const std::string& timezone) {
    return core::toTimezone(timestamp, timezone, timezoneProvider_);
}

std::string HybridNativeDate::formatInTimezone(double timestamp, const std::string& pattern, const std::string& timezone) {
    return core::formatInTimezone(timestamp, pattern, timezone, timezoneProvider_, localeProvider_);
}

std::vector<std::string> HybridNativeDate::getAvailableTimezones() {
    return timezoneProvider_.availableZones();
}

bool HybridNativeDate::isValidTimezone(const std::string& timezone) {
    return timezoneProvider_.isValidZone(timezone);
}

// MARK: - Local-calendar predicates (system zone)

bool HybridNativeDate::isToday(double timestamp) {
    return core::isToday(timestamp, now(), timezoneProvider_);
}

bool HybridNativeDate::isTomorrow(double timestamp) {
    return core::isTomorrow(timestamp, now(), timezoneProvider_);
}

bool HybridNativeDate::isYesterday(double timestamp) {
    return core::isYesterday(timestamp, now(), timezoneProvider_);
}

// MARK: - Timezone-aware predicates (InTz)

bool HybridNativeDate::isTodayInTz(double timestamp, const std::string& timezone) {
    return core::isTodayInTz(timestamp, timezone, now(), timezoneProvider_);
}

bool HybridNativeDate::isTomorrowInTz(double timestamp, const std::string& timezone) {
    return core::isTomorrowInTz(timestamp, timezone, now(), timezoneProvider_);
}

bool HybridNativeDate::isYesterdayInTz(double timestamp, const std::string& timezone) {
    return core::isYesterdayInTz(timestamp, timezone, now(), timezoneProvider_);
}

bool HybridNativeDate::isSameDayInTz(double timestamp1, double timestamp2, const std::string& timezone) {
    return core::isSameDayInTz(timestamp1, timestamp2, timezone, timezoneProvider_);
}

bool HybridNativeDate::isSameMonthInTz(double timestamp1, double timestamp2, const std::string& timezone) {
    return core::isSameMonthInTz(timestamp1, timestamp2, timezone, timezoneProvider_);
}

bool HybridNativeDate::isSameYearInTz(double timestamp1, double timestamp2, const std::string& timezone) {
    return core::isSameYearInTz(timestamp1, timestamp2, timezone, timezoneProvider_);
}

double HybridNativeDate::startOfDayInTz(double timestamp, const std::string& timezone) {
    return core::startOfDayInTz(timestamp, timezone, timezoneProvider_);
}

double HybridNativeDate::endOfDayInTz(double timestamp, const std::string& timezone) {
    return core::endOfDayInTz(timestamp, timezone, timezoneProvider_);
}

// MARK: - Locale

std::string HybridNativeDate::getLocale() {
    return localeProvider_.currentLocale();
}

bool HybridNativeDate::setLocale(const std::string& locale) {
    return LocaleHelper::setLocale(locale);
}

std::vector<std::string> HybridNativeDate::getAvailableLocales() {
    return LocaleHelper::getAvailableLocales();
}

std::string HybridNativeDate::getLocaleDisplayName(const std::string& localeCode) {
    return LocaleHelper::getLocaleDisplayName(localeCode);
}

LocaleInfo HybridNativeDate::getLocaleInfo(const std::string& localeCode) {
    return toLocaleInfo(LocaleHelper::getLocaleInfo(localeCode));
}

std::vector<LocaleInfo> HybridNativeDate::getAvailableLocalesInfo() {
    std::vector<LocaleInfoData> dataList = LocaleHelper::getAvailableLocalesInfo();
    std::vector<LocaleInfo> result;
    result.reserve(dataList.size());

    for (const auto& data : dataList) {
        result.push_back(toLocaleInfo(data));
    }

    return result;
}

// MARK: - Async Batch Operations

std::shared_ptr<Promise<std::vector<double>>> HybridNativeDate::parseManyAsync(const std::vector<std::string>& dateStrings) {
    // Capture dateStrings by value for thread safety
    return Promise<std::vector<double>>::async([dateStrings]() -> std::vector<double> {
        std::vector<double> results;
        results.reserve(dateStrings.size());

        for (const auto& dateString : dateStrings) {
            try {
                results.push_back(core::parseISO8601(dateString));
            } catch (...) {
                // On error, push NaN to indicate invalid date
                results.push_back(std::numeric_limits<double>::quiet_NaN());
            }
        }

        return results;
    });
}

std::shared_ptr<Promise<std::vector<std::string>>> HybridNativeDate::formatManyAsync(const std::vector<double>& timestamps, const std::string& pattern) {
    // Capture by value for thread safety
    return Promise<std::vector<std::string>>::async([timestamps, pattern]() -> std::vector<std::string> {
        std::vector<std::string> results;
        results.reserve(timestamps.size());

        for (double timestamp : timestamps) {
            core::InternalDateComponents dc = core::timestampToComponents(timestamp, false); // local time

            std::string result = pattern;

            // Replace patterns
            auto replacePattern = [&result](const std::string& pat, const std::string& value) {
                size_t pos = 0;
                while ((pos = result.find(pat, pos)) != std::string::npos) {
                    result.replace(pos, pat.length(), value);
                    pos += value.length();
                }
            };

            replacePattern("yyyy", std::to_string(dc.year));
            replacePattern("MM", core::padZero(dc.month));
            replacePattern("dd", core::padZero(dc.day));
            replacePattern("HH", core::padZero(dc.hour));
            replacePattern("mm", core::padZero(dc.minute));
            replacePattern("ss", core::padZero(dc.second));
            replacePattern("SSS", core::padZero(dc.millisecond, 3));

            results.push_back(result);
        }

        return results;
    });
}

std::shared_ptr<Promise<std::vector<DateComponents>>> HybridNativeDate::getComponentsManyAsync(const std::vector<double>& timestamps) {
    // Capture by value for thread safety
    return Promise<std::vector<DateComponents>>::async([timestamps]() -> std::vector<DateComponents> {
        std::vector<DateComponents> results;
        results.reserve(timestamps.size());

        for (double timestamp : timestamps) {
            results.push_back(toDateComponents(core::timestampToComponents(timestamp, false))); // local time
        }

        return results;
    });
}

} // namespace margelo::nitro::rnpackages_nativedate
