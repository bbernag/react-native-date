#include <jni.h>
#include <fbjni/fbjni.h>
#include "JniEnv.hpp"
#include "rnpackages_nativedateOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
    margelo::nitro::rnpackages_nativedate::JniEnv::setJavaVM(vm);

    return facebook::jni::initialize(vm, []() {
        margelo::nitro::rnpackages_nativedate::registerAllNatives();
    });
}
