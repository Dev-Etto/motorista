import { getDb, runInTransaction, SqlExecutor } from '@data/database/connection';
import { countsAgainstProfit, ExpenseCategory } from '@domain/expense/expense';
import { ShiftFact } from '@domain/insights/types';
import { KmTotals } from '@domain/reminder/reminder';
import { ExpenseRow } from './expenseRepository';
import { vehicleRepository } from './vehicleRepository';

export type KmSource = 'manual' | 'odometer' | 'gps';

interface ShiftRow {
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

export interface ShiftRecord {
  id: number;
  vehicleId: number | null;
  date: string;
  startHour: number | null;
  minutes: number;
  km: number | null;
  kmSource: KmSource;
  odometerEnd: number | null;
  trips: number | null;
  costPerKm: number;
  variablePerKm: number;
  note: string | null;
}

const toShiftRecord = (row: ShiftRow): ShiftRecord => ({
  id: row.id,
  vehicleId: row.vehicle_id,
  date: row.date,
  startHour: row.start_hour,
  minutes: row.minutes,
  km: row.km,
  kmSource: row.km_source,
  odometerEnd: row.odometer_end,
  trips: row.trips,
  costPerKm: row.cost_per_km,
  variablePerKm: row.variable_per_km,
  note: row.note,
});

export interface ShiftInput {
  id?: number;
  vehicleId: number | null;
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

export type ShiftListItem = ShiftFact & { id: number; partial: boolean; vehicleId: number | null };

interface CostSnapshot {
  costPerKm: number;
  variablePerKm: number;
}

async function resolveSnapshot(tx: SqlExecutor, input: ShiftInput, fresh: CostSnapshot): Promise<CostSnapshot> {
  if (!input.id) return fresh;

  const existing = await tx.getFirstAsync<ShiftRow>('SELECT * FROM shifts WHERE id = ?', input.id);
  if (!existing || existing.cost_per_km <= 0 || existing.date !== input.date || existing.vehicle_id !== input.vehicleId) return fresh;

  return { costPerKm: existing.cost_per_km, variablePerKm: existing.variable_per_km };
}

async function insertShift(tx: SqlExecutor, input: ShiftInput, snapshot: CostSnapshot) {
  const result = await tx.runAsync(
    `INSERT INTO shifts (vehicle_id, date, start_hour, minutes, km, km_source, odometer_end, trips, cost_per_km,
     variable_per_km, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.vehicleId,
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

async function updateShift(tx: SqlExecutor, id: number, input: ShiftInput, snapshot: CostSnapshot) {
  await tx.runAsync(
    `UPDATE shifts SET vehicle_id = ?, date = ?, start_hour = ?, minutes = ?, km = ?, km_source = ?, odometer_end = ?, trips = ?,
     note = ?, cost_per_km = ?, variable_per_km = ? WHERE id = ?`,
    input.vehicleId,
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

async function insertChildren(tx: SqlExecutor, shiftId: number, input: ShiftInput) {
  for (const earning of input.earnings) {
    await tx.runAsync('INSERT INTO shift_earnings (shift_id, platform_id, cents) VALUES (?, ?, ?)', shiftId, earning.platformId, earning.cents);
  }
  for (const expense of input.expenses) {
    await tx.runAsync('INSERT INTO expenses (shift_id, date, category, cents) VALUES (?, ?, ?, ?)', shiftId, input.date, expense.category, expense.cents);
  }
}

export function createShiftRepository(connection: () => SqlExecutor = getDb, vehicles = vehicleRepository) {
  return {
    async save(input: ShiftInput): Promise<number> {
      const { vehicle, costs } = await vehicles.getCostsAt(input.date, input.vehicleId);
      const fresh = { costPerKm: costs?.fullPerKm ?? 0, variablePerKm: costs?.variablePerKm ?? 0 };
      const withVehicle = { ...input, vehicleId: vehicle?.id ?? null };
      let shiftId = input.id ?? 0;

      await runInTransaction(async (tx) => {
        const snapshot = await resolveSnapshot(tx, withVehicle, fresh);
        if (input.id) await updateShift(tx, input.id, withVehicle, snapshot);
        if (!input.id) shiftId = await insertShift(tx, withVehicle, snapshot);
        await insertChildren(tx, shiftId, withVehicle);
      });

      return shiftId;
    },

    async remove(id: number): Promise<void> {
      await connection().runAsync('DELETE FROM shifts WHERE id = ?', id);
    },

    async findById(id: number) {
      const db = connection();
      const row = await db.getFirstAsync<ShiftRow>('SELECT * FROM shifts WHERE id = ?', id);
      if (!row) return null;

      const [earnings, expenses] = await Promise.all([
        db.getAllAsync<{ platformId: number; name: string; cents: number }>(
          'SELECT e.platform_id AS platformId, p.name, e.cents FROM shift_earnings e JOIN platforms p ON p.id = e.platform_id WHERE e.shift_id = ?',
          id,
        ),
        db.getAllAsync<ExpenseRow>('SELECT * FROM expenses WHERE shift_id = ?', id),
      ]);

      return { shift: toShiftRecord(row), earnings, expenses };
    },

    async lastOdometerEnd(vehicleId: number | null): Promise<number | null> {
      const row = await connection().getFirstAsync<{ odometer_end: number }>(
        'SELECT odometer_end FROM shifts WHERE odometer_end IS NOT NULL AND (? IS NULL OR vehicle_id = ?) ORDER BY date DESC, id DESC LIMIT 1',
        vehicleId,
        vehicleId,
      );
      return row?.odometer_end ?? null;
    },

    async listFacts(start: string, end: string): Promise<ShiftListItem[]> {
      const db = connection();
      const [shifts, earnings, expenses] = await Promise.all([
        db.getAllAsync<ShiftRow>('SELECT * FROM shifts WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC', start, end),
        db.getAllAsync<{ shift_id: number; name: string; cents: number }>(
          `SELECT e.shift_id, p.name, e.cents FROM shift_earnings e
           JOIN platforms p ON p.id = e.platform_id JOIN shifts s ON s.id = e.shift_id
           WHERE s.date >= ? AND s.date <= ?`,
          start,
          end,
        ),
        db.getAllAsync<ExpenseRow>('SELECT e.* FROM expenses e JOIN shifts s ON s.id = e.shift_id WHERE s.date >= ? AND s.date <= ?', start, end),
      ]);

      return shifts.map((shift) => {
        const own = earnings.filter((earning) => earning.shift_id === shift.id);
        const countable = expenses.filter((expense) => expense.shift_id === shift.id && countsAgainstProfit(expense.category));

        return {
          id: shift.id,
          vehicleId: shift.vehicle_id,
          date: shift.date,
          startHour: shift.start_hour,
          minutes: shift.minutes,
          km: shift.km,
          costPerKm: shift.cost_per_km,
          variablePerKm: shift.variable_per_km,
          grossCents: own.reduce((total, earning) => total + earning.cents, 0),
          expensesCents: countable.reduce((total, expense) => total + expense.cents, 0),
          earnings: own.map((earning) => ({ platform: earning.name, cents: earning.cents })),
          partial: !shift.km || shift.cost_per_km <= 0,
        };
      });
    },

    async usageStats() {
      const row = await connection().getFirstAsync<{ total: number; days: number; first: string | null; last: string | null }>(
        'SELECT COUNT(*) AS total, COUNT(DISTINCT date) AS days, MIN(date) AS first, MAX(date) AS last FROM shifts',
      );
      return { total: row?.total ?? 0, days: row?.days ?? 0, first: row?.first ?? null, last: row?.last ?? null };
    },

    async kmTotals(): Promise<KmTotals> {
      const rows = await connection().getAllAsync<{ vehicleId: number | null; value: number | null }>(
        'SELECT vehicle_id AS vehicleId, SUM(km) AS value FROM shifts GROUP BY vehicle_id',
      );
      return {
        all: rows.reduce((total, row) => total + (row.value ?? 0), 0),
        byVehicle: Object.fromEntries(rows.filter((row) => row.vehicleId !== null).map((row) => [row.vehicleId, row.value ?? 0])),
      };
    },

    async totalKm(start: string, end: string): Promise<number> {
      const row = await connection().getFirstAsync<{ value: number | null }>('SELECT SUM(km) AS value FROM shifts WHERE date >= ? AND date <= ?', start, end);
      return row?.value ?? 0;
    },
  };
}

export const shiftRepository = createShiftRepository();
