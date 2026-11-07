import { DatabaseSync } from 'node:sqlite';
import { BackupFile, backupMarket, createBackup, parseBackup, restoreBackup } from '@data/backup/backup';
import { CATALOG_PLATFORMS_SCHEMA_VERSION, migrate, MIGRATIONS, SCHEMA_VERSION } from '@data/database/connection';
import { seedSampleData } from '@data/database/devSeed';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { openTestDatabase } from './sqliteHarness';

let mockDb: DatabaseSync;

jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { document: 'doc' } }));

jest.mock('expo-sqlite', () => jest.requireActual('./sqliteHarness').expoSqliteMock);

function openAtVersion(version: number) {
  mockDb = openTestDatabase(MIGRATIONS.slice(0, version), { foreignKeys: false });
}

function seed() {
  mockDb.exec(`
    INSERT INTO vehicles (id, name, kind, fuel, created_at) VALUES (1, 'Carro', 'car', 'gas', 1);
    INSERT INTO shifts (id, vehicle_id, date, minutes, km, cost_per_km, created_at) VALUES (1, 1, '2026-11-05', 480, 120.5, 90, 1);
    INSERT INTO shift_earnings (shift_id, platform_id, cents) VALUES (1, 1, 25000);
    INSERT INTO goals (month, desired_profit_cents, work_weekdays) VALUES ('2026-11', 300000, '[1,2,3]');
    INSERT INTO settings (key, value) VALUES ('onboarded', '1');
  `);
}

const count = (table: string) => (mockDb.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number }).total;
const BEFORE_REGIONAL = MIGRATIONS.findIndex((migration) => migration.includes("'format_locale'"));
const setting = (key: string) => (mockDb.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;
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

  it('instalação existente mantém português, real e quilômetro', async () => {
    openAtVersion(BEFORE_REGIONAL);
    seed();
    await migrate();
    expect(setting('language')).toBe('pt-BR');
    expect(setting('market')).toBe('BR');
    expect(setting('distance_unit')).toBe('km');
    expect(setting('first_weekday')).toBe('1');
  });

  it('marca as plataformas do catálogo', async () => {
    openAtVersion(0);
    await migrate();
    const rows = mockDb.prepare('SELECT name, system_key AS systemKey FROM platforms WHERE system_key IS NOT NULL ORDER BY sort').all();
    expect(rows).toEqual([
      { name: 'Uber', systemKey: 'uber' },
      { name: '99', systemKey: 'ninetyNine' },
      { name: 'inDrive', systemKey: 'inDrive' },
      { name: 'Particular', systemKey: 'private' },
      { name: 'Outros', systemKey: 'other' },
    ]);
  });

  it('recria desligada uma plataforma do catálogo que não existe mais', async () => {
    openAtVersion(CATALOG_PLATFORMS_SCHEMA_VERSION - 1);
    mockDb.exec("DELETE FROM platforms WHERE name = 'inDrive'");
    await migrate();
    expect(mockDb.prepare("SELECT active FROM platforms WHERE system_key = 'inDrive'").get()).toEqual({ active: 0 });
  });

  it('atualização com um veículo continua com ele, as jornadas e os lembretes', async () => {
    openAtVersion(SCHEMA_VERSION - 1);
    seed();
    mockDb.exec("INSERT INTO reminders (title, due_km) VALUES ('Óleo', 10000)");
    await migrate();

    expect(await vehicleRepository.getCurrent()).toMatchObject({ id: 1, name: 'Carro' });
    expect(mockDb.prepare('SELECT vehicle_id AS vehicleId FROM shifts').get()).toEqual({ vehicleId: 1 });
    expect(mockDb.prepare('SELECT due_km AS dueKm, vehicle_id AS vehicleId FROM reminders').get()).toEqual({ dueKm: 10000, vehicleId: null });
  });

  it('instalação nova segue o aparelho', async () => {
    openAtVersion(0);
    await migrate();
    expect(setting('language')).toBeUndefined();
  });

  it('não sobrescreve uma escolha já salva', async () => {
    openAtVersion(BEFORE_REGIONAL);
    seed();
    mockDb.exec("INSERT INTO settings (key, value) VALUES ('distance_unit', 'mi')");
    await migrate();
    expect(setting('distance_unit')).toBe('mi');
  });

  it('rodar de novo não muda nada', async () => {
    openAtVersion(SCHEMA_VERSION);
    seed();
    await migrate();
    expect(count('shifts')).toBe(1);
  });
});

