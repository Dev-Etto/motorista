import type { TFunction } from 'i18next';
import { kmRemaining } from '@domain/reminder/reminder';
import type { Formatter } from '@shared/i18n/format';
import type { Reminder } from './useReminders';

type ReminderDue = Pick<Reminder, 'dueDate' | 'dueKm'>;

function describeDistance(dueKm: number, totalKm: number, t: TFunction<'settings'>, format: Formatter) {
  const remaining = kmRemaining(dueKm, totalKm);
  if (remaining > 0) return t('reminders.due.remaining', { distance: format.distance(remaining) });
  return t('reminders.due.reached');
}

export function describeReminderDue(reminder: ReminderDue, totalKm: number, t: TFunction<'settings'>, format: Formatter): string {
  const date = reminder.dueDate ? format.date(reminder.dueDate) : null;
  const distance = reminder.dueKm ? describeDistance(reminder.dueKm, totalKm, t, format) : null;
  if (date && distance) return t('reminders.due.dateOrDistance', { date, distance });
  return date ?? distance ?? '';
}
