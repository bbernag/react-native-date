cmake_minimum_required(VERSION 3.16)
project(nativedate_core_tests CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

option(NATIVEDATE_SANITIZE "Build the tests with AddressSanitizer and UndefinedBehaviorSanitizer" OFF)

# The Nitro-free core under test. Every source here must build with only the
# C++ standard library (no NitroModules/ or nitrogen/ headers).
set(NATIVEDATE_CORE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../cpp/core")
file(GLOB NATIVEDATE_CORE_SOURCES CONFIGURE_DEPENDS "${NATIVEDATE_CORE_DIR}/*.cpp")

add_library(nativedate_core STATIC ${NATIVEDATE_CORE_SOURCES})
target_include_directories(nativedate_core PUBLIC "${NATIVEDATE_CORE_DIR}")
target_compile_options(nativedate_core PRIVATE -Wall -Wextra -Wpedantic -Wno-unused-parameter)

file(GLOB NATIVEDATE_TEST_SOURCES CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/test_*.cpp")

add_executable(nativedate_core_tests test_main.cpp ${NATIVEDATE_TEST_SOURCES})
target_include_directories(nativedate_core_tests PRIVATE
  "${CMAKE_CURRENT_SOURCE_DIR}"
  "${CMAKE_CURRENT_SOURCE_DIR}/vendor"
)
target_link_libraries(nativedate_core_tests PRIVATE nativedate_core)
target_compile_options(nativedate_core_tests PRIVATE -Wall -Wextra -Wno-unused-parameter)

if(NATIVEDATE_SANITIZE)
  set(NATIVEDATE_SANITIZER_FLAGS -fsanitize=address,undefined -fno-omit-frame-pointer)
  foreach(target nativedate_core nativedate_core_tests)
    target_compile_options(${target} PRIVATE ${NATIVEDATE_SANITIZER_FLAGS})
    target_link_options(${target} PRIVATE ${NATIVEDATE_SANITIZER_FLAGS})
  endforeach()
endif()

enable_testing()
add_test(NAME nativedate_core_tests COMMAND nativedate_core_tests)
