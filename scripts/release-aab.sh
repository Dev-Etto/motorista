#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export MOTORISTA_KEYSTORE="${MOTORISTA_KEYSTORE:-$HOME/.android-keys/motorista-release.jks}"
export MOTORISTA_KEY_ALIAS="${MOTORISTA_KEY_ALIAS:-motorista}"

[ -f "$MOTORISTA_KEYSTORE" ] || { echo "Chave de assinatura não encontrada: $MOTORISTA_KEYSTORE" >&2; exit 1; }
export MOTORISTA_KEYSTORE_PASSWORD="${MOTORISTA_KEYSTORE_PASSWORD:-$(security find-generic-password -a motorista -s motorista-release-keystore -w)}"

cd "$ROOT"
[ -f google-services.json ] || { echo "google-services.json não encontrado na raiz do projeto." >&2; exit 1; }
npm run typecheck
npm run lint
npm test

APP_VARIANT=release npx expo prebuild --platform android --clean --no-install

cd "$ROOT/android"
./gradlew :copilot:testDebugUnitTest --no-daemon
NODE_ENV=production APP_VARIANT=release ./gradlew bundleRelease --no-daemon

MANIFEST="$(find "$ROOT/android/app/build/intermediates" -path '*merged_manifest*' -path '*release*' -name AndroidManifest.xml | head -1)"
[ -n "$MANIFEST" ] || { echo "Manifesto final do release não encontrado." >&2; exit 1; }
bash "$ROOT/scripts/verificar-permissoes.sh" "$MANIFEST"

mkdir -p "$ROOT/dist"
cp "$ROOT/android/app/build/outputs/bundle/release/app-release.aab" "$ROOT/dist/motorista.aab"

jarsigner -verify "$ROOT/dist/motorista.aab" | tail -1

shasum -a 256 "$ROOT/dist/motorista.aab"
