#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'This build needs macOS and Xcode. Use the GitHub iOS sideload workflow.' >&2
  exit 1
fi
npm ci
npm run sync
mkdir -p out
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath build/DerivedData \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY='' build
python3 package-ipa.py build/DerivedData/Build/Products/Release-iphoneos/App.app out/Suncola-iOS-1.1.0-sideload.ipa
shasum -a 256 out/Suncola-iOS-1.1.0-sideload.ipa > out/SHA256SUMS.txt
