#include "doctest.h"

#include "Formatter.hpp"
#include "LocaleCache.hpp"
#include "fakes/FakeLocaleProvider.hpp"

#include <atomic>
#include <string>
#include <thread>
#include <vector>

using namespace nativedate::core;
using nativedate::test::FakeLocaleProvider;
using nativedate::test::SnapshotLocaleProvider;

namespace {
constexpr double kTuesday = 1709647629045.0; // 2024-03-05T14:07:09.045Z

// A complete, distinct table whose every entry starts with `localeId`.
LocaleNameLists tablesFor(const std::string& localeId) {
    LocaleNameLists lists;
    for (int i = 0; i < 12; i++) {
        lists.monthNames.push_back(localeId + "-month-" + std::to_string(i));
        lists.monthNamesShort.push_back(localeId + "-mon-" + std::to_string(i));
        lists.monthMinimal.push_back(localeId + "-m-" + std::to_string(i));
    }
    for (int i = 0; i < 7; i++) {
        lists.dayNames.push_back(localeId + "-day-" + std::to_string(i));
        lists.dayNamesShort.push_back(localeId + "-dy-" + std::to_string(i));
        lists.dayVeryShort.push_back(localeId + "-d-" + std::to_string(i));
        lists.dayMinimal.push_back(localeId + "-x-" + std::to_string(i));
    }
    return lists;
}
} // namespace

TEST_SUITE("LocaleCache") {

TEST_CASE("makeLocaleCache freezes complete, valid tables") {
    const FakeLocaleProvider english;
    const auto cache = english.makeCache();
    REQUIRE(cache != nullptr);
    CHECK(cache->localeId == "en");
    CHECK(cache->monthName(1, NameForm::Full) == "January");
    CHECK(cache->monthName(12, NameForm::Abbreviated) == "Dec");
    CHECK(cache->monthName(3, NameForm::Short) == "Mar"); // months fall back to Abbreviated
    CHECK(cache->monthName(5, NameForm::Narrow) == "M");
    CHECK(cache->dayName(0, NameForm::Full) == "Sunday");
    CHECK(cache->dayName(6, NameForm::Abbreviated) == "Sat");
    CHECK(cache->dayName(2, NameForm::Short) == "Tu");
    CHECK(cache->dayName(4, NameForm::Narrow) == "T");
}

TEST_CASE("out-of-range indexes yield empty names, never UB") {
    const auto cache = FakeLocaleProvider().makeCache();
    REQUIRE(cache != nullptr);
    CHECK(cache->monthName(0, NameForm::Full).empty());
    CHECK(cache->monthName(13, NameForm::Full).empty());
    CHECK(cache->dayName(-1, NameForm::Full).empty());
    CHECK(cache->dayName(7, NameForm::Full).empty());
}

TEST_CASE("keepPrefix trims ICU's extra month slot and rejects short lists") {
    std::vector<std::string> months = tablesFor("x").monthNames;
    months.push_back(""); // ICU UNDECIMBER slot
    CHECK(months.size() == 13);
    CHECK(keepPrefix(months, 12));
    CHECK(months.size() == 12);
    CHECK(months.back() == "x-month-11");

    LocaleNameLists lists = tablesFor("x");
    lists.monthNames.push_back("Undecimber");
    REQUIRE(keepPrefix(lists.monthNames, 12));
    CHECK(makeLocaleCache("x", std::move(lists)) != nullptr);

    std::vector<std::string> tooShort(11, "m");
    CHECK_FALSE(keepPrefix(tooShort, 12));
    CHECK(tooShort.size() == 11);
}

TEST_CASE("makeLocaleCache fails closed on short, empty, or malformed entries") {
    SUBCASE("only 11 months") {
        LocaleNameLists lists = tablesFor("x");
        lists.monthNames.pop_back();
        CHECK(makeLocaleCache("x", std::move(lists)) == nullptr);
    }
    SUBCASE("13 months (non-Gregorian calendar)") {
        LocaleNameLists lists = tablesFor("x");
        lists.monthNamesShort.push_back("Adar II");
        CHECK(makeLocaleCache("x", std::move(lists)) == nullptr);
    }
    SUBCASE("8 weekdays (ICU's 1-based array copied verbatim)") {
        LocaleNameLists lists = tablesFor("x");
        lists.dayNames.insert(lists.dayNames.begin(), "");
        CHECK(makeLocaleCache("x", std::move(lists)) == nullptr);
    }
    SUBCASE("empty entry") {
        LocaleNameLists lists = tablesFor("x");
        lists.dayMinimal[3] = "";
        CHECK(makeLocaleCache("x", std::move(lists)) == nullptr);
    }
    SUBCASE("byte-sliced CJK is not stored") {
        LocaleNameLists lists = tablesFor("x");
        lists.monthMinimal[0] = std::string("\xE4\xB8\x89\xE6\x9C\x88").substr(0, 1); // first byte of 三月
        CHECK(makeLocaleCache("x", std::move(lists)) == nullptr);
    }
}

TEST_CASE("the snapshot drives the formatter like the fixed fake does") {
    const FakeLocaleProvider japanese(FakeLocaleProvider::Language::Japanese);
    LocaleStore store;
    store.replace(japanese.makeCache());
    SnapshotLocaleProvider provider(store, [] { return nullptr; });
    CHECK(formatInternal(kTuesday, "MMMM EEEE", true, provider) == formatInternal(kTuesday, "MMMM EEEE", true, japanese));
    CHECK(formatInternal(kTuesday, "E", true, provider) == "\xE7\x81\xAB");
}

} // TEST_SUITE

