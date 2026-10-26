import { copilot, CopilotStatus, OfferHistoryEntry } from '@modules/copilot';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useInterval } from '@/shared/hooks/useInterval';
import { syncCopilotTargets } from './syncTargets';

const DIAGNOSTICS_REFRESH_MS = 2000;
const SAMPLE_OFFER = 'R$ 18,40 | 5 min (2,1 km) | Viagem de 14 min (6,4 km) | Aceitar';

export function useCopilot() {
  const [status, setStatus] = useState<CopilotStatus>(() => copilot.getStatus());
  const [history, setHistory] = useState<OfferHistoryEntry[]>([]);
  const [diagnosticsOn, setDiagnosticsOn] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setStatus(copilot.getStatus());
    setHistory(copilot.getHistory());
  }, []);

  useFocusEffect(refresh);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);
  useInterval(() => setDiagnostics(copilot.getDiagnostics()), diagnosticsOn ? DIAGNOSTICS_REFRESH_MS : null);

  const setEnabled = async (value: boolean) => {
    await syncCopilotTargets();
    copilot.setEnabled(value);
    refresh();
  };

  const setVoiceEnabled = (value: boolean) => {
    copilot.setVoiceEnabled(value);
    refresh();
  };

  const setFloating = (value: boolean) => {
    if (!value) {
      copilot.stopFloating();
      return refresh();
    }
    if (!copilot.startFloating()) {
      setMessage('Permita a sobreposição de tela para usar o botão flutuante.');
      copilot.openOverlaySettings();
    }
    refresh();
  };

  const toggleDiagnostics = (value: boolean) => {
    copilot.setDiagnosticsEnabled(value);
    setDiagnosticsOn(value);
    if (!value) setDiagnostics([]);
  };

  const testCard = () => {
    const shown = copilot.testOffer(SAMPLE_OFFER);
    setMessage(shown ? 'Cartão de teste exibido no topo da tela.' : 'Ative o serviço de acessibilidade para ver o cartão.');
  };

  const clearHistory = () => {
    copilot.clearHistory();
    refresh();
  };

  return {
    status,
    history,
    diagnosticsOn,
    diagnostics,
    message,
    setEnabled,
    setVoiceEnabled,
    setFloating,
    toggleDiagnostics,
    testCard,
    clearHistory,
    openAccessibility: copilot.openAccessibilitySettings,
    openAppSettings: copilot.openAppSettings,
  };
}
