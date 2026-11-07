import { getDb, SqlExecutor } from '@/data/database/connection';

export interface QuoteRow {
  id: number;
  created_at: number;
  label: string | null;
  price_cents: number;
  data: string;
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

    list(): Promise<QuoteRow[]> {
      return connection().getAllAsync<QuoteRow>('SELECT * FROM quotes ORDER BY created_at DESC LIMIT ?', MAX_LISTED_QUOTES);
    },

    async remove(id: number): Promise<void> {
      await connection().runAsync('DELETE FROM quotes WHERE id = ?', id);
    },
  };
}

export const quoteRepository = createQuoteRepository();
