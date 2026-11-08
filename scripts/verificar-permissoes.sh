#!/usr/bin/env bash
set -euo pipefail

TARGET="$1"
MIN_TARGET_SDK=36
ALLOWED=(
  android.permission.ACCESS_COARSE_LOCATION
  android.permission.ACCESS_FINE_LOCATION
  android.permission.ACCESS_NETWORK_STATE
  android.permission.FOREGROUND_SERVICE
  android.permission.FOREGROUND_SERVICE_LOCATION
  android.permission.FOREGROUND_SERVICE_SPECIAL_USE
  android.permission.INTERNET
  android.permission.POST_NOTIFICATIONS
  android.permission.RECEIVE_BOOT_COMPLETED
  android.permission.SYSTEM_ALERT_WINDOW
  android.permission.VIBRATE
  android.permission.WAKE_LOCK
  app.motorista.android.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
  com.android.vending.BILLING
)

read_manifest() {
  python3 - "$1" "$2" <<'PY'
import sys
import xml.etree.ElementTree as ET

ns = "{http://schemas.android.com/apk/res/android}"
root = ET.parse(sys.argv[1]).getroot()
if sys.argv[2] == "permissions":
    tags = ("uses-permission", "uses-permission-sdk-23")
    print("\n".join(sorted({e.get(ns + "name") for e in root if e.tag in tags})))
    sys.exit()
sdk = root.find("uses-sdk")
print(sdk.get(ns + "targetSdkVersion") if sdk is not None else "")
PY
}

read_apk() {
  local sdk="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  local aapt2
  aapt2="$(ls -d "$sdk"/build-tools/* | sort -V | tail -1)/aapt2"
  if [ "$2" = "permissions" ]; then
    "$aapt2" dump permissions "$1" | sed -n "s/^uses-permission: name='\(.*\)'.*/\1/p" | sort -u
    return
  fi
  "$aapt2" dump badging "$1" | sed -n "s/^targetSdkVersion:'\([0-9]*\)'.*/\1/p"
}

read_target() {
  case "$TARGET" in
    *.xml) read_manifest "$TARGET" "$1" ;;
    *) read_apk "$TARGET" "$1" ;;
  esac
}

FOUND="$(read_target permissions)"
EXTRA="$(comm -23 <(echo "$FOUND") <(printf '%s\n' "${ALLOWED[@]}" | sort -u))"

if [ -n "$EXTRA" ]; then
  echo "Permissões fora da lista permitida:" >&2
  echo "$EXTRA" >&2
  exit 1
fi

TARGET_SDK="$(read_target target-sdk)"

if [ -z "$TARGET_SDK" ] || [ "$TARGET_SDK" -lt "$MIN_TARGET_SDK" ]; then
  echo "targetSdk ${TARGET_SDK:-desconhecido} abaixo do mínimo da Play ($MIN_TARGET_SDK)." >&2
  exit 1
fi

echo "Permissões conferidas: nenhuma fora da lista. targetSdk $TARGET_SDK."
