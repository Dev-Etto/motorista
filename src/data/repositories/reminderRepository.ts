import { getDb, SqlExecutor } from '@/data/database/connection';

export interface ReminderRow {
  id: number;
  title: string;
  due_date: string | null;
  due_km: number | null;
  notification_id: string | null;
  done: number;
}

export function createReminderRepository(connection: () => SqlExecutor = getDb) {
  return {
    list(): Promise<ReminderRow[]> {
      return connection().getAllAsync<ReminderRow>("SELECT * FROM reminders ORDER BY done, COALESCE(due_date, '9999'), id");
    },

    async add(input: Pick<ReminderRow, 'title' | 'due_date' | 'due_km' | 'notification_id'>): Promise<void> {
      await connection().runAsync(
        'INSERT INTO reminders (title, due_date, due_km, notification_id) VALUES (?, ?, ?, ?)',
        input.title,
        input.due_date,
        input.due_km,
        input.notification_id,
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
