import { getDb, SqlExecutor } from '@data/database/connection';

export const PLATFORM_SYSTEM_KEYS = ['private', 'other'] as const;

export type PlatformSystemKey = (typeof PLATFORM_SYSTEM_KEYS)[number];

export interface Platform {
  id: number;
  name: string;
}

export function createPlatformRepository(connection: () => SqlExecutor = getDb) {
  return {
    list(): Promise<Platform[]> {
      return connection().getAllAsync<Platform>('SELECT id, name FROM platforms WHERE active = 1 ORDER BY sort, id');
    },

    async add(name: string): Promise<void> {
      const db = connection();
      const max = await db.getFirstAsync<{ value: number | null }>('SELECT MAX(sort) AS value FROM platforms');
      await db.runAsync(
        'INSERT INTO platforms (name, sort, active) VALUES (?, ?, 1) ON CONFLICT(name) DO UPDATE SET active = 1',
        name.trim(),
        (max?.value ?? 0) + 1,
      );
    },

    async localizeSystemNames(names: Record<PlatformSystemKey, string>): Promise<void> {
      const db = connection();
      for (const key of PLATFORM_SYSTEM_KEYS) {
        await db.runAsync('UPDATE OR IGNORE platforms SET name = ? WHERE system_key = ?', names[key], key);
      }
    },

    async deactivate(id: number): Promise<void> {
      await connection().runAsync('UPDATE platforms SET active = 0 WHERE id = ?', id);
    },
  };
}

export const platformRepository = createPlatformRepository();
