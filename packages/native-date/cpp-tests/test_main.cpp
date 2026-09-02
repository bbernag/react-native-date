#define DOCTEST_CONFIG_IMPLEMENT
#include "doctest.h"

#include "fakes/ScopedTimezone.hpp"

int main(int argc, char** argv) {
    // Local-time code paths (mktime/localtime_r) read the process TZ. Pin it so
    // results do not depend on the developer's or CI runner's zone; individual
    // tests opt into other zones with ScopedTimezone.
    nativedate::test::ScopedTimezone pinned("UTC");

    doctest::Context context;
    context.applyCommandLine(argc, argv);
    return context.run();
}
