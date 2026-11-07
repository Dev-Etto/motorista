export type PendingItem = { kind: 'reminder'; id: number; title: string } | { kind: 'backup' } | { kind: 'update' };

interface PendingSource {
  dueKmReminders: { id: number; title: string }[];
  backupDue: boolean;
  updateDue: boolean;
}

export function pendingItems(source: PendingSource): PendingItem[] {
  const reminders = source.dueKmReminders.map((reminder): PendingItem => ({ kind: 'reminder', id: reminder.id, title: reminder.title }));
  const backup: PendingItem[] = source.backupDue ? [{ kind: 'backup' }] : [];
  const update: PendingItem[] = source.updateDue ? [{ kind: 'update' }] : [];
  return [...reminders, ...backup, ...update];
}
