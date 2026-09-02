#include "PlatformLocaleProvider.hpp"

#include "LocaleHelper.hpp"

namespace margelo::nitro::rnpackages_nativedate {

using nativedate::core::NameForm;

std::string PlatformLocaleProvider::monthName(int month, NameForm form) const {
    switch (form) {
        case NameForm::Full:
            return LocaleHelper::getMonthName(month, false);
        case NameForm::Abbreviated:
        case NameForm::Short:
            return LocaleHelper::getMonthName(month, true);
        case NameForm::Narrow:
            return LocaleHelper::getMonthMinimal(month);
    }
    return LocaleHelper::getMonthName(month, false);
}

std::string PlatformLocaleProvider::dayName(int dayOfWeek, NameForm form) const {
    switch (form) {
        case NameForm::Full:
            return LocaleHelper::getDayName(dayOfWeek, false);
        case NameForm::Abbreviated:
            return LocaleHelper::getDayName(dayOfWeek, true);
        case NameForm::Short:
            return LocaleHelper::getDayVeryShort(dayOfWeek);
        case NameForm::Narrow:
            return LocaleHelper::getDayMinimal(dayOfWeek);
    }
    return LocaleHelper::getDayName(dayOfWeek, false);
}

std::string PlatformLocaleProvider::currentLocale() const {
    return LocaleHelper::getCurrentLocale();
}

} // namespace margelo::nitro::rnpackages_nativedate
