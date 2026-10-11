import { getDb } from '@/data/database/connection';
import { countsAgainstProfit, ExpenseCategory } from '@/domain/expense/expense';

export interface ExpenseRow {
  id: number;
  shift_id: number | null;
  date: string;
  category: ExpenseCategory;
  cents: number;
  liters: number | null;
  odometer: number | null;
  note: string | null;
}

export const expenseRepository = {
  async add(input: Omit<ExpenseRow, 'id' | 'shift_id'>): Promise<void> {
    await getDb().runAsync(
      'INSERT INTO expenses (shift_id, date, category, cents, liters, odometer, note) VALUES (NULL, ?, ?, ?, ?, ?, ?)',
      input.date,
      input.category,
      input.cents,
      input.liters,
      input.odometer,
      input.note,
    );
  },

  async remove(id: number): Promise<void> {
    await getDb().runAsync('DELETE FROM expenses WHERE id = ?', id);
  },

  listLoose(start: string, end: string): Promise<ExpenseRow[]> {
    return getDb().getAllAsync<ExpenseRow>(
      'SELECT * FROM expenses WHERE shift_id IS NULL AND date >= ? AND date <= ? ORDER BY date DESC, id DESC',
      start,
      end,
    );
  },

  async totalLooseCountable(start: string, end: string): Promise<number> {
    const rows = await this.listLoose(start, end);
    return rows.filter((row) => countsAgainstProfit(row.category)).reduce((total, row) => total + row.cents, 0);
  },

  async totalPaidFuel(start: string, end: string): Promise<number> {
    const row = await getDb().getFirstAsync<{ value: number | null }>(
      "SELECT SUM(cents) AS value FROM expenses WHERE category = 'fuel' AND date >= ? AND date <= ?",
      start,
      end,
    );
    return row?.value ?? 0;
  },
};
