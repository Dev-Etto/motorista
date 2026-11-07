import { Reminder, reminderRepository } from '@data/repositories/reminderRepository';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { kmFor } from '@domain/reminder/reminder';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { today } from '@shared/utils/dates';
import { cancelReminderNotification, scheduleDateReminder } from './reminderNotifications';

export type { Reminder };

async function loadReminders() {
  const [reminders, totals, { vehicle, profile }] = await Promise.all([
    reminderRepository.list(),
    shiftRepository.kmTotals(),
    vehicleRepository.getCostsAt(today()),
  ]);
  return { reminders, totals, vehicleId: vehicle?.id ?? null, profile };
}

export function useReminders() {
  const state = useAsyncData(loadReminders);
  const { data, reload } = state;

  const add = async (title: string, dueDate: string | null, kmFromNow: number | null) => {
    const notificationId = dueDate ? await scheduleDateReminder(title, dueDate) : null;
    const vehicleId = kmFromNow === null ? null : (data?.vehicleId ?? null);
    const dueKm = kmFromNow === null || !data ? kmFromNow : kmFor(vehicleId, data.totals) + kmFromNow;
    await reminderRepository.add({ title, dueDate, dueKm, notificationId, vehicleId });
    await reload();
    return { notifies: !dueDate || notificationId !== null };
  };

  const complete = async (reminder: Reminder) => {
    await cancelReminderNotification(reminder.notificationId);
    await reminderRepository.setDone(reminder.id, true);
    await reload();
  };

  const remove = async (reminder: Reminder) => {
    await cancelReminderNotification(reminder.notificationId);
    await reminderRepository.remove(reminder.id);
    await reload();
  };

  const kmOf = (reminder: Reminder) => (data ? kmFor(reminder.vehicleId, data.totals) : 0);

  return { state, reminders: data?.reminders ?? [], kmOf, profile: data?.profile ?? null, add, complete, remove };
}
