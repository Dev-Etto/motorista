import { getDb } from '@/data/database/connection';

export interface ReminderRow {
  id: number;
  title: string;
  due_date: string | null;
  due_km: number | null;
  notification_id: string | null;
  done: number;
}

export const reminderRepository = {
  list(): Promise<ReminderRow[]> {
    return getDb().getAllAsync<ReminderRow>("SELECT * FROM reminders ORDER BY done, COALESCE(due_date, '9999'), id");
  },

  async add(input: Pick<ReminderRow, 'title' | 'due_date' | 'due_km' | 'notification_id'>): Promise<void> {
    await getDb().runAsync(
      'INSERT INTO reminders (title, due_date, due_km, notification_id) VALUES (?, ?, ?, ?)',
      input.title,
      input.due_date,
      input.due_km,
      input.notification_id,
    );
  },

  async setDone(id: number, done: boolean): Promise<void> {
    await getDb().runAsync('UPDATE reminders SET done = ? WHERE id = ?', done ? 1 : 0, id);
  },

  async remove(id: number): Promise<void> {
    await getDb().runAsync('DELETE FROM reminders WHERE id = ?', id);
  },
};