TEST_SUITE("LocaleStore") {

TEST_CASE("first use loads the default without throwing and only once") {
    LocaleStore store;
    int loads = 0;
    SnapshotLocaleProvider provider(store, [&] {
        loads++;
        return FakeLocaleProvider().makeCache();
    });

    CHECK(store.peek() == nullptr);
    CHECK_NOTHROW(CHECK(formatInternal(kTuesday, "MMMM d", true, provider) == "March 5"));
    CHECK(loads == 1);
    CHECK(provider.currentLocale() == "en");
    CHECK(provider.dayName(2, NameForm::Full) == "Tuesday");
    CHECK(loads == 1);
    CHECK(store.peek() != nullptr);
}

TEST_CASE("a failed default load yields empty names and is retried") {
    LocaleStore store;
    int loads = 0;
    bool platformReady = false;
    SnapshotLocaleProvider provider(store, [&]() -> std::shared_ptr<const LocaleCache> {
        loads++;
        if (!platformReady) {
            return nullptr;
        }
        return FakeLocaleProvider().makeCache();
    });

    CHECK_NOTHROW(CHECK(provider.monthName(1, NameForm::Full).empty()));
    CHECK(provider.currentLocale().empty());
    CHECK(loads == 2);

    platformReady = true;
    CHECK(provider.monthName(1, NameForm::Full) == "January");
    CHECK(loads == 3);
    CHECK(provider.monthName(2, NameForm::Full) == "February");
    CHECK(loads == 3);
}

TEST_CASE("replace swaps the snapshot and wins over a lazy default") {
    LocaleStore store;
    SnapshotLocaleProvider provider(store, [] { return FakeLocaleProvider().makeCache(); });

    // setLocale before any use: the default loader must never run afterwards.
    store.replace(FakeLocaleProvider(FakeLocaleProvider::Language::Japanese).makeCache());
    CHECK(provider.currentLocale() == "ja");
    CHECK(provider.monthName(3, NameForm::Full) == "3\xE6\x9C\x88");

    store.replace(FakeLocaleProvider().makeCache());
    CHECK(provider.currentLocale() == "en");
    CHECK(provider.monthName(3, NameForm::Full) == "March");

    // nullptr is ignored, the previous snapshot stays.
    store.replace(nullptr);
    CHECK(provider.currentLocale() == "en");
}

TEST_CASE("a snapshot held by a reader survives a concurrent replace") {
    LocaleStore store;
    store.replace(makeLocaleCache("a", tablesFor("a")));
    const auto held = store.peek();
    store.replace(makeLocaleCache("b", tablesFor("b")));
    CHECK(held->monthName(1, NameForm::Full) == "a-month-0");
    CHECK(store.peek()->monthName(1, NameForm::Full) == "b-month-0");
}

TEST_CASE("concurrent readers and a writer loop never observe a torn snapshot") {
    LocaleStore store;
    std::atomic<bool> stop{false};
    std::atomic<int> mismatches{0};
    std::atomic<int> reads{0};

    constexpr int kReaders = 4;
    std::vector<std::thread> readers;
    readers.reserve(kReaders);
    for (int r = 0; r < kReaders; r++) {
        readers.emplace_back([&] {
            SnapshotLocaleProvider provider(store, [] { return makeLocaleCache("default", tablesFor("default")); });
            while (!stop.load()) {
                const auto snapshot = store.snapshot([] { return makeLocaleCache("default", tablesFor("default")); });
                if (snapshot == nullptr) {
                    mismatches++;
                    continue;
                }
                const std::string& id = snapshot->localeId;
                for (int month = 1; month <= 12; month++) {
                    if (snapshot->monthName(month, NameForm::Narrow).substr(0, id.size()) != id) {
                        mismatches++;
                    }
                }
                for (int day = 0; day <= 6; day++) {
                    if (provider.dayName(day, NameForm::Short).empty()) {
                        mismatches++;
                    }
                }
                reads++;
            }
        });
    }

    std::thread writer([&] {
        for (int i = 0; i < 2000; i++) {
            const std::string id = (i % 2 == 0) ? "even" : "odd";
            store.replace(makeLocaleCache(id, tablesFor(id)));
        }
        stop.store(true);
    });

    writer.join();
    for (auto& reader : readers) {
        reader.join();
    }
    CHECK(mismatches.load() == 0);
    CHECK(reads.load() > 0);
    const auto last = store.peek();
    REQUIRE(last != nullptr);
    CHECK(last->localeId == "odd");
}

} // TEST_SUITE

