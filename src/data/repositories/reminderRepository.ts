import { getDb, SqlExecutor } from '@data/database/connection';

export interface Reminder {
  id: number;
  title: string;
  dueDate: string | null;
  dueKm: number | null;
  notificationId: string | null;
  done: boolean;
}

interface ReminderRow {
  id: number;
  title: string;
  due_date: string | null;
  due_km: number | null;
  notification_id: string | null;
  done: number;
}

const toReminder = (row: ReminderRow): Reminder => ({
  id: row.id,
  title: row.title,
  dueDate: row.due_date,
  dueKm: row.due_km,
  notificationId: row.notification_id,
  done: row.done === 1,
});

export function createReminderRepository(connection: () => SqlExecutor = getDb) {
  return {
    async list(): Promise<Reminder[]> {
      const rows = await connection().getAllAsync<ReminderRow>("SELECT * FROM reminders ORDER BY done, COALESCE(due_date, '9999'), id");
      return rows.map(toReminder);
    },

    async add(input: Pick<Reminder, 'title' | 'dueDate' | 'dueKm' | 'notificationId'>): Promise<void> {
      await connection().runAsync(
        'INSERT INTO reminders (title, due_date, due_km, notification_id) VALUES (?, ?, ?, ?)',
        input.title,
        input.dueDate,
        input.dueKm,
        input.notificationId,
      );
    },

    async setDone(id: number, done: boolean): Promise<void> {
      await connection().runAsync('UPDATE reminders SET done = ? WHERE id = ?', done ? 1 : 0, id);
    },

    async setNotificationId(id: number, notificationId: string | null): Promise<void> {
      await connection().runAsync('UPDATE reminders SET notification_id = ? WHERE id = ?', notificationId, id);
    },

    async remove(id: number): Promise<void> {
      await connection().runAsync('DELETE FROM reminders WHERE id = ?', id);
    },
  };
}

export const reminderRepository = createReminderRepository();
