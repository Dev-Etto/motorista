import * as SQLite from 'expo-sqlite';

let instance: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!instance) instance = SQLite.openDatabaseSync('motorista.db');
  return instance;
}
const MIGRATIONS: string[] = [
  `
  CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    fuel TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE cost_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    valid_from TEXT NOT NULL,
    data TEXT NOT NULL,
    UNIQUE (vehicle_id, valid_from)
  );
  CREATE TABLE platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    start_hour INTEGER,
    minutes INTEGER NOT NULL DEFAULT 0,
    km REAL,
    km_source TEXT NOT NULL DEFAULT 'manual',
    odometer_end REAL,
    trips INTEGER,
    cost_per_km REAL NOT NULL DEFAULT 0,
    variable_per_km REAL NOT NULL DEFAULT 0,
    note TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_shifts_date ON shifts(date);
  CREATE TABLE shift_earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    platform_id INTEGER NOT NULL REFERENCES platforms(id),
    cents INTEGER NOT NULL
  );
  CREATE INDEX idx_earnings_shift ON shift_earnings(shift_id);
  CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    cents INTEGER NOT NULL,
    liters REAL,
    odometer REAL,
    note TEXT
  );
  CREATE INDEX idx_expenses_date ON expenses(date);
  CREATE TABLE goals (
    month TEXT PRIMARY KEY,
    desired_profit_cents INTEGER NOT NULL,
    work_weekdays TEXT NOT NULL
  );
  CREATE TABLE quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    label TEXT,
    price_cents INTEGER NOT NULL,
    data TEXT NOT NULL
  );
  CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    due_km REAL,
    notification_id TEXT,
    done INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE gps_session (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    meters REAL NOT NULL DEFAULT 0,
    last_point TEXT,
    running INTEGER NOT NULL DEFAULT 0
  );
  INSERT INTO platforms (name, sort) VALUES ('Uber', 1), ('99', 2), ('inDrive', 3), ('Particular', 4), ('Outros', 5);
  INSERT INTO gps_session (id) VALUES (1);
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export async function migrate(): Promise<void> {
  const db = getDb();
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(MIGRATIONS[version]);
      await tx.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
