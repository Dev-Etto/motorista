import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '@/data/database/connection';
import { countsAgainstProfit, ExpenseCategory } from '@/domain/expense/expense';
import { ShiftFact } from '@/domain/insights/types';
import { vehicleRepository } from './vehicleRepository';
import { ExpenseRow } from './expenseRepository';

export type KmSource = 'manual' | 'odometer' | 'gps';

export interface ShiftRow {
  id: number;
  vehicle_id: number | null;
  date: string;
  start_hour: number | null;
  minutes: number;
  km: number | null;
  km_source: KmSource;
  odometer_end: number | null;
  trips: number | null;
  cost_per_km: number;
  variable_per_km: number;
  note: string | null;
}

export interface ShiftInput {
  id?: number;
  date: string;
  startHour: number | null;
  minutes: number;
  km: number | null;
  kmSource: KmSource;
  odometerEnd: number | null;
  trips: number | null;
  note: string | null;
  earnings: { platformId: number; cents: number }[];
  expenses: { category: ExpenseCategory; cents: number }[];
}

export type ShiftListItem = ShiftFact & { id: number; partial: boolean };

interface CostSnapshot {
  costPerKm: number;
  variablePerKm: number;
}

type Transaction = Pick<SQLiteDatabase, 'runAsync' | 'getFirstAsync'>;

async function resolveSnapshot(tx: Transaction, input: ShiftInput, fresh: CostSnapshot): Promise<CostSnapshot> {
  if (!input.id) return fresh;

  const existing = await tx.getFirstAsync<ShiftRow>('SELECT * FROM shifts WHERE id = ?', input.id);
  if (!existing || existing.cost_per_km <= 0 || existing.date !== input.date) return fresh;

  return { costPerKm: existing.cost_per_km, variablePerKm: existing.variable_per_km };
}