TEST_SUITE("Locale identifiers") {

TEST_CASE("normalizeLocaleId turns POSIX underscores into BCP-47 hyphens") {
    CHECK(normalizeLocaleId("en_US") == "en-US");
    CHECK(normalizeLocaleId("zh_Hans_CN") == "zh-Hans-CN");
    CHECK(normalizeLocaleId("pt-BR") == "pt-BR");
    CHECK(normalizeLocaleId("") == "");
}

TEST_CASE("isSafeLocaleTag accepts plain tags and rejects everything else") {
    CHECK(isSafeLocaleTag("en"));
    CHECK(isSafeLocaleTag("pt-BR"));
    CHECK(isSafeLocaleTag("zh-Hans"));
    CHECK(isSafeLocaleTag("en-001"));
    CHECK(isSafeLocaleTag(std::string(kMaxLocaleIdLength, 'a')));

    CHECK_FALSE(isSafeLocaleTag(""));
    CHECK_FALSE(isSafeLocaleTag("en_US")); // callers normalize first
    CHECK_FALSE(isSafeLocaleTag("en US"));
    CHECK_FALSE(isSafeLocaleTag("en\x80"));
    CHECK_FALSE(isSafeLocaleTag(std::string("en\0US", 5)));
    CHECK_FALSE(isSafeLocaleTag("en/US"));
    CHECK_FALSE(isSafeLocaleTag(std::string(kMaxLocaleIdLength + 1, 'a')));
}

TEST_CASE("localeIdsEqual ignores case and separator") {
    CHECK(localeIdsEqual("en_US", "en-us"));
    CHECK(localeIdsEqual("zh-Hans", "zh_hans"));
    CHECK(localeIdsEqual("en", "EN"));
    CHECK_FALSE(localeIdsEqual("en", "en-US"));
    CHECK_FALSE(localeIdsEqual("en-US", "en-GB"));
}

} // TEST_SUITE