describe('dados de exemplo', () => {
  it('cria o veículo e as jornadas no esquema atual e pode rodar de novo', async () => {
    openAtVersion(SCHEMA_VERSION);
    await seedSampleData();
    await seedSampleData();

    expect(count('vehicles')).toBe(1);
    expect(count('shifts')).toBe(6);
    expect(count('shift_earnings')).toBe(6);
    expect(mockDb.prepare("SELECT value FROM settings WHERE key = 'onboarded'").get()).toEqual({ value: '1' });
  });

  it('usa a data local, mesmo à noite', async () => {
    openAtVersion(SCHEMA_VERSION);
    await seedSampleData(new Date(2026, 10, 5, 23, 30).getTime());

    expect(mockDb.prepare('SELECT MAX(date) AS last FROM shifts').get()).toEqual({ last: '2026-11-05' });
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

  it('recusa ganho de uma plataforma que não existe e mantém os dados atuais', async () => {
    const backup = await createBackup();
    const orphan = { ...backup.tables.shift_earnings[0], platform_id: 999 };
    const broken: BackupFile = { ...backup, tables: { ...backup.tables, shift_earnings: [orphan] } };

    await expect(restoreBackup(broken)).rejects.toThrow();

    expect(count('shift_earnings')).toBe(1);
    expect(mockDb.prepare('SELECT platform_id FROM shift_earnings').get()).toEqual({ platform_id: 1 });
  });

  it('marca o app como configurado na mesma restauração', async () => {
    const backup = await createBackup();
    const withoutSettings: BackupFile = { ...backup, tables: { ...backup.tables, settings: [] } };

    await restoreBackup(withoutSettings);

    expect(mockDb.prepare("SELECT value FROM settings WHERE key = 'onboarded'").get()).toEqual({ value: '1' });
  });

  it('usa a data local, mesmo à noite', async () => {
    openAtVersion(SCHEMA_VERSION);
    await seedSampleData(new Date(2026, 10, 5, 23, 30).getTime());

    expect(mockDb.prepare('SELECT MAX(date) AS last FROM shifts').get()).toEqual({ last: '2026-11-05' });
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

  it('backup de antes dos veículos volta com os lembretes sem veículo', async () => {
    mockDb.exec("INSERT INTO reminders (title, due_km) VALUES ('Óleo', 10000)");
    const backup = await createBackup();
    const reminders = backup.tables.reminders.map(({ vehicle_id: _removed, ...reminder }) => reminder);
    const file = parseBackup(JSON.stringify({ ...backup, schemaVersion: SCHEMA_VERSION - 1, tables: { ...backup.tables, reminders } }));

    if (!file.ok) throw new Error(file.error);
    await restoreBackup(file.backup);

    expect(mockDb.prepare('SELECT title, vehicle_id AS vehicleId FROM reminders').get()).toEqual({ title: 'Óleo', vehicleId: null });
  });

  it('backup de antes do perfil regional volta em português, real e quilômetro', async () => {
    const backup = await createBackup();
    const oldSettings = backup.tables.settings.filter((row) => row.key === 'onboarded');
    const platforms = backup.tables.platforms.map(({ system_key: _key, ...platform }) => platform);
    const old: BackupFile = { ...backup, schemaVersion: BEFORE_REGIONAL, tables: { ...backup.tables, settings: oldSettings, platforms } };

    await restoreBackup(old);

    expect(setting('language')).toBe('pt-BR');
    expect(setting('market')).toBe('BR');
    expect(setting('distance_unit')).toBe('km');
    expect(mockDb.prepare("SELECT system_key AS systemKey FROM platforms WHERE name = 'Particular'").get()).toEqual({ systemKey: 'private' });
    expect(backupMarket(old)).toBe('BR');
  });

  it('backup novo diz o país em que foi feito', async () => {
    mockDb.exec("INSERT INTO settings (key, value) VALUES ('market', 'BR') ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    const backup = await createBackup();
    expect(backupMarket(backup)).toBe('BR');
    const unknown: BackupFile = {
      ...backup,
      tables: { ...backup.tables, settings: [...backup.tables.settings.filter((row) => row.key !== 'market'), { key: 'market', value: 'XX' }] },
    };
    expect(backupMarket(unknown)).toBeNull();
  });

  it('backup novo sem país escolhido segue o aparelho', async () => {
    const backup = await createBackup();
    const withoutMarket: BackupFile = { ...backup, tables: { ...backup.tables, settings: backup.tables.settings.filter((row) => row.key !== 'market') } };
    expect(backupMarket(withoutMarket)).toBeNull();
  });
});
