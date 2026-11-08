import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'motorista.db';

let instance: SQLite.SQLiteDatabase | null = null;

export type SqlExecutor = Pick<SQLite.SQLiteDatabase, 'execAsync' | 'runAsync' | 'getFirstAsync' | 'getAllAsync'>;

type TransactionOptions = { enforceForeignKeys?: boolean };

export function getDb(): SQLite.SQLiteDatabase {
  if (!instance) instance = SQLite.openDatabaseSync(DATABASE_NAME);
  return instance;
}

export async function runInTransaction(work: (tx: SqlExecutor) => Promise<void>, options: TransactionOptions = {}): Promise<void> {
  const connection = await SQLite.openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });
  try {
    const enforce = options.enforceForeignKeys ?? true;
    await connection.execAsync(`PRAGMA foreign_keys = ${enforce ? 'ON' : 'OFF'}`);
    await connection.withTransactionAsync(() => work(connection));
  } finally {
    await connection.closeAsync();
  }
}

export async function assertForeignKeys(tx: SqlExecutor): Promise<void> {
  const broken = await tx.getAllAsync('PRAGMA foreign_key_check');
  if (broken.length > 0) throw new Error('foreign_key_check');
}
export const LEGACY_REGIONAL_SQL = `
  INSERT INTO settings (key, value)
  SELECT legacy.key, legacy.value FROM (
    SELECT 'language' AS key, 'pt-BR' AS value
    UNION ALL SELECT 'format_locale', 'pt-BR'
    UNION ALL SELECT 'market', 'BR'
    UNION ALL SELECT 'distance_unit', 'km'
    UNION ALL SELECT 'volume_unit', 'L'
    UNION ALL SELECT 'consumption_unit', 'km/L'
    UNION ALL SELECT 'first_weekday', '1'
  ) AS legacy
  WHERE EXISTS (SELECT 1 FROM settings WHERE key = 'onboarded')
  ON CONFLICT(key) DO NOTHING;
  `;

export const SYSTEM_PLATFORMS_SQL = `
  UPDATE platforms SET system_key = 'private' WHERE name = 'Particular' AND system_key IS NULL;
  UPDATE platforms SET system_key = 'other' WHERE name = 'Outros' AND system_key IS NULL;
`;

export const CATALOG_PLATFORMS_SQL = `
  UPDATE platforms SET system_key = 'uber' WHERE name = 'Uber' AND system_key IS NULL;
  UPDATE platforms SET system_key = 'ninetyNine' WHERE name = '99' AND system_key IS NULL;
  UPDATE platforms SET system_key = 'inDrive' WHERE name = 'inDrive' AND system_key IS NULL;
  INSERT OR IGNORE INTO platforms (name, sort, active, system_key)
  SELECT catalog.name, catalog.sort, 0, catalog.system_key FROM (
    SELECT 'Uber' AS name, 1 AS sort, 'uber' AS system_key
    UNION ALL SELECT '99', 2, 'ninetyNine'
    UNION ALL SELECT 'inDrive', 3, 'inDrive'
    UNION ALL SELECT 'Particular', 4, 'private'
    UNION ALL SELECT 'Outros', 5, 'other'
  ) AS catalog
  WHERE NOT EXISTS (SELECT 1 FROM platforms WHERE platforms.system_key = catalog.system_key);
  CREATE UNIQUE INDEX IF NOT EXISTS platforms_system_key ON platforms (system_key);
`;

export const MIGRATIONS: string[] = [
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
  `
  CREATE TABLE goal_day_overrides (
    date TEXT PRIMARY KEY,
    target_cents INTEGER NOT NULL
  );
  `,
  `
  ALTER TABLE goals ADD COLUMN hours_per_day REAL NOT NULL DEFAULT 8;
  `,
  `
  ALTER TABLE gps_session ADD COLUMN cycle INTEGER NOT NULL DEFAULT 0;
  `,
  LEGACY_REGIONAL_SQL,
  `
  ALTER TABLE platforms ADD COLUMN system_key TEXT;
  ${SYSTEM_PLATFORMS_SQL}
  `,
  CATALOG_PLATFORMS_SQL,
  `
  ALTER TABLE reminders ADD COLUMN vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL;
  `,
  `
  ALTER TABLE expenses ADD COLUMN vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL;
  `,
  `
  ALTER TABLE reminders ADD COLUMN repeat_km REAL;
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export const REGIONAL_SCHEMA_VERSION = MIGRATIONS.indexOf(LEGACY_REGIONAL_SQL) + 1;

export const SYSTEM_PLATFORMS_SCHEMA_VERSION = MIGRATIONS.findIndex((migration) => migration.includes(SYSTEM_PLATFORMS_SQL)) + 1;

export const CATALOG_PLATFORMS_SCHEMA_VERSION = MIGRATIONS.indexOf(CATALOG_PLATFORMS_SQL) + 1;

export async function migrate(): Promise<void> {
  const db = getDb();
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (const [index, migration] of MIGRATIONS.slice(current).entries()) {
    await runInTransaction(
      async (tx) => {
        await tx.execAsync(migration);
        await tx.execAsync(`PRAGMA user_version = ${current + index + 1}`);
        await assertForeignKeys(tx);
      },
      { enforceForeignKeys: false },
    );
  }
}
