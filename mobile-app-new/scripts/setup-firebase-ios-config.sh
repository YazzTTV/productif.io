#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_IOS="$ROOT_DIR/ios/Productifio/GoogleService-Info.plist.example"
SRC_EXPO="$ROOT_DIR/firebase/GoogleService-Info.plist.example"
DST_IOS="$ROOT_DIR/ios/Productifio/GoogleService-Info.plist"
DST_EXPO="$ROOT_DIR/firebase/GoogleService-Info.plist"

if [[ ! -f "$SRC_IOS" || ! -f "$SRC_EXPO" ]]; then
  echo "Template file missing. Expected:"
  echo "  - $SRC_IOS"
  echo "  - $SRC_EXPO"
  exit 1
fi

if [[ -z "${FIREBASE_IOS_API_KEY:-}" ]]; then
  echo "Missing FIREBASE_IOS_API_KEY."
  echo "Usage:"
  echo "  FIREBASE_IOS_API_KEY='AIza...' ./scripts/setup-firebase-ios-config.sh"
  exit 1
fi

cp "$SRC_IOS" "$DST_IOS"
cp "$SRC_EXPO" "$DST_EXPO"

sed -i '' "s|__FIREBASE_IOS_API_KEY__|$FIREBASE_IOS_API_KEY|g" "$DST_IOS"
sed -i '' "s|__FIREBASE_IOS_API_KEY__|$FIREBASE_IOS_API_KEY|g" "$DST_EXPO"

echo "GoogleService-Info.plist generated locally:"
echo "  - $DST_IOS"
echo "  - $DST_EXPO"
echo "These files are ignored by Git."
