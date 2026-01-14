#pragma once

#include "HybridNativeDateSpec.hpp"
#include "DateComponents.hpp"
#include "LocaleInfo.hpp"
#include <NitroModules/Promise.hpp>
#include <chrono>
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace margelo::nitro::rnpackages_nativedate {

/**
 * C++ implementation of HybridNativeDateSpec using std::chrono
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
    // Helper to get milliseconds for a time unit
    static int64_t getMillisForUnit(TimeUnit unit);

    // Helper to truncate timestamp to start of unit
    static double truncateToUnit(double timestamp, TimeUnit unit);

    // Internal date components (different from public DateComponents)
    struct InternalDateComponents {
        int year;
        int month;
        int day;
        int hour;
        int minute;
        int second;
        int millisecond;
        int dayOfWeek; // 0 = Sunday, 6 = Saturday
    };

    // Convert timestamp to components (useUTC: true for UTC, false for local time)
    static InternalDateComponents timestampToComponents(double timestamp, bool useUTC = true);

    // Internal format helper
    static std::string formatInternal(double timestamp, const std::string& pattern, bool useUTC);

    // Convert components to timestamp (UTC)
    static double componentsToTimestamp(const InternalDateComponents& components);

    // Convert components to timestamp (local time)
    static double componentsToTimestampLocal(const InternalDateComponents& components);

    // Parse ISO8601 date string
    static double parseISO8601(const std::string& dateString);

    // Parse date string with custom format pattern (returns NaN on error)
    static double parseWithFormat(const std::string& dateString, const std::string& pattern);

    // Format helpers
    static std::string padZero(int value, int width = 2);

    // Day of week calculation (0 = Sunday, 6 = Saturday)
    static int getDayOfWeek(double timestamp);

};

} // namespace margelo::nitro::rnpackages_nativedate
