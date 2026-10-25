import * as Notifications from 'expo-notifications';
import { reminderRepository, ReminderRow } from '@/data/repositories/reminderRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { fromISODate } from '@/shared/utils/dates';

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

export function useReminders() {
  const { data, reload } = useAsyncData(() => reminderRepository.list());

  const add = async (title: string, dueDate: string | null, dueKm: number | null) => {
    const notificationId = dueDate ? await scheduleDateReminder(title, dueDate) : null;
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

  return { reminders: data ?? [], add, complete, remove };
}
