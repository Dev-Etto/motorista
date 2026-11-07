import { useState } from 'react';
import { ensureNotifications } from '@/shared/platform/notifications';
import { copilot, CopilotPreferences } from '@modules/copilot';
import { COPILOT_COPY } from './copy';

const FLOATING_REFRESH_DELAY_MS = 300;

export function useCopilotPreferences(refresh: () => void, notify: (message: string) => void) {
  const [current, setCurrent] = useState<CopilotPreferences>(() => copilot.getPreferences());

  const update = (changes: Partial<CopilotPreferences>) => {
    const next = { ...current, ...changes };
    copilot.setPreferences(next);
    setCurrent(next);
  };

  const setNotification = async (value: boolean) => {
    if (!value) return update({ notification: false });
    if (!(await ensureNotifications())) return notify(COPILOT_COPY.notificationsForChannel);

    update({ notification: true });
  };

  const setFloating = (value: boolean) => {
    update({ floatingButton: value });
    if (!value) {
      copilot.stopFloating();
      return setTimeout(refresh, FLOATING_REFRESH_DELAY_MS);
    }
    if (!copilot.startFloating()) {
      notify(COPILOT_COPY.overlayForFloating);
      return copilot.openOverlaySettings();
    }
    setTimeout(refresh, FLOATING_REFRESH_DELAY_MS);
  };

  const toggleMonitored = (packageName: string) => {
    const monitored = current.monitoredPackages;
    update({ monitoredPackages: monitored.includes(packageName) ? monitored.filter((item) => item !== packageName) : [...monitored, packageName] });
  };

  return { current, update, setNotification, setFloating, toggleMonitored, resetCardPosition: copilot.resetCardPosition };
}

export type CopilotPreferencesState = ReturnType<typeof useCopilotPreferences>;