async function insertShift(tx: Transaction, input: ShiftInput, vehicleId: number | null, snapshot: CostSnapshot) {
  const result = await tx.runAsync(
    `INSERT INTO shifts (vehicle_id, date, start_hour, minutes, km, km_source, odometer_end, trips, cost_per_km,
     variable_per_km, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    vehicleId,
    input.date,
    input.startHour,
    input.minutes,
    input.km,
    input.kmSource,
    input.odometerEnd,
    input.trips,
    snapshot.costPerKm,
    snapshot.variablePerKm,
    input.note,
    Date.now(),
  );
  return result.lastInsertRowId;
}

async function updateShift(tx: Transaction, id: number, input: ShiftInput, snapshot: CostSnapshot) {
  await tx.runAsync(
    `UPDATE shifts SET date = ?, start_hour = ?, minutes = ?, km = ?, km_source = ?, odometer_end = ?, trips = ?,
     note = ?, cost_per_km = ?, variable_per_km = ? WHERE id = ?`,
    input.date,
    input.startHour,
    input.minutes,
    input.km,
    input.kmSource,
    input.odometerEnd,
    input.trips,
    input.note,
    snapshot.costPerKm,
    snapshot.variablePerKm,
    id,
  );
  await tx.runAsync('DELETE FROM shift_earnings WHERE shift_id = ?', id);
  await tx.runAsync('DELETE FROM expenses WHERE shift_id = ?', id);
}

async function insertChildren(tx: Transaction, shiftId: number, input: ShiftInput) {
  for (const earning of input.earnings) {
    await tx.runAsync(
      'INSERT INTO shift_earnings (shift_id, platform_id, cents) VALUES (?, ?, ?)',
      shiftId,
      earning.platformId,
      earning.cents,
    );
  }
  for (const expense of input.expenses) {
    await tx.runAsync(
      'INSERT INTO expenses (shift_id, date, category, cents) VALUES (?, ?, ?, ?)',
      shiftId,
      input.date,
      expense.category,
      expense.cents,
    );
  }
}

export const shiftRepository = {
  async save(input: ShiftInput): Promise<number> {
    const { vehicle, costs } = await vehicleRepository.getCostsAt(input.date);
    const fresh = { costPerKm: costs?.fullPerKm ?? 0, variablePerKm: costs?.variablePerKm ?? 0 };
    let shiftId = input.id ?? 0;

    await getDb().withExclusiveTransactionAsync(async (tx) => {
      const snapshot = await resolveSnapshot(tx, input, fresh);
      if (input.id) await updateShift(tx, input.id, input, snapshot);
      if (!input.id) shiftId = await insertShift(tx, input, vehicle?.id ?? null, snapshot);
      await insertChildren(tx, shiftId, input);
    });

    return shiftId;
  },

  async remove(id: number): Promise<void> {
    await getDb().runAsync('DELETE FROM shifts WHERE id = ?', id);
  },

  async findById(id: number) {
    const db = getDb();
    const shift = await db.getFirstAsync<ShiftRow>('SELECT * FROM shifts WHERE id = ?', id);
    if (!shift) return null;

    const [earnings, expenses] = await Promise.all([
      db.getAllAsync<{ platform_id: number; name: string; cents: number }>(
        'SELECT e.platform_id, p.name, e.cents FROM shift_earnings e JOIN platforms p ON p.id = e.platform_id WHERE e.shift_id = ?',
        id,
      ),
      db.getAllAsync<ExpenseRow>('SELECT * FROM expenses WHERE shift_id = ?', id),
    ]);

    return { shift, earnings, expenses };
  },

  async listFacts(start: string, end: string): Promise<ShiftListItem[]> {
    const db = getDb();
    const [shifts, earnings, expenses] = await Promise.all([
      db.getAllAsync<ShiftRow>('SELECT * FROM shifts WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC', start, end),
      db.getAllAsync<{ shift_id: number; name: string; cents: number }>(
        `SELECT e.shift_id, p.name, e.cents FROM shift_earnings e
         JOIN platforms p ON p.id = e.platform_id JOIN shifts s ON s.id = e.shift_id
         WHERE s.date >= ? AND s.date <= ?`,
        start,
        end,
      ),
      db.getAllAsync<ExpenseRow>(
        'SELECT e.* FROM expenses e JOIN shifts s ON s.id = e.shift_id WHERE s.date >= ? AND s.date <= ?',
        start,
        end,
      ),
    ]);

    return shifts.map((shift) => {
      const own = earnings.filter((earning) => earning.shift_id === shift.id);
      const countable = expenses.filter((expense) => expense.shift_id === shift.id && countsAgainstProfit(expense.category));

      return {
        id: shift.id,
        date: shift.date,
        startHour: shift.start_hour,
        minutes: shift.minutes,
        km: shift.km,
        costPerKm: shift.cost_per_km,
        grossCents: own.reduce((total, earning) => total + earning.cents, 0),
        expensesCents: countable.reduce((total, expense) => total + expense.cents, 0),
        earnings: own.map((earning) => ({ platform: earning.name, cents: earning.cents })),
        partial: !shift.km || shift.cost_per_km <= 0,
      };
    });
  },

  async usageStats() {
    const row = await getDb().getFirstAsync<{ total: number; days: number; first: string | null; last: string | null }>(
      'SELECT COUNT(*) AS total, COUNT(DISTINCT date) AS days, MIN(date) AS first, MAX(date) AS last FROM shifts',
    );
    return { total: row?.total ?? 0, days: row?.days ?? 0, first: row?.first ?? null, last: row?.last ?? null };
  },

  async totalKmEver(): Promise<number> {
    const row = await getDb().getFirstAsync<{ value: number | null }>('SELECT SUM(km) AS value FROM shifts');
    return row?.value ?? 0;
  },

  async latestOdometer(): Promise<number | null> {
    const row = await getDb().getFirstAsync<{ value: number | null }>(
      `SELECT MAX(value) AS value FROM (
         SELECT MAX(odometer_end) AS value FROM shifts
         UNION ALL SELECT MAX(odometer) AS value FROM expenses
       )`,
    );
    return row?.value ?? null;
  },

  async totalKm(start: string, end: string): Promise<number> {
    const row = await getDb().getFirstAsync<{ value: number | null }>(
      'SELECT SUM(km) AS value FROM shifts WHERE date >= ? AND date <= ?',
      start,
      end,
    );
    return row?.value ?? 0;
  },
};
