import * as Notifications from 'expo-notifications';
import { reminderRepository } from '@/data/repositories/reminderRepository';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { fromISODate } from '@/shared/utils/dates';

const REMINDER_HOUR = 8;

export async function scheduleDateReminder(title: string, isoDate: string): Promise<string | null> {
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

export async function cancelReminderNotification(notificationId: string | null) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function scheduleDailyReminder(hour: number): Promise<boolean> {
  await cancelDailyReminder();
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Registrou sua jornada de hoje?', body: 'Em menos de um minuto você vê quanto sobrou.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
  });
  await settingsRepository.set(SETTING_KEYS.dailyReminderId, id);
  await settingsRepository.set(SETTING_KEYS.dailyReminderHour, String(hour));
  return true;
}

export async function cancelDailyReminder() {
  await cancelReminderNotification(await settingsRepository.get(SETTING_KEYS.dailyReminderId));
  await settingsRepository.remove(SETTING_KEYS.dailyReminderId);
  await settingsRepository.remove(SETTING_KEYS.dailyReminderHour);
}

export async function rescheduleAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const reminders = await reminderRepository.list();
  for (const reminder of reminders) {
    const id = !reminder.done && reminder.due_date ? await scheduleDateReminder(reminder.title, reminder.due_date) : null;
    await reminderRepository.setNotificationId(reminder.id, id);
  }
  const hour = await settingsRepository.get(SETTING_KEYS.dailyReminderHour);
  if (hour) await scheduleDailyReminder(Number(hour));
}
