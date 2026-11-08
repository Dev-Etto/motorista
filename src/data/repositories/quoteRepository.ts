import { z } from 'zod';
import { getDb, SqlExecutor } from '@data/database/connection';
import { parseJsonColumnOr } from '@data/database/jsonColumn';

export interface SavedQuote {
  id: number;
  createdAt: number;
  label: string | null;
  priceCents: number;
  fields: Record<string, string>;
}

const fieldsSchema = z.record(z.string(), z.string());

interface QuoteRow {
  id: number;
  created_at: number;
  label: string | null;
  price_cents: number;
  data: string | null;
}

const MAX_LISTED_QUOTES = 50;

export function createQuoteRepository(connection: () => SqlExecutor = getDb) {
  return {
    async save(label: string | null, priceCents: number, data: unknown): Promise<void> {
      await connection().runAsync(
        'INSERT INTO quotes (created_at, label, price_cents, data) VALUES (?, ?, ?, ?)',
        Date.now(),
        label,
        priceCents,
        JSON.stringify(data),
      );
    },

    async list(): Promise<SavedQuote[]> {
      const rows = await connection().getAllAsync<QuoteRow>(
        'SELECT id, created_at, label, price_cents, data FROM quotes ORDER BY created_at DESC LIMIT ?',
        MAX_LISTED_QUOTES,
      );
      return rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        label: row.label,
        priceCents: row.price_cents,
        fields: parseJsonColumnOr(row.data, fieldsSchema, {}),
      }));
    },

    async remove(id: number): Promise<void> {
      await connection().runAsync('DELETE FROM quotes WHERE id = ?', id);
    },
  };
}

export const quoteRepository = createQuoteRepository();
