#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERIAL="${1:?Informe o emulador, por exemplo emulator-5556}"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ADB=("$SDK/platform-tools/adb" -s "$SERIAL")
TOOLS="$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)"
PLATFORM="$(ls -d "$SDK"/platforms/android-3* | sort -V | tail -1)/android.jar"
WORK="$(mktemp -d)"
APP="app.motorista.android"
SERVICE="$APP/app.motorista.copilot.OfferAccessibilityService"
UBER="com.ubercab.driver"
NINETY_NINE="com.app99.driver"
INDRIVE="sinet.startup.inDriver"
TEST_APP=""
FAILED=0
INSTALLED=0

remove_test_app() {
  [ "$INSTALLED" = 1 ] && "${ADB[@]}" uninstall "$TEST_APP" >/dev/null
  INSTALLED=0
}

cleanup() {
  remove_test_app
  rm -rf "$WORK"
}
trap cleanup EXIT

case "$SERIAL" in
  emulator-*) ;;
  *) echo "Use só em emulador: o app de teste ocupa os pacotes das plataformas." >&2; exit 1 ;;
esac

compile_test_app() {
  mkdir -p "$WORK/classes"
  javac -nowarn -source 8 -target 8 -cp "$PLATFORM" -d "$WORK/classes" "$ROOT/scripts/oferta-teste/src/t/Main.java" 2>/dev/null
  find "$WORK/classes" -name '*.class' -exec "$TOOLS/d8" --lib "$PLATFORM" --min-api 26 --output "$WORK" {} +
  keytool -genkeypair -keystore "$WORK/key.jks" -storepass teste123 -keypass teste123 -alias teste -keyalg RSA -dname CN=teste -validity 2 2>/dev/null
}

use_platform() {
  remove_test_app
  TEST_APP="$1"
  rm -f "$WORK/base.apk" "$WORK/aligned.apk" "$WORK/test.apk"
  "$TOOLS/aapt2" link -o "$WORK/base.apk" --manifest "$ROOT/scripts/oferta-teste/AndroidManifest.xml" --rename-manifest-package "$TEST_APP" -I "$PLATFORM"
  (cd "$WORK" && zip -q base.apk classes.dex)
  "$TOOLS/zipalign" -f 4 "$WORK/base.apk" "$WORK/aligned.apk"
  "$TOOLS/apksigner" sign --ks "$WORK/key.jks" --ks-pass pass:teste123 --out "$WORK/test.apk" "$WORK/aligned.apk"
  "${ADB[@]}" install "$WORK/test.apk" >/dev/null
  INSTALLED=1
  echo "--- $TEST_APP"
  sleep 3
}

offer_count() {
  if ! "${ADB[@]}" shell run-as "$APP" test -f databases/offer_log.db; then
    echo 0
    return
  fi
  "${ADB[@]}" exec-out run-as "$APP" cat databases/offer_log.db > "$WORK/log.db"
  "${ADB[@]}" exec-out run-as "$APP" cat databases/offer_log.db-wal > "$WORK/log.db-wal" 2>/dev/null || true
  rm -f "$WORK/log.db-shm"
  python3 -I -c "import sqlite3,sys;print(sqlite3.connect(sys.argv[1]).execute('select count(*) from offers').fetchone()[0])" "$WORK/log.db"
}

setup() {
  "${ADB[@]}" shell am broadcast -a app.motorista.copilot.MOCK_SETUP --es image "$1" >/dev/null
  sleep 1
}

last_value() {
  python3 -I -c "
import json,sqlite3,sys
row=sqlite3.connect(sys.argv[1]).execute('select data from offers order by timestamp desc limit 1').fetchone()
print(json.loads(row[0])['valueCents'] if row else 0)" "$WORK/log.db"
}

check() {
  local name="$1" mode="$2" expected="$3" value="${4:-}" wait_seconds="${5:-5}"
  "${ADB[@]}" shell am force-stop "$TEST_APP"
  "${ADB[@]}" shell input keyevent KEYCODE_HOME
  sleep 4
  local before after read_value=""
  before="$(offer_count)"
  "${ADB[@]}" shell am start -n "$TEST_APP/t.Main" --es mode "$mode" >/dev/null
  sleep "$wait_seconds"
  [ -n "${SHOTS_DIR:-}" ] && "${ADB[@]}" exec-out screencap -p > "$SHOTS_DIR/$TEST_APP-$mode.png"
  after="$(offer_count)"
  [ -n "$value" ] && read_value="$(last_value)"
  if [ "$((after - before))" = "$expected" ] && [ "$read_value" = "$value" ]; then
    echo "ok    $name"
  else
    echo "FALHA $name: esperava $expected registro(s) e valor '$value', veio $((after - before)) e '$read_value'"
    FAILED=1
  fi
}

"${ADB[@]}" shell pm list packages "$APP" | grep -q "$APP" || { echo "Instale o build de debug do app antes." >&2; exit 1; }
compile_test_app
"${ADB[@]}" shell settings put secure enabled_accessibility_services "$SERVICE"
"${ADB[@]}" shell settings put secure accessibility_enabled 1
"${ADB[@]}" shell appops set "$APP" SYSTEM_ALERT_WINDOW allow
sleep 4
setup false

use_platform "$UBER"
check "tela sem oferta não gera registro" home 0
check "oferta com botão e contador" button 1 1840
check "oferta sem botão" nobutton 1 1840
check "só imagem com a opção desligada não lê" canvas 0
setup true
check "só imagem com a opção ligada lê" canvas 1 1840 8
check "só imagem repetida lê de novo" canvas 1 1840 8
check "tela de viagem não gera registro" trip 0
setup false

use_platform "$NINETY_NINE"
check "tela sem oferta não gera registro" home 0
check "oferta com botão" button 1 1840
check "número e unidade separados e saldo ignorado" split 1 1120
check "só imagem com a opção desligada não lê" canvas 0
setup true
check "só imagem com a opção ligada lê" canvas 1 1840 8
setup false

use_platform "$INDRIVE"
check "tela sem oferta não gera registro" home 0
check "oferta com preço por km" bid 1 1300
check "oferta com os dois trechos" route 1 1000
setup true
check "imagem não vale para esta plataforma" canvas 0 "" 8
setup false

exit "$FAILED"
