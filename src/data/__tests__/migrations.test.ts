import { DatabaseSync } from 'node:sqlite';
import { BackupFile, createBackup, parseBackup, restoreBackup } from '@/data/backup/backup';
import { migrate, MIGRATIONS, SCHEMA_VERSION } from '@/data/database/connection';

let mockDb: DatabaseSync;

jest.mock('expo-sqlite', () => {
  const adapter = () => ({
    execAsync: async (sql: string) => mockDb.exec(sql),
    getFirstAsync: async (sql: string, ...params: never[]) => mockDb.prepare(sql).get(...params.flat()) ?? null,
    getAllAsync: async (sql: string, ...params: never[]) => mockDb.prepare(sql).all(...params.flat()),
    runAsync: async (sql: string, ...params: never[]) => mockDb.prepare(sql).run(...params.flat()),
    withExclusiveTransactionAsync: async (work: (tx: unknown) => Promise<void>) => {
      mockDb.exec('BEGIN EXCLUSIVE');
      try {
        await work(adapter());
        mockDb.exec('COMMIT');
      } catch (error) {
        mockDb.exec('ROLLBACK');
        throw error;
      }
    },
  });
  return { openDatabaseSync: adapter };
});

function openAtVersion(version: number) {
  mockDb = new DatabaseSync(':memory:');
  MIGRATIONS.slice(0, version).forEach((sql) => mockDb.exec(sql));
  mockDb.exec(`PRAGMA user_version = ${version}`);
}

function seed() {
  mockDb.exec(`
    INSERT INTO vehicles (id, name, kind, fuel, created_at) VALUES (1, 'Carro', 'car', 'gas', 1);
    INSERT INTO shifts (id, vehicle_id, date, minutes, km, cost_per_km, created_at) VALUES (1, 1, '2026-11-05', 480, 120.5, 90, 1);
    INSERT INTO shift_earnings (shift_id, platform_id, cents) VALUES (1, 1, 25000);
    INSERT INTO goals (month, desired_profit_cents, work_weekdays) VALUES ('2026-11', 300000, '1,2,3');
    INSERT INTO settings (key, value) VALUES ('onboarded', '1');
  `);
}

const count = (table: string) => (mockDb.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number }).total;
const userVersion = () => (mockDb.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;

describe('migrações', () => {
  it('leva um banco novo até a versão atual', async () => {
    openAtVersion(0);
    await migrate();
    expect(userVersion()).toBe(SCHEMA_VERSION);
    expect(count('platforms')).toBeGreaterThan(0);
    expect(count('gps_session')).toBe(1);
  });

  it.each(Array.from({ length: SCHEMA_VERSION }, (_, index) => index + 1))('atualiza a partir da versão %i sem perder dados', async (version) => {
    openAtVersion(version);
    seed();
    await migrate();

    expect(userVersion()).toBe(SCHEMA_VERSION);
    expect(count('vehicles')).toBe(1);
    expect(count('shifts')).toBe(1);
    expect(count('shift_earnings')).toBe(1);
    expect(mockDb.prepare('SELECT km FROM shifts').get()).toEqual({ km: 120.5 });
    expect(count('goals')).toBe(1);
  });

  it('rodar de novo não muda nada', async () => {
    openAtVersion(SCHEMA_VERSION);
    seed();
    await migrate();
    expect(count('shifts')).toBe(1);
  });
});

describe('backup de ponta a ponta', () => {
  beforeEach(() => {
    openAtVersion(SCHEMA_VERSION);
    seed();
  });

  it('restaura exatamente o que foi salvo', async () => {
    const backup = await createBackup();
    const file = parseBackup(JSON.stringify(backup));
    mockDb.exec("DELETE FROM shift_earnings; DELETE FROM shifts; INSERT INTO settings (key, value) VALUES ('novo', '1');");

    if (!file.ok) throw new Error(file.error);
    await restoreBackup(file.backup);

    expect(await createBackup()).toEqual({ ...backup, exportedAt: expect.any(String) });
    expect(count('shift_earnings')).toBe(1);
    expect(mockDb.prepare("SELECT value FROM settings WHERE key = 'novo'").get()).toBeUndefined();
  });

  it('mantém os dados atuais quando a restauração falha', async () => {
    const backup = await createBackup();
    const broken: BackupFile = { ...backup, tables: { ...backup.tables, shifts: [{ coluna_que_nao_existe: 1 }] } };

    await expect(restoreBackup(broken)).rejects.toThrow();

    expect(count('shifts')).toBe(1);
    expect(count('vehicles')).toBe(1);
  });

  it('aceita backup de uma versão antiga, sem as colunas e tabelas novas', async () => {
    const backup = await createBackup();
    const oldGoals = backup.tables.goals.map(({ hours_per_day: _removed, ...goal }) => goal);
    const { goal_day_overrides: _table, ...oldTables } = { ...backup.tables, goals: oldGoals };
    const file = parseBackup(JSON.stringify({ ...backup, schemaVersion: 1, tables: oldTables }));

    if (!file.ok) throw new Error(file.error);
    await restoreBackup(file.backup);

    expect(mockDb.prepare('SELECT hours_per_day FROM goals').get()).toEqual({ hours_per_day: 8 });
  });
});
