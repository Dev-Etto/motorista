#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${MOTORISTA_KEYSTORE:-$HOME/.android-keys/motorista-release.jks}"
KEY_ALIAS="${MOTORISTA_KEY_ALIAS:-motorista}"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
APKSIGNER="$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)/apksigner"
UNSIGNED="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
OUTPUT="$ROOT/dist/motorista.apk"

[ -f "$KEYSTORE" ] || { echo "Chave de assinatura não encontrada: $KEYSTORE" >&2; exit 1; }

export MOTORISTA_KEYSTORE_PASSWORD="${MOTORISTA_KEYSTORE_PASSWORD:-$(security find-generic-password -a motorista -s motorista-release-keystore -w)}"

cd "$ROOT"
APP_VARIANT=release npx expo prebuild --platform android --clean --no-install

cd "$ROOT/android"
NODE_ENV=production APP_VARIANT=release ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a --no-daemon

mkdir -p "$ROOT/dist"
"$APKSIGNER" sign \
  --ks "$KEYSTORE" \
  --ks-key-alias "$KEY_ALIAS" \
  --ks-pass env:MOTORISTA_KEYSTORE_PASSWORD \
  --key-pass env:MOTORISTA_KEYSTORE_PASSWORD \
  --out "$OUTPUT" \
  "$UNSIGNED"

"$APKSIGNER" verify --print-certs "$OUTPUT" | grep "SHA-256"
shasum -a 256 "$OUTPUT"
