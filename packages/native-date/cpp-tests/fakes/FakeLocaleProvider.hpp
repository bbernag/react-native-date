#pragma once

#include "Providers.hpp"

#include <array>
#include <string>

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

} // namespace nativedate::test
