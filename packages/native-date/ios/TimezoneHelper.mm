#import <Foundation/Foundation.h>
#include "TimezoneHelper.hpp"

#include <chrono>
#include <mutex>
#include <unordered_map>

namespace margelo::nitro::rnpackages_nativedate {

namespace {

constexpr std::size_t kZoneCacheCapacity = 64;
constexpr auto kSystemZoneTtl = std::chrono::seconds(1);

std::mutex& zoneCacheMutex() {
    static std::mutex mutex;
    return mutex;
}

/**
 * IANA id -> NSTimeZone. C++ containers do not retain Objective-C objects, so
 * each stored pointer is CFRetain'd on insert and CFRelease'd on eviction.
 * Callers may use the returned zone after releasing the mutex: ARC retains
 * the return value, and the cache holds its own retain.
 */
std::unordered_map<std::string, NSTimeZone*>& zoneCache() {
    static std::unordered_map<std::string, NSTimeZone*> cache;
    return cache;
}

void releaseCachedZones(std::unordered_map<std::string, NSTimeZone*>& cache) {
    for (auto& entry : cache) {
        CFRelease((__bridge CFTypeRef)entry.second);
    }
    cache.clear();
}

/** Resolve `ianaZone` through the cache. nil when Foundation does not know the name. */
NSTimeZone* cachedZone(const std::string& ianaZone) {
    {
        std::lock_guard<std::mutex> lock(zoneCacheMutex());
        auto it = zoneCache().find(ianaZone);
        if (it != zoneCache().end()) {
            return it->second;
        }
    }

    NSString* name = [NSString stringWithUTF8String:ianaZone.c_str()];
    if (name == nil) {
        return nil;
    }
    NSTimeZone* zone = [NSTimeZone timeZoneWithName:name];
    if (zone == nil) {
        return nil;
    }

    std::lock_guard<std::mutex> lock(zoneCacheMutex());
    auto& cache = zoneCache();
    auto it = cache.find(ianaZone);
    if (it != cache.end()) {
        return it->second;
    }
    if (cache.size() >= kZoneCacheCapacity) {
        // Bounded without bookkeeping: drop everything and refill on demand.
        releaseCachedZones(cache);
    }
    CFRetain((__bridge CFTypeRef)zone);
    cache.emplace(ianaZone, zone);
    return zone;
}

} // namespace

std::string TimezoneHelper::getSystemTimezone() {
    static std::mutex mutex;
    static std::string cachedName;
    static std::chrono::steady_clock::time_point cachedAt;

    const auto now = std::chrono::steady_clock::now();
    {
        std::lock_guard<std::mutex> lock(mutex);
        if (!cachedName.empty() && now - cachedAt < kSystemZoneTtl) {
            return cachedName;
        }
    }

    std::string fresh;
    @autoreleasepool {
        const char* utf8 = [NSTimeZone systemTimeZone].name.UTF8String;
        fresh = utf8 != nullptr ? utf8 : "UTC";
    }

    std::lock_guard<std::mutex> lock(mutex);
    cachedName = fresh;
    cachedAt = now;
    return fresh;
}

std::optional<int> TimezoneHelper::getOffsetForTimestamp(const std::string& ianaZone, int64_t timestampMs) {
    @autoreleasepool {
        NSTimeZone* zone = cachedZone(ianaZone);
        if (zone == nil) {
            return std::nullopt;
        }
        NSDate* date = [NSDate dateWithTimeIntervalSince1970:(timestampMs / 1000.0)];
        // secondsFromGMTForDate: already accounts for DST at that instant.
        NSInteger offsetSeconds = [zone secondsFromGMTForDate:date];
        return static_cast<int>(offsetSeconds / 60);
    }
}

std::vector<std::string> TimezoneHelper::getAvailableTimezones() {
    @autoreleasepool {
        std::vector<std::string> result;
        NSArray<NSString*>* knownTimezones = [NSTimeZone knownTimeZoneNames];
        result.reserve([knownTimezones count]);
        for (NSString* name in knownTimezones) {
            const char* utf8 = name.UTF8String;
            if (utf8 != nullptr) {
                result.emplace_back(utf8);
            }
        }
        return result;
    }
}

bool TimezoneHelper::isValidTimezone(const std::string& ianaZone) {
    @autoreleasepool {
        return cachedZone(ianaZone) != nil;
    }
}

} // namespace margelo::nitro::rnpackages_nativedate
