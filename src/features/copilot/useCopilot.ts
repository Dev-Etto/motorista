import { copilot, CopilotPreferences, CopilotStatus, OfferHistoryEntry } from '@modules/copilot';
import { PLATFORM_PACKAGES } from '@modules/copilot/platforms';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useInterval } from '@/shared/hooks/useInterval';
import { syncCopilotTargets } from './syncTargets';

const RECENT_OFFERS = 5;
const DIAGNOSTICS_REFRESH_MS = 2000;
const OUTSIDE_TEST_DELAY_MS = 5000;
const SAMPLES = [
  { source: PLATFORM_PACKAGES.uber, text: 'R$ 18,40 | ★ 4,92 | 5 min (2,1 km) | Viagem de 14 min (6,4 km) | Aceitar' },
  { source: PLATFORM_PACKAGES.ninetyNine, text: 'R$ 11,20 | ★ 4,75 | 4 min (1,5 km) | Viagem de 18 min (6,5 km) | Aceitar' },
  { source: PLATFORM_PACKAGES.inDrive, text: 'R$ 7,00 | 6 min (3,0 km) | Viagem de 22 min (9,0 km) | Aceitar' },
];

export function useCopilot() {
  const [status, setStatus] = useState<CopilotStatus>(() => copilot.getStatus());
  const [preferences, setPreferencesState] = useState<CopilotPreferences>(() => copilot.getPreferences());
  const [history, setHistory] = useState<OfferHistoryEntry[]>([]);
  const [diagnosticsOn, setDiagnosticsOn] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const sampleIndex = useRef(0);

  const refresh = useCallback(() => {
    setStatus(copilot.getStatus());
    setHistory(copilot.getRecentOffers(RECENT_OFFERS));
  }, []);

  useFocusEffect(refresh);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);
  useInterval(() => setDiagnostics(copilot.getDiagnostics()), diagnosticsOn ? DIAGNOSTICS_REFRESH_MS : null);

  const updatePreferences = (changes: Partial<CopilotPreferences>) => {
    const next = { ...preferences, ...changes };
    copilot.setPreferences(next);
    setPreferencesState(next);
  };

  const setEnabled = async (value: boolean) => {
    await syncCopilotTargets();
    copilot.setEnabled(value);
    refresh();
  };

  const setNotification = async (value: boolean) => {
    if (!value) return updatePreferences({ notification: false });

    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return setMessage('Permita as notificações do app para usar este canal.');

    updatePreferences({ notification: true });
  };

  const setFloating = (value: boolean) => {
    updatePreferences({ floatingButton: value });
    if (!value) {
      copilot.stopFloating();
      return setTimeout(refresh, 300);
    }
    if (!copilot.startFloating()) {
      setMessage('Permita a sobreposição de tela para usar o botão flutuante.');
      return copilot.openOverlaySettings();
    }
    setTimeout(refresh, 300);
  };

  const toggleMonitored = (packageName: string) => {
    const current = preferences.monitoredPackages;
    const monitoredPackages = current.includes(packageName) ? current.filter((item) => item !== packageName) : [...current, packageName];
    updatePreferences({ monitoredPackages });
  };

  const toggleDiagnostics = (value: boolean) => {
    copilot.setDiagnosticsEnabled(value);
    setDiagnosticsOn(value);
    if (!value) setDiagnostics([]);
  };

  const nextSample = (): [string, string] => {
    const sample = SAMPLES[sampleIndex.current % SAMPLES.length];
    sampleIndex.current += 1;
    return [sample.text, sample.source];
  };

  const test = () => {
    const shown = copilot.testOffer(...nextSample());
    setMessage(shown ? 'Teste enviado. Toque de novo para ver outra plataforma e outra nota.' : 'Ative o serviço de acessibilidade para testar.');
    refresh();
  };

  const testNotification = async () => {
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return setMessage('Permita as notificações do app para ver o exemplo.');

    const shown = copilot.testNotification(...nextSample());
    setMessage(shown ? 'Exemplo enviado. Veja no topo da tela ou deslize o painel de notificações.' : 'Permita as notificações do app para ver o exemplo.');
  };

  const testOutside = () => {
    const [text, source] = nextSample();
    const shown = copilot.testOffer(text, source, OUTSIDE_TEST_DELAY_MS);
    setMessage(shown ? 'Saia do app agora. A oferta de exemplo aparece em 5 segundos.' : 'Ative o serviço de acessibilidade para testar.');
  };

  return {
    status,
    preferences,
    history,
    diagnosticsOn,
    diagnostics,
    message,
    setEnabled,
    updatePreferences,
    setNotification,
    setFloating,
    toggleMonitored,
    toggleDiagnostics,
    test,
    testOutside,
    testNotification,
    openAccessibility: copilot.openAccessibilitySettings,
    openAppSettings: copilot.openAppSettings,
    openVoiceSettings: copilot.openVoiceSettings,
    openShortcutSettings: copilot.openShortcutSettings,
  };
}

export type CopilotState = ReturnType<typeof useCopilot>;
