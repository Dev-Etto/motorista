import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { syncCopilotTargets } from '@/application/offerSettings';
import { reportError } from '@/shared/utils/reportError';
import { copilot, CopilotStatus, OfferHistoryEntry } from '@modules/copilot';

const RECENT_OFFERS = 5;

export function useCopilotStatus() {
  const [current, setCurrent] = useState<CopilotStatus>(() => copilot.getStatus());
  const [history, setHistory] = useState<OfferHistoryEntry[]>([]);

  const refresh = useCallback(() => {
    setCurrent(copilot.getStatus());
    copilot.getRecentOffers(RECENT_OFFERS).then(setHistory, reportError);
  }, []);

  useFocusEffect(refresh);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const setEnabled = async (value: boolean) => {
    await syncCopilotTargets();
    copilot.setEnabled(value);
    refresh();
  };

  return {
    current,
    history,
    refresh,
    setEnabled,
    openAccessibility: copilot.openAccessibilitySettings,
    openAppSettings: copilot.openAppSettings,
    openVoiceSettings: copilot.openVoiceSettings,
    openShortcutSettings: copilot.openShortcutSettings,
    openBatterySettings: copilot.openBatterySettings,
  };
}

export type CopilotStatusState = ReturnType<typeof useCopilotStatus>;
