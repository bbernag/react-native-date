#include "JniEnv.hpp"

#include <android/log.h>

#define LOG_TAG "NativeDate"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace margelo::nitro::rnpackages_nativedate {

static JavaVM* g_jvm = nullptr;

void JniEnv::setJavaVM(JavaVM* vm) {
    g_jvm = vm;
}

JNIEnv* JniEnv::get() {
    if (g_jvm == nullptr) {
        LOGE("JavaVM not initialized");
        return nullptr;
    }

    JNIEnv* env = nullptr;
    int status = g_jvm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6);

    if (status == JNI_EDETACHED) {
        if (g_jvm->AttachCurrentThread(&env, nullptr) != JNI_OK) {
            LOGE("Failed to attach thread to JVM");
            return nullptr;
        }
    } else if (status != JNI_OK) {
        LOGE("Failed to get JNI environment");
        return nullptr;
    }

    return env;
}

} // namespace margelo::nitro::rnpackages_nativedate
