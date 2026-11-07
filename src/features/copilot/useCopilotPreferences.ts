import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copilot, CopilotPreferences } from '@modules/copilot';
import { ensureNotifications } from '@shared/platform/notifications';

const FLOATING_REFRESH_DELAY_MS = 300;

export function useCopilotPreferences(refresh: () => void, notify: (message: string) => void) {
  const { t } = useTranslation('copilot');
  const [current, setCurrent] = useState<CopilotPreferences>(() => copilot.getPreferences());

  const update = (changes: Partial<CopilotPreferences>) => {
    const next = { ...current, ...changes };
    copilot.setPreferences(next);
    setCurrent(next);
  };

  const setNotification = async (value: boolean) => {
    if (!value) return update({ notification: false });
    if (!(await ensureNotifications())) return notify(t('messages.notificationsForChannel'));

    update({ notification: true });
  };

  const setFloating = (value: boolean) => {
    update({ floatingButton: value });
    if (!value) {
      copilot.stopFloating();
      return setTimeout(refresh, FLOATING_REFRESH_DELAY_MS);
    }
    if (!copilot.startFloating()) {
      notify(t('messages.overlayForFloating'));
      return copilot.openOverlaySettings();
    }
    setTimeout(refresh, FLOATING_REFRESH_DELAY_MS);
  };

  return { current, update, setNotification, setFloating, resetCardPosition: copilot.resetCardPosition };
}

export type CopilotPreferencesState = ReturnType<typeof useCopilotPreferences>;
