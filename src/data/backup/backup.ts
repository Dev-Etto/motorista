import { z } from 'zod';
import {
  assertForeignKeys,
  CATALOG_PLATFORMS_SCHEMA_VERSION,
  CATALOG_PLATFORMS_SQL,
  getDb,
  LEGACY_REGIONAL_SQL,
  REGIONAL_SCHEMA_VERSION,
  runInTransaction,
  SCHEMA_VERSION,
  type SqlExecutor,
  SYSTEM_PLATFORMS_SCHEMA_VERSION,
  SYSTEM_PLATFORMS_SQL,
} from '@data/database/connection';
import { insertRow, RowValues } from '@data/database/insertRow';
import { isJsonOf } from '@data/database/jsonColumn';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { workWeekdaysSchema } from '@domain/goal/goal';
import { LEGACY_REGIONAL, type Market, SUPPORTED_MARKETS } from '@domain/regional/regional';
import { costProfileSchema } from '@domain/vehicle/costs';
import { isHistoryText, isPreferencesText, sanitizeHistoryText } from '@modules/copilot/schemas';

const scalar = z.union([z.string(), z.number(), z.null()]);
const row = z.record(z.string().regex(/^[a-z_]+$/), scalar);
const cents = z.number().int();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoMonth = z.string().regex(/^\d{4}-\d{2}$/);

const rowWith = (columns: z.ZodRawShape) => {
  const shape = z.looseObject(columns);
  return row.refine((record) => shape.safeParse(record).success);
};

const tablesSchema = z.object({
  vehicles: z.array(row),
  cost_profiles: z.array(rowWith({ valid_from: isoDate, data: z.string().refine(isJsonOf(costProfileSchema)) })),
  platforms: z.array(row),
  shifts: z.array(rowWith({ date: isoDate })),
  shift_earnings: z.array(rowWith({ cents })),
  expenses: z.array(rowWith({ date: isoDate, cents })),
  goals: z.array(rowWith({ month: isoMonth, desired_profit_cents: cents, work_weekdays: z.string().refine(isJsonOf(workWeekdaysSchema)) })),
  goal_day_overrides: z.array(rowWith({ date: isoDate, target_cents: cents })).default([]),
  quotes: z.array(rowWith({ price_cents: cents })),
  reminders: z.array(rowWith({ due_date: isoDate.nullable().optional() })),
  settings: z.array(row),
});

const TABLES = tablesSchema.keyof().options;

const copilotSchema = z.object({
  preferences: z.string().refine(isPreferencesText),
  history: z.string().refine(isHistoryText).transform(sanitizeHistoryText),
});

export const backupSchema = z.object({
  app: z.literal('motorista'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  tables: tablesSchema,
  copilot: copilotSchema.optional(),
});

export type BackupFile = z.infer<typeof backupSchema>;

export async function createBackup(): Promise<BackupFile> {
  const db = getDb();
  const entries = await Promise.all(TABLES.map(async (table) => [table, await db.getAllAsync(`SELECT * FROM ${table}`)] as const));
  const tables = tablesSchema.parse(Object.fromEntries(entries));
  return { app: 'motorista', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables };
}

export type BackupProblem = 'corrupted' | 'notBackup' | 'newerVersion';

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: BackupProblem };

export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'corrupted' };
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: 'notBackup' };
  if (parsed.data.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: 'newerVersion' };
  }
  return { ok: true, backup: parsed.data };
}

async function insertRows(tx: SqlExecutor, table: string, records: RowValues[]) {
  for (const record of records) await insertRow(tx, table, record);
}

export async function restoreBackup(backup: BackupFile): Promise<void> {
  await runInTransaction(async (tx) => {
    for (const table of [...TABLES].reverse()) {
      await tx.runAsync(`DELETE FROM ${table}`);
    }
    for (const table of TABLES) {
      await insertRows(tx, table, backup.tables[table]);
    }
    await assertForeignKeys(tx);
    await settingsRepository.set(SETTING_KEYS.onboarded, '1', tx);
    if (backup.schemaVersion < REGIONAL_SCHEMA_VERSION) await tx.execAsync(LEGACY_REGIONAL_SQL);
    if (backup.schemaVersion < SYSTEM_PLATFORMS_SCHEMA_VERSION) await tx.execAsync(SYSTEM_PLATFORMS_SQL);
    if (backup.schemaVersion < CATALOG_PLATFORMS_SCHEMA_VERSION) await tx.execAsync(CATALOG_PLATFORMS_SQL);
  });
}

export function backupMarket(backup: BackupFile): Market | null {
  if (backup.schemaVersion < REGIONAL_SCHEMA_VERSION) return LEGACY_REGIONAL.market;
  const row = backup.tables.settings.find((setting) => setting.key === SETTING_KEYS.market);
  return SUPPORTED_MARKETS.find((market) => market === row?.value) ?? null;
}
