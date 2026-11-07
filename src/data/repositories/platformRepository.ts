import { getDb, SqlExecutor } from '@data/database/connection';

export const PLATFORM_SYSTEM_KEYS = ['private', 'other'] as const;

export const PLATFORM_CATALOG = ['uber', 'ninetyNine', 'inDrive', 'private', 'other'] as const;

export type PlatformSystemKey = (typeof PLATFORM_SYSTEM_KEYS)[number];

export type PlatformKey = (typeof PLATFORM_CATALOG)[number];

export interface Platform {
  id: number;
  name: string;
}

export interface PlatformEntry extends Platform {
  key: PlatformKey | null;
  active: boolean;
}

interface PlatformRow extends Platform {
  system_key: PlatformKey | null;
  active: number;
}

export function createPlatformRepository(connection: () => SqlExecutor = getDb) {
  return {
    list(): Promise<Platform[]> {
      return connection().getAllAsync<Platform>('SELECT id, name FROM platforms WHERE active = 1 ORDER BY sort, id');
    },

    async listAll(): Promise<PlatformEntry[]> {
      const rows = await connection().getAllAsync<PlatformRow>(
        'SELECT id, name, system_key, active FROM platforms WHERE system_key IS NOT NULL OR active = 1 ORDER BY sort, id',
      );
      return rows.map((row) => ({ id: row.id, name: row.name, key: row.system_key, active: row.active === 1 }));
    },

    async localizeSystemNames(names: Record<PlatformSystemKey, string>): Promise<void> {
      const db = connection();
      for (const key of PLATFORM_SYSTEM_KEYS) {
        await db.runAsync('UPDATE OR IGNORE platforms SET name = ? WHERE system_key = ?', names[key], key);
      }
    },

    async setActive(id: number, active: boolean): Promise<void> {
      await connection().runAsync('UPDATE platforms SET active = ? WHERE id = ?', active ? 1 : 0, id);
    },
  };
}

export const platformRepository = createPlatformRepository();
