#pragma once

#include "HybridNativeDateSpec.hpp"
#include "DateComponents.hpp"
#include "LocaleInfo.hpp"
#include "PlatformLocaleProvider.hpp"
#include "PlatformTimezoneProvider.hpp"
#include <NitroModules/Promise.hpp>
#include <string>
#include <vector>
#include <memory>

namespace margelo::nitro::rnpackages_nativedate {

/**
 * Nitro adapter for HybridNativeDateSpec.
 * All date logic lives in the Nitro-free core (cpp/core); this class converts
 * generated types at the boundary and forwards to it.
 */
class HybridNativeDate : public HybridNativeDateSpec {
public:
    HybridNativeDate() : HybridObject(TAG), HybridNativeDateSpec() {}
    ~HybridNativeDate() override = default;

    // Core
    double now() override;
    double parse(const std::string& dateString) override;
    double parseFormat(const std::string& dateString, const std::string& pattern) override;
    double tryParseFormat(const std::string& dateString, const std::string& pattern) override;
    std::string format(double timestamp, const std::string& pattern) override;
    std::string formatUTC(double timestamp, const std::string& pattern) override;
    // String input variants (single bridge crossing)
    std::string formatFromString(const std::string& dateString, const std::string& pattern) override;
    std::string formatUTCFromString(const std::string& dateString, const std::string& pattern) override;

    // Getters
    DateComponents getComponents(double timestamp) override;
    DateComponents getComponentsFromString(const std::string& dateString) override;
    double getYear(double timestamp) override;
    double getYearFromString(const std::string& dateString) override;
    double getMonth(double timestamp) override;
    double getMonthFromString(const std::string& dateString) override;
    double getDate(double timestamp) override;
    double getDateFromString(const std::string& dateString) override;
    double getDay(double timestamp) override;
    double getDayFromString(const std::string& dateString) override;
    double getHours(double timestamp) override;
    double getHoursFromString(const std::string& dateString) override;
    double getMinutes(double timestamp) override;
    double getMinutesFromString(const std::string& dateString) override;
    double getSeconds(double timestamp) override;
    double getSecondsFromString(const std::string& dateString) override;
    double getMilliseconds(double timestamp) override;
    double getMillisecondsFromString(const std::string& dateString) override;

    // Date info
    double getDaysInMonth(double timestamp) override;
    bool isLeapYear(double timestamp) override;
    bool isWeekend(double timestamp) override;
    bool isValid(double timestamp) override;

    // Arithmetic
    double add(double timestamp, double amount, TimeUnit unit) override;
    double subtract(double timestamp, double amount, TimeUnit unit) override;

    // Comparisons
    bool isBefore(double timestamp1, double timestamp2) override;
    bool isAfter(double timestamp1, double timestamp2) override;
    bool isSame(double timestamp1, double timestamp2, TimeUnit unit) override;

    // Helpers
    double startOf(double timestamp, TimeUnit unit) override;
    double endOf(double timestamp, TimeUnit unit) override;
    double diff(double timestamp1, double timestamp2, TimeUnit unit) override;
    double clamp(double timestamp, double min, double max) override;
    double min(const std::vector<double>& timestamps) override;
    double max(const std::vector<double>& timestamps) override;

    // Relative time formatting
    std::string formatDistance(double timestamp, double baseTimestamp, bool addSuffix) override;
    std::string formatDuration(double milliseconds) override;

    // Timezone
    std::string getTimezone() override;
    double getTimezoneOffset() override;
    double getTimezoneOffsetForTimestamp(double timestamp) override;
    double getOffsetInTimezone(double timestamp, const std::string& timezone) override;
    double toTimezone(double timestamp, const std::string& timezone) override;
    std::string formatInTimezone(double timestamp, const std::string& pattern, const std::string& timezone) override;
    std::vector<std::string> getAvailableTimezones() override;
    bool isValidTimezone(const std::string& timezone) override;

    // Timezone-aware predicates (InTz)
    bool isTodayInTz(double timestamp, const std::string& timezone) override;
    bool isTomorrowInTz(double timestamp, const std::string& timezone) override;
    bool isYesterdayInTz(double timestamp, const std::string& timezone) override;
    bool isSameDayInTz(double timestamp1, double timestamp2, const std::string& timezone) override;
    bool isSameMonthInTz(double timestamp1, double timestamp2, const std::string& timezone) override;
    bool isSameYearInTz(double timestamp1, double timestamp2, const std::string& timezone) override;
    double startOfDayInTz(double timestamp, const std::string& timezone) override;
    double endOfDayInTz(double timestamp, const std::string& timezone) override;

    // Locale
    std::string getLocale() override;
    bool setLocale(const std::string& locale) override;
    std::vector<std::string> getAvailableLocales() override;
    std::string getLocaleDisplayName(const std::string& localeCode) override;
    LocaleInfo getLocaleInfo(const std::string& localeCode) override;
    std::vector<LocaleInfo> getAvailableLocalesInfo() override;

    // Async batch operations
    std::shared_ptr<Promise<std::vector<double>>> parseManyAsync(const std::vector<std::string>& dateStrings) override;
    std::shared_ptr<Promise<std::vector<std::string>>> formatManyAsync(const std::vector<double>& timestamps, const std::string& pattern) override;
    std::shared_ptr<Promise<std::vector<DateComponents>>> getComponentsManyAsync(const std::vector<double>& timestamps) override;

private:
    // Providers the core reads timezone data and localized names through.
    // Both are stateless wrappers over the static platform helpers.
    PlatformTimezoneProvider timezoneProvider_;
    PlatformLocaleProvider localeProvider_;
};

} // namespace margelo::nitro::rnpackages_nativedate
