import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const folder = mkdtempSync(join(tmpdir(), 'motorista-'));
let path = '';
let current: DatabaseSync;
let opened = 0;

const connect = () => new DatabaseSync(path, { enableForeignKeyConstraints: false });

const adapter = (resolve: () => DatabaseSync) => ({
  execAsync: async (sql: string) => resolve().exec(sql),
  getFirstAsync: async (sql: string, ...params: never[]) => resolve().prepare(sql).get(...params.flat()) ?? null,
  getAllAsync: async (sql: string, ...params: never[]) => resolve().prepare(sql).all(...params.flat()),
  runAsync: async (sql: string, ...params: never[]) => {
    const result = resolve().prepare(sql).run(...params.flat());
    return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
  },
  withTransactionAsync: async (work: () => Promise<void>) => {
    resolve().exec('BEGIN');
    try {
      await work();
      resolve().exec('COMMIT');
    } catch (error) {
      resolve().exec('ROLLBACK');
      throw error;
    }
  },
  closeAsync: async () => resolve().close(),
});

export const expoSqliteMock = {
  openDatabaseSync: () => adapter(() => current),
  openDatabaseAsync: async () => {
    const connection = connect();
    return adapter(() => connection);
  },
};

export function openTestDatabase(migrations: string[], options: { foreignKeys?: boolean } = {}): DatabaseSync {
  if (current?.isOpen) current.close();
  if (path) rmSync(path, { force: true });
  opened += 1;
  path = join(folder, `test-${opened}.db`);
  current = connect();
  if (options.foreignKeys ?? true) current.exec('PRAGMA foreign_keys = ON');
  migrations.forEach((sql) => current.exec(sql));
  current.exec(`PRAGMA user_version = ${migrations.length}`);
  return current;
}
