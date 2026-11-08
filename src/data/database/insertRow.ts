import { SqlExecutor } from './connection';

type RowValue = string | number | null | undefined;

export type RowValues = Record<string, RowValue>;

export async function insertRow(tx: SqlExecutor, table: string, record: object): Promise<void> {
  const entries = Object.entries(record) as [string, RowValue][];
  if (entries.length === 0) return;

  const columns = entries.map(([column]) => column).join(', ');
  const placeholders = entries.map(() => '?').join(', ');
  await tx.runAsync(
    `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
    entries.map(([, value]) => value ?? null),
  );
}
