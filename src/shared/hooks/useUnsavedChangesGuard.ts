import { usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { i18n } from '@shared/i18n';
import { showDialog } from '@shared/ui/dialog';

export function useUnsavedChangesGuard(dirty: boolean): () => void {
  const pendingLeave = useRef<(() => void) | null>(null);
  const [leaving, setLeaving] = useState(false);

  const allowLeave = usePreventRemove(dirty && !leaving, ({ repeat }) => {
    pendingLeave.current = repeat;
    showDialog({
      title: i18n.t('unsavedChanges.title'),
      message: i18n.t('unsavedChanges.message'),
      actions: [
        { label: i18n.t('unsavedChanges.keep'), tone: 'secondary' },
        { label: i18n.t('unsavedChanges.discard'), tone: 'danger', onPress: () => setLeaving(true) },
      ],
    });
  });

  useEffect(() => {
    if (leaving) pendingLeave.current?.();
  }, [leaving]);

  return allowLeave;
}
