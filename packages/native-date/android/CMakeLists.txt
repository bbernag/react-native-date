cmake_minimum_required(VERSION 3.9.0)
project(rnpackages_nativedate)

set(PACKAGE_NAME rnpackages_nativedate)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Position Independent Code for shared library
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Source files
set(CPP_SOURCES
  src/main/cpp/cpp-adapter.cpp
  src/main/cpp/TimezoneHelper.cpp
  src/main/cpp/LocaleHelper.cpp
  src/main/cpp/RelativeTimeHelper.cpp
  ../cpp/HybridNativeDate.cpp
  ../cpp/PlatformLocaleProvider.cpp
  ../cpp/PlatformTimezoneProvider.cpp
  ../cpp/core/Arithmetic.cpp
  ../cpp/core/Civil.cpp
  ../cpp/core/Formatter.cpp
  ../cpp/core/IsoParser.cpp
  ../cpp/core/PatternParser.cpp
  ../cpp/core/ZoneMath.cpp
)

# Define C++ library
add_library(${PACKAGE_NAME} SHARED ${CPP_SOURCES})

# Compiler warnings and optimizations
target_compile_options(${PACKAGE_NAME} PRIVATE
  -Wall
  -Wextra
  -Wpedantic
  -Wno-unused-parameter
)

# Add Nitrogen specs
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/rnpackages_nativedate+autolinking.cmake)

# Include directories
target_include_directories(${PACKAGE_NAME} PRIVATE
  "src/main/cpp"
  "../cpp"
  "../nitrogen/generated/shared/c++"
)

# Find required libraries
find_library(LOG_LIB log)

# Link all libraries together
target_link_libraries(${PACKAGE_NAME}
  ${LOG_LIB}
  android
)
