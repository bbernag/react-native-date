#!/usr/bin/env bash
# Assert a packed @bernagl/react-native-date tarball contains the files
# consumers need to autolink and load the JS facade.
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <tarball.tgz>" >&2
  exit 2
fi

tarball=$1
if [[ ! -f $tarball ]]; then
  echo "assert-pack-contents: tarball not found: $tarball" >&2
  exit 1
fi

list=$(tar -tzf "$tarball")
echo "$list"

prefix=
if echo "$list" | grep -q '^package/'; then
  prefix=package/
fi

required=(
  'nitrogen/generated/ios/NativeDate+autolinking.rb'
  'lib/module/index.js'
)

status=0
for file in "${required[@]}"; do
  if ! echo "$list" | grep -F -q "${prefix}${file}"; then
    echo "assert-pack-contents: missing ${prefix}${file}" >&2
    status=1
  fi
done

exit "$status"
