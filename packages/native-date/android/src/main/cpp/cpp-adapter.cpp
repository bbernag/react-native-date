#include <jni.h>
#include "rnpackages_nativedateOnLoad.hpp"

// Forward declarations for platform helpers
extern "C" void TimezoneHelper_setJavaVM(JavaVM* vm);
extern "C" void LocaleHelper_setJavaVM(JavaVM* vm);
extern "C" void RelativeTimeHelper_setJavaVM(JavaVM* vm);

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
    // Initialize platform helpers with JavaVM reference
    TimezoneHelper_setJavaVM(vm);
    LocaleHelper_setJavaVM(vm);
    RelativeTimeHelper_setJavaVM(vm);

    return margelo::nitro::rnpackages_nativedate::initialize(vm);
}
