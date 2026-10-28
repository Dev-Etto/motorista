import { z } from 'zod';
import { getDb, SCHEMA_VERSION } from '@/data/database/connection';

const TABLES = [
  'vehicles',
  'cost_profiles',
  'platforms',
  'shifts',
  'shift_earnings',
  'expenses',
  'goals',
  'goal_day_overrides',
  'quotes',
  'reminders',
  'settings',
] as const;

const scalar = z.union([z.string(), z.number(), z.null()]);
const row = z.record(z.string().regex(/^[a-z_]+$/), scalar);

const tablesSchema = z.object({
  vehicles: z.array(row),
  cost_profiles: z.array(row),
  platforms: z.array(row),
  shifts: z.array(row),
  shift_earnings: z.array(row),
  expenses: z.array(row),
  goals: z.array(row),
  goal_day_overrides: z.array(row).default([]),
  quotes: z.array(row),
  reminders: z.array(row),
  settings: z.array(row),
});

export const backupSchema = z.object({
  app: z.literal('motorista'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  tables: tablesSchema,
});

export type BackupFile = z.infer<typeof backupSchema>;

export async function createBackup(): Promise<BackupFile> {
  const db = getDb();
  const tables = {} as BackupFile['tables'];
  for (const table of TABLES) {
    tables[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
  }
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

export async function restoreBackup(backup: BackupFile): Promise<void> {
  const db = getDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const table of [...TABLES].reverse()) {
      await tx.runAsync(`DELETE FROM ${table}`);
    }
    for (const table of TABLES) {
      for (const record of backup.tables[table]) {
        const columns = Object.keys(record);
        if (columns.length === 0) continue;
        const placeholders = columns.map(() => '?').join(', ');
        await tx.runAsync(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          columns.map((c) => record[c]),
        );
      }
    }
  });
}
