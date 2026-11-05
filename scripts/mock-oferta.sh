#!/usr/bin/env bash
set -euo pipefail

PACKAGE="app.motorista.android"
SERVICE="$PACKAGE/app.motorista.copilot.OfferAccessibilityService"
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
UBER="com.ubercab.driver"
NOVENTA_E_NOVE="com.app99.driver"
INDRIVE="sinet.startup.inDriver"
OFFER_SECONDS=5
RESTART_SECONDS=8

scan() {
  "$ADB" shell am broadcast -a app.motorista.copilot.MOCK_SCAN --es source "$1" --es text "'$2'" >/dev/null
}

offer() {
  scan "$1" "$2"
  echo "Oferta enviada: $2"
}

tap() {
  "$ADB" shell am broadcast -a app.motorista.copilot.MOCK_TAP --es text "'$1'" >/dev/null
  echo "Toque enviado: $1"
}

finish_offer() {
  scan "$1" ""
  echo "Oferta encerrada."
}

setup() {
  "$ADB" shell pm grant "$PACKAGE" android.permission.POST_NOTIFICATIONS
  "$ADB" shell appops set "$PACKAGE" SYSTEM_ALERT_WINDOW allow
  "$ADB" shell settings put secure enabled_accessibility_services "$SERVICE"
  "$ADB" shell settings put secure accessibility_enabled 1
  sleep 2
  "$ADB" shell am broadcast -a app.motorista.copilot.MOCK_SETUP >/dev/null
  echo "Copiloto ligado, com custo de R\$ 0,90/km e mínimos de R\$ 2,00/km e R\$ 30,00/h."
  echo "Ao abrir o app, os valores do veículo cadastrado substituem esses."
}

play() {
  local source="$1" text="$2"
  offer "$source" "$text"
  sleep "$OFFER_SECONDS"
  finish_offer "$source"
  sleep 2
}

INDRIVE_OFFER='R$ 3/km | ~2,2 km | R$ 13 | 5.0 (16) | 2 min. | Aceitar por R$ 13 | Ofereça sua tarifa | R$ 14,50 | R$ 16 | Pular'
UBER_OFFER='R$ 18,40 | ★ 4,92 | 5 min (2,1 km) | Viagem de 14 min (6,4 km) | Aceitar'
NOVENTA_E_NOVE_OFFER='R$ 12,00 | 4,87 | 3 km | 10 min | Aceitar'
BAD_OFFER='R$ 6,00 | 4,70 | 3 km | 25 min | 5 km | Aceitar'
PARTIAL_OFFER='R$ 15,00 | Aceitar'

case "${1:-ajuda}" in
  setup) setup ;;
  indrive) offer "$INDRIVE" "$INDRIVE_OFFER" ;;
  uber) offer "$UBER" "$UBER_OFFER" ;;
  99) offer "$NOVENTA_E_NOVE" "$NOVENTA_E_NOVE_OFFER" ;;
  ruim) offer "$UBER" "$BAD_OFFER" ;;
  parcial) offer "$UBER" "$PARTIAL_OFFER" ;;
  texto) offer "${3:-$UBER}" "$2" ;;
  dados)
    "$ADB" shell run-as "$PACKAGE" touch files/mock-seed
    "$ADB" shell am force-stop "$PACKAGE"
    "$ADB" shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
    sleep "$RESTART_SECONDS"
    setup
    echo "Veículo e 6 jornadas de exemplo criados. Isso apaga as jornadas do emulador."
    ;;
  esquecida) "$ADB" shell am broadcast -a app.motorista.copilot.MOCK_FORGOTTEN >/dev/null ;;
  aceitar) tap "Aceitar" ;;
  recusar) tap "Recusar" ;;
  contraoferta) tap "${2:-R\$ 14,50}" ;;
  fim) finish_offer "${2:-$UBER}" ;;
  sequencia)
    play "$INDRIVE" "$INDRIVE_OFFER"
    play "$UBER" "$UBER_OFFER"
    play "$NOVENTA_E_NOVE" "$NOVENTA_E_NOVE_OFFER"
    play "$UBER" "$BAD_OFFER"
    ;;
  *)
    cat <<'AJUDA'
Uso: npm run mock -- <comando>

  setup              Libera permissões e liga o Copiloto no emulador
  indrive            Envia uma oferta simulada do inDrive
  uber               Envia uma oferta simulada da Uber
  99                 Envia uma oferta simulada da 99
  ruim               Envia uma oferta que não cobre o custo
  parcial            Envia uma leitura incompleta, que não deve gerar aviso
  texto "<texto>"    Envia um texto próprio, como o da Calibração
  aceitar            Simula o toque em Aceitar na oferta da tela
  recusar            Simula o toque em Recusar na oferta da tela
  contraoferta       Simula o toque em uma contraoferta, como "R$ 14,50"
  fim                Encerra a oferta na tela
  sequencia          Envia quatro ofertas seguidas
  dados              Apaga as jornadas e cria um veículo e 6 jornadas de exemplo
  esquecida          Mostra o aviso de jornada esquecida

Funciona só em build de debug. As ofertas são simuladas: testam a leitura do
texto, a nota e os avisos, mas não a captura da tela das plataformas.
AJUDA
    ;;
esac
