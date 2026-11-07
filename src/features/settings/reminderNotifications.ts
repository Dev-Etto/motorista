import { reminderRepository } from '@data/repositories/reminderRepository';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { i18n } from '@shared/i18n';
import { cancelAllScheduled, cancelScheduled, ensureNotifications, scheduleAt, scheduleDaily } from '@shared/platform/notifications';
import { toJsDate } from '@shared/utils/dates';

const REMINDER_HOUR = 8;

export async function scheduleDateReminder(title: string, isoDate: string): Promise<string | null> {
  if (!(await ensureNotifications())) return null;

  const date = toJsDate(isoDate, REMINDER_HOUR);
  if (date.getTime() <= Date.now()) return null;

  return scheduleAt({ title: i18n.t('settings:notifications.maintenanceTitle'), body: title }, date);
}

export async function cancelReminderNotification(notificationId: string | null) {
  if (!notificationId) return;
  await cancelScheduled(notificationId);
}

export async function scheduleDailyReminder(hour: number): Promise<boolean> {
  await cancelDailyReminder();
  if (!(await ensureNotifications())) return false;

  const id = await scheduleDaily({ title: i18n.t('settings:notifications.dailyTitle'), body: i18n.t('settings:notifications.dailyBody') }, hour);
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
  await cancelAllScheduled();
  const reminders = await reminderRepository.list();
  for (const reminder of reminders) {
    const id = !reminder.done && reminder.dueDate ? await scheduleDateReminder(reminder.title, reminder.dueDate) : null;
    await reminderRepository.setNotificationId(reminder.id, id);
  }
  const hour = await settingsRepository.get(SETTING_KEYS.dailyReminderHour);
  if (hour) await scheduleDailyReminder(Number(hour));
}
