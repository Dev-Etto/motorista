import * as Notifications from 'expo-notifications';
import { reminderRepository, ReminderRow } from '@/data/repositories/reminderRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { fromISODate, today } from '@/shared/utils/dates';

const REMINDER_HOUR = 8;

async function scheduleDateReminder(title: string, isoDate: string): Promise<string | null> {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return null;

  const date = fromISODate(isoDate);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  if (date.getTime() <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: { title: 'Lembrete de manutenção', body: title },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

async function cancelNotification(reminder: ReminderRow) {
  if (!reminder.notification_id) return;
  await Notifications.cancelScheduledNotificationAsync(reminder.notification_id);
}

async function loadReminders() {
  const [reminders, totalKm, { profile }] = await Promise.all([reminderRepository.list(), shiftRepository.totalKmEver(), vehicleRepository.getCostsAt(today())]);
  return { reminders, totalKm, profile };
}

export function useReminders() {
  const { data, reload } = useAsyncData(loadReminders);

  const add = async (title: string, dueDate: string | null, kmFromNow: number | null) => {
    const notificationId = dueDate ? await scheduleDateReminder(title, dueDate) : null;
    const dueKm = kmFromNow === null ? null : (data?.totalKm ?? 0) + kmFromNow;
    await reminderRepository.add({ title, due_date: dueDate, due_km: dueKm, notification_id: notificationId });
    await reload();
  };

  const complete = async (reminder: ReminderRow) => {
    await cancelNotification(reminder);
    await reminderRepository.setDone(reminder.id, true);
    await reload();
  };

  const remove = async (reminder: ReminderRow) => {
    await cancelNotification(reminder);
    await reminderRepository.remove(reminder.id);
    await reload();
  };

  return { reminders: data?.reminders ?? [], totalKm: data?.totalKm ?? 0, profile: data?.profile ?? null, add, complete, remove };
}
