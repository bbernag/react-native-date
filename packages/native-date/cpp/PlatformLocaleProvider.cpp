#include "PlatformLocaleProvider.hpp"

#include "LocaleHelper.hpp"

namespace margelo::nitro::rnpackages_nativedate {

using nativedate::core::NameForm;

std::string PlatformLocaleProvider::monthName(int month, NameForm form) const {
    return LocaleHelper::monthName(month, form);
}

std::string PlatformLocaleProvider::dayName(int dayOfWeek, NameForm form) const {
    return LocaleHelper::dayName(dayOfWeek, form);
}

std::string PlatformLocaleProvider::currentLocale() const {
    return LocaleHelper::getCurrentLocale();
}

} // namespace margelo::nitro::rnpackages_nativedate
