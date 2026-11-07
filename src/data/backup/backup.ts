import { z } from 'zod';
import { assertForeignKeys, getDb, runInTransaction, SCHEMA_VERSION, type SqlExecutor } from '@/data/database/connection';
import { isJsonOf } from '@/data/database/jsonColumn';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { workWeekdaysSchema } from '@/domain/goal/goal';
import { costProfileSchema } from '@/domain/vehicle/costs';
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

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string };

export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O arquivo está corrompido ou não é um backup do app.' };
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: 'Este arquivo não é um backup válido do app.' };
  if (parsed.data.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: 'Este backup veio de uma versão mais nova do app. Atualize o app e tente de novo.' };
  }
  return { ok: true, backup: parsed.data };
}

async function insertRows(tx: SqlExecutor, table: string, records: Record<string, string | number | null>[]) {
  for (const record of records) {
    const columns = Object.keys(record);
    if (columns.length === 0) continue;

    const placeholders = columns.map(() => '?').join(', ');
    await tx.runAsync(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      columns.map((column) => record[column] ?? null),
    );
  }
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
  });
}
