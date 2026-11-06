#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${MOTORISTA_KEYSTORE:-$HOME/.android-keys/motorista-release.jks}"
KEY_ALIAS="${MOTORISTA_KEY_ALIAS:-motorista}"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
APKSIGNER="$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)/apksigner"
UNSIGNED="$ROOT/android/app/build/outputs/apk/release/app-release.apk"

[ -f "$KEYSTORE" ] || { echo "Chave de assinatura não encontrada: $KEYSTORE" >&2; exit 1; }

export MOTORISTA_KEYSTORE_PASSWORD="${MOTORISTA_KEYSTORE_PASSWORD:-$(security find-generic-password -a motorista -s motorista-release-keystore -w)}"

cd "$ROOT"
npm run typecheck
npm run lint
npm test

APP_VARIANT=release npx expo prebuild --platform android --clean --no-install

cd "$ROOT/android"
./gradlew :copilot:testDebugUnitTest --no-daemon

mkdir -p "$ROOT/dist"

build_apk() {
  local architecture="$1" output="$2"
  NODE_ENV=production APP_VARIANT=release ./gradlew assembleRelease -PreactNativeArchitectures="$architecture" --no-daemon
  "$APKSIGNER" sign \
    --ks "$KEYSTORE" \
    --ks-key-alias "$KEY_ALIAS" \
    --ks-pass env:MOTORISTA_KEYSTORE_PASSWORD \
    --key-pass env:MOTORISTA_KEYSTORE_PASSWORD \
    --out "$output" \
    "$UNSIGNED"
  bash "$ROOT/scripts/verificar-permissoes.sh" "$output"
  "$APKSIGNER" verify --print-certs "$output" | grep "SHA-256"
  shasum -a 256 "$output"
}

build_apk arm64-v8a "$ROOT/dist/motorista.apk"
build_apk armeabi-v7a "$ROOT/dist/motorista-32bits.apk"
