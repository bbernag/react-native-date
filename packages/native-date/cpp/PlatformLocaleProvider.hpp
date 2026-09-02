#pragma once

#include "core/Providers.hpp"

namespace margelo::nitro::rnpackages_nativedate {

/**
 * LocaleProvider backed by the platform LocaleHelper
 * (NSDateFormatter on iOS, DateFormatSymbols on Android).
 */
class PlatformLocaleProvider final : public nativedate::core::LocaleProvider {
public:
    std::string monthName(int month, nativedate::core::NameForm form) const override;
    std::string dayName(int dayOfWeek, nativedate::core::NameForm form) const override;
    std::string currentLocale() const override;
};

} // namespace margelo::nitro::rnpackages_nativedate
