#!/usr/bin/env bash
set -euo pipefail

APK="$1"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
AAPT2="$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)/aapt2"
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

FOUND="$("$AAPT2" dump permissions "$APK" | sed -n "s/^uses-permission: name='\(.*\)'.*/\1/p" | sort -u)"
EXTRA="$(comm -23 <(echo "$FOUND") <(printf '%s\n' "${ALLOWED[@]}" | sort -u))"

if [ -n "$EXTRA" ]; then
  echo "Permissões fora da lista permitida:" >&2
  echo "$EXTRA" >&2
  exit 1
fi

echo "Permissões conferidas: nenhuma fora da lista."
