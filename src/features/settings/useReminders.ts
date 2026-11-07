import { reminderRepository, ReminderRow } from '@/data/repositories/reminderRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { today } from '@/shared/utils/dates';
import { cancelReminderNotification, scheduleDateReminder } from './reminderNotifications';

export type Reminder = ReminderRow;

async function loadReminders() {
  const [reminders, totalKm, { profile }] = await Promise.all([reminderRepository.list(), shiftRepository.totalKmEver(), vehicleRepository.getCostsAt(today())]);
  return { reminders, totalKm, profile };
}

export function useReminders() {
  const state = useAsyncData(loadReminders);
  const { data, reload } = state;

  const add = async (title: string, dueDate: string | null, kmFromNow: number | null) => {
    const notificationId = dueDate ? await scheduleDateReminder(title, dueDate) : null;
    const dueKm = kmFromNow === null ? null : (data?.totalKm ?? 0) + kmFromNow;
    await reminderRepository.add({ title, due_date: dueDate, due_km: dueKm, notification_id: notificationId });
    await reload();
    return { notifies: !dueDate || notificationId !== null };
  };

  const complete = async (reminder: ReminderRow) => {
    await cancelReminderNotification(reminder.notification_id);
    await reminderRepository.setDone(reminder.id, true);
    await reload();
  };

  const remove = async (reminder: ReminderRow) => {
    await cancelReminderNotification(reminder.notification_id);
    await reminderRepository.remove(reminder.id);
    await reload();
  };

  return { state, reminders: data?.reminders ?? [], totalKm: data?.totalKm ?? 0, profile: data?.profile ?? null, add, complete, remove };
}
