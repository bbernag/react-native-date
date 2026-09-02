#pragma once

#include <cstdlib>
#include <ctime>
#include <optional>
#include <string>

namespace nativedate::test {

/**
 * RAII guard that sets the process TZ (and calls tzset) for the duration of a
 * test, restoring the previous value afterwards. Tests are single-threaded, so
 * mutating the environment here is safe.
 */
class ScopedTimezone {
public:
    explicit ScopedTimezone(const char* zone) {
        if (const char* previous = std::getenv("TZ")) {
            previous_ = previous;
        }
        setenv("TZ", zone, 1);
        tzset();
    }

    ~ScopedTimezone() {
        if (previous_) {
            setenv("TZ", previous_->c_str(), 1);
        } else {
            unsetenv("TZ");
        }
        tzset();
    }

    ScopedTimezone(const ScopedTimezone&) = delete;
    ScopedTimezone& operator=(const ScopedTimezone&) = delete;

private:
    std::optional<std::string> previous_;
};

} // namespace nativedate::test
