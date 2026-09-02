#pragma once

#include <jni.h>

namespace margelo::nitro::rnpackages_nativedate {

/**
 * Process-wide JNI environment access for the Android helpers.
 *
 * `setJavaVM` is called once from JNI_OnLoad. `get` returns the JNIEnv for
 * the current thread, attaching it when the caller is not already a Java
 * thread. Helpers treat a null return as "JNI is not ready" and fall back.
 */
class JniEnv final {
public:
    JniEnv() = delete;
    JniEnv(const JniEnv&) = delete;
    JniEnv& operator=(const JniEnv&) = delete;

    /** Stores the process JavaVM. Called from JNI_OnLoad. */
    static void setJavaVM(JavaVM* vm);

    /** JNIEnv for this thread, or nullptr if the VM is not ready. */
    static JNIEnv* get();
};

} // namespace margelo::nitro::rnpackages_nativedate
