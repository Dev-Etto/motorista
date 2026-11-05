import { DatabaseSync } from 'node:sqlite';

let current: DatabaseSync;

const adapter = () => ({
  execAsync: async (sql: string) => current.exec(sql),
  getFirstAsync: async (sql: string, ...params: never[]) => current.prepare(sql).get(...params.flat()) ?? null,
  getAllAsync: async (sql: string, ...params: never[]) => current.prepare(sql).all(...params.flat()),
  runAsync: async (sql: string, ...params: never[]) => {
    const result = current.prepare(sql).run(...params.flat());
    return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
  },
  withExclusiveTransactionAsync: async (work: (tx: unknown) => Promise<void>) => {
    current.exec('BEGIN EXCLUSIVE');
    try {
      await work(adapter());
      current.exec('COMMIT');
    } catch (error) {
      current.exec('ROLLBACK');
      throw error;
    }
  },
});

export const expoSqliteMock = { openDatabaseSync: adapter };

export function openTestDatabase(migrations: string[]): DatabaseSync {
  current = new DatabaseSync(':memory:');
  current.exec('PRAGMA foreign_keys = ON');
  migrations.forEach((sql) => current.exec(sql));
  current.exec(`PRAGMA user_version = ${migrations.length}`);
  return current;
}
