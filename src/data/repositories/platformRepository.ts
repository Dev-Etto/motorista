import { getDb } from '@/data/database/connection';

export interface Platform {
  id: number;
  name: string;
}

export const platformRepository = {
  list(): Promise<Platform[]> {
    return getDb().getAllAsync<Platform>('SELECT id, name FROM platforms WHERE active = 1 ORDER BY sort, id');
  },

  async add(name: string): Promise<void> {
    const db = getDb();
    const max = await db.getFirstAsync<{ value: number | null }>('SELECT MAX(sort) AS value FROM platforms');
    await db.runAsync(
      'INSERT INTO platforms (name, sort, active) VALUES (?, ?, 1) ON CONFLICT(name) DO UPDATE SET active = 1',
      name.trim(),
      (max?.value ?? 0) + 1,
    );
  },

  async deactivate(id: number): Promise<void> {
    await getDb().runAsync('UPDATE platforms SET active = 0 WHERE id = ?', id);
  },
};
