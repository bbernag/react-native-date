require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NativeDate"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/bbernag/react-native-date.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{m,mm}",
    "cpp/**/*.{hpp,cpp}",
  ]

  # Framework settings
  s.framework    = "Foundation"

  # Compiler settings
  s.compiler_flags = '-Wall -Wextra -Wno-unused-parameter'

  # Header search paths
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => '"$(PODS_TARGET_SRCROOT)/cpp" "$(PODS_TARGET_SRCROOT)/nitrogen/generated/shared/c++"',
    "GCC_WARN_INHIBIT_ALL_WARNINGS" => "NO",
    "CLANG_WARN_DOCUMENTATION_COMMENTS" => "NO",
  }

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'

  load 'nitrogen/generated/ios/NativeDate+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
