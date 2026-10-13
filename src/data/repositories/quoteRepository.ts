import { getDb } from '@/data/database/connection';

export interface QuoteRow {
  id: number;
  created_at: number;
  label: string | null;
  price_cents: number;
  data: string;
}

const MAX_LISTED_QUOTES = 50;

export const quoteRepository = {
  async save(label: string | null, priceCents: number, data: unknown): Promise<void> {
    await getDb().runAsync(
      'INSERT INTO quotes (created_at, label, price_cents, data) VALUES (?, ?, ?, ?)',
      Date.now(),
      label,
      priceCents,
      JSON.stringify(data),
    );
  },

  list(): Promise<QuoteRow[]> {
    return getDb().getAllAsync<QuoteRow>('SELECT * FROM quotes ORDER BY created_at DESC LIMIT ?', MAX_LISTED_QUOTES);
  },

  async remove(id: number): Promise<void> {
    await getDb().runAsync('DELETE FROM quotes WHERE id = ?', id);
  },
};
