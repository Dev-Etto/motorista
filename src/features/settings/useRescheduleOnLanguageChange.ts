import { useEffect } from 'react';
import { regionalStore } from '@application/regional';
import { hasNotificationPermission } from '@shared/platform/notifications';
import { reportError } from '@shared/utils/reportError';
import { rescheduleAllNotifications } from './reminderNotifications';

export function createLanguageWatcher(onChange: () => Promise<void>) {
  let language: string | null = null;

  return (next: string) => {
    const previous = language;
    language = next;
    if (previous === null || previous === next) return;
    void onChange().catch(reportError);
  };
}

async function rescheduleIfAllowed() {
  if (!(await hasNotificationPermission())) return;
  await rescheduleAllNotifications();
}

export function useRescheduleOnLanguageChange(): void {
  useEffect(() => {
    const watch = createLanguageWatcher(rescheduleIfAllowed);
    watch(regionalStore.current().language);
    return regionalStore.subscribe(() => watch(regionalStore.current().language));
  }, []);
}
