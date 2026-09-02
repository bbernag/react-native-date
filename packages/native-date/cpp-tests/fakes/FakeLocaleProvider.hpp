#pragma once

#include "LocaleCache.hpp"
#include "Providers.hpp"

#include <array>
#include <memory>
#include <string>
#include <utility>

namespace nativedate::test {

/**
 * LocaleProvider with a fixed English table (the default) and a Japanese table
 * to prove the formatter passes multi-byte UTF-8 names through untouched.
 */
class FakeLocaleProvider final : public nativedate::core::LocaleProvider {
public:
    enum class Language { English, Japanese };

    explicit FakeLocaleProvider(Language language = Language::English) : language_(language) {}

    std::string monthName(int month, nativedate::core::NameForm form) const override {
        using nativedate::core::NameForm;
        const size_t index = static_cast<size_t>(month - 1);
        if (language_ == Language::Japanese) {
            // Japanese uses the same numeric form for every length.
            return std::to_string(month) + "\xE6\x9C\x88"; // 月
        }
        switch (form) {
            case NameForm::Full:
                return kMonthsFull[index];
            case NameForm::Abbreviated:
            case NameForm::Short:
                return kMonthsFull[index].substr(0, 3);
            case NameForm::Narrow:
                return kMonthsFull[index].substr(0, 1);
        }
        return kMonthsFull[index];
    }

    std::string dayName(int dayOfWeek, nativedate::core::NameForm form) const override {
        using nativedate::core::NameForm;
        const size_t index = static_cast<size_t>(dayOfWeek);
        if (language_ == Language::Japanese) {
            switch (form) {
                case NameForm::Full:
                    return kDaysJapanese[index] + "\xE6\x9B\x9C\xE6\x97\xA5"; // 曜日
                case NameForm::Abbreviated:
                case NameForm::Short:
                case NameForm::Narrow:
                    return kDaysJapanese[index];
            }
            return kDaysJapanese[index];
        }
        switch (form) {
            case NameForm::Full:
                return kDaysFull[index];
            case NameForm::Abbreviated:
                return kDaysFull[index].substr(0, 3);
            case NameForm::Short:
                return kDaysFull[index].substr(0, 2);
            case NameForm::Narrow:
                return kDaysFull[index].substr(0, 1);
        }
        return kDaysFull[index];
    }

    std::string currentLocale() const override {
        return language_ == Language::Japanese ? "ja" : "en";
    }

    /**
     * The same tables as raw platform-style lists, so tests can freeze them
     * into a `LocaleCache` with `makeLocaleCache`.
     */
    nativedate::core::LocaleNameLists nameLists() const {
        using nativedate::core::NameForm;
        nativedate::core::LocaleNameLists lists;
        for (int month = 1; month <= 12; month++) {
            lists.monthNames.push_back(monthName(month, NameForm::Full));
            lists.monthNamesShort.push_back(monthName(month, NameForm::Abbreviated));
            lists.monthMinimal.push_back(monthName(month, NameForm::Narrow));
        }
        for (int day = 0; day <= 6; day++) {
            lists.dayNames.push_back(dayName(day, NameForm::Full));
            lists.dayNamesShort.push_back(dayName(day, NameForm::Abbreviated));
            lists.dayVeryShort.push_back(dayName(day, NameForm::Short));
            lists.dayMinimal.push_back(dayName(day, NameForm::Narrow));
        }
        return lists;
    }

    /** This provider's tables frozen into an immutable snapshot. */
    std::shared_ptr<const nativedate::core::LocaleCache> makeCache() const {
        return nativedate::core::makeLocaleCache(currentLocale(), nameLists());
    }

private:
    static inline const std::array<std::string, 12> kMonthsFull = {
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    };
    static inline const std::array<std::string, 7> kDaysFull = {
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    };
    // 日 月 火 水 木 金 土
    static inline const std::array<std::string, 7> kDaysJapanese = {
        "\xE6\x97\xA5", "\xE6\x9C\x88", "\xE7\x81\xAB", "\xE6\xB0\xB4",
        "\xE6\x9C\xA8", "\xE9\x87\x91", "\xE5\x9C\x9F",
    };

    Language language_;
};

/**
 * LocaleProvider that reads a `LocaleStore` snapshot the way the platform
 * provider does on device: nothing is loaded until the first name is asked
 * for, at which point `loadDefault` runs and its result is installed.
 */
class SnapshotLocaleProvider final : public nativedate::core::LocaleProvider {
public:
    SnapshotLocaleProvider(nativedate::core::LocaleStore& store, nativedate::core::LocaleStore::Loader loadDefault)
        : store_(store), loadDefault_(std::move(loadDefault)) {}

    std::string monthName(int month, nativedate::core::NameForm form) const override {
        const auto snapshot = store_.snapshot(loadDefault_);
        return snapshot ? std::string(snapshot->monthName(month, form)) : std::string();
    }

    std::string dayName(int dayOfWeek, nativedate::core::NameForm form) const override {
        const auto snapshot = store_.snapshot(loadDefault_);
        return snapshot ? std::string(snapshot->dayName(dayOfWeek, form)) : std::string();
    }

    std::string currentLocale() const override {
        const auto snapshot = store_.snapshot(loadDefault_);
        return snapshot ? snapshot->localeId : std::string();
    }

private:
    nativedate::core::LocaleStore& store_;
    nativedate::core::LocaleStore::Loader loadDefault_;
};

} // namespace nativedate::test