TEST_SUITE("UTF-8 helpers") {

TEST_CASE("isValidUtf8") {
    CHECK(isValidUtf8(""));
    CHECK(isValidUtf8("March"));
    CHECK(isValidUtf8("\xE4\xB8\x89\xE6\x9C\x88"));                     // 三月
    CHECK(isValidUtf8("\xD8\xA7\xD9\x84\xD8\xA3\xD8\xAD\xD8\xAF"));     // الأحد
    CHECK(isValidUtf8("\xF0\x9F\x98\x80"));                             // 😀

    CHECK_FALSE(isValidUtf8("\xE4\xB8"));         // truncated 3-byte sequence
    CHECK_FALSE(isValidUtf8("\x80"));             // stray continuation byte
    CHECK_FALSE(isValidUtf8("\xC0\xAF"));         // overlong '/'
    CHECK_FALSE(isValidUtf8("\xE0\x80\x80"));     // overlong NUL
    CHECK_FALSE(isValidUtf8("\xED\xA0\x80"));     // UTF-16 surrogate U+D800
    CHECK_FALSE(isValidUtf8("\xF4\x90\x80\x80")); // above U+10FFFF
    CHECK_FALSE(isValidUtf8("\xFF"));
}

TEST_CASE("utf8Prefix slices by code point on CJK and Arabic samples") {
    const std::string march = "\xE4\xB8\x89\xE6\x9C\x88";                  // 三月
    const std::string monday = "\xE5\x91\xA8\xE4\xB8\x80";                 // 周一
    const std::string sunday = "\xD8\xA7\xD9\x84\xD8\xA3\xD8\xAD\xD8\xAF"; // الأحد

    CHECK(utf8Prefix(march, 1) == "\xE4\xB8\x89");
    CHECK(utf8Prefix(march, 2) == march);
    CHECK(utf8Prefix(march, 5) == march);
    CHECK(utf8Prefix(monday, 1) == "\xE5\x91\xA8");
    CHECK(utf8Prefix(sunday, 2) == "\xD8\xA7\xD9\x84");
    CHECK(utf8Prefix("Tue", 2) == "Tu");
    CHECK(utf8Prefix("\xF0\x9F\x98\x80X", 1) == "\xF0\x9F\x98\x80");
    CHECK(utf8Prefix("", 2).empty());
    CHECK(utf8Prefix(march, 0).empty());
    CHECK(isValidUtf8(utf8Prefix(sunday, 3)));
}

TEST_CASE("utf8Prefix on malformed input still returns a byte prefix") {
    CHECK(utf8Prefix("\xE4\xB8", 1) == "\xE4");
    CHECK(utf8Prefix("\x80\x80", 2) == "\x80\x80");
}

TEST_CASE("utf8FromUtf16 handles the BMP, surrogate pairs, and lone surrogates") {
    CHECK(utf8FromUtf16(u"March") == "March");
    CHECK(utf8FromUtf16(u"三月") == "\xE4\xB8\x89\xE6\x9C\x88");
    CHECK(utf8FromUtf16(u"é") == "\xC3\xA9");
    CHECK(utf8FromUtf16(std::u16string{0xD83D, 0xDE00}) == "\xF0\x9F\x98\x80");
    CHECK(utf8FromUtf16(std::u16string{0xD83D}) == "\xEF\xBF\xBD");
    CHECK(utf8FromUtf16(std::u16string{0xDE00, u'a'}) == "\xEF\xBF\xBD" "a");
    CHECK(utf8FromUtf16(u"").empty());
}

} // TEST_SUITE
