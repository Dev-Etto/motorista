import { getDb, type SqlExecutor } from '@data/database/connection';
import { parseJsonColumn } from '@data/database/jsonColumn';
import { computeCosts, type CostBreakdown, type CostProfile, costProfileSchema, type FuelType, type VehicleKind } from '@domain/vehicle/costs';
import { SETTING_KEYS } from './settingsRepository';

export interface Vehicle {
  id: number;
  name: string;
  kind: VehicleKind;
  fuel: FuelType;
}

export interface VehicleCosts {
  vehicle: Vehicle | null;
  profile: CostProfile | null;
  costs: CostBreakdown | null;
}

const PROFILE_COLUMNS = 'SELECT data FROM cost_profiles WHERE vehicle_id = ?';

async function findProfileRow(db: SqlExecutor, vehicleId: number, date: string) {
  const current = await db.getFirstAsync<{ data: string }>(`${PROFILE_COLUMNS} AND valid_from <= ? ORDER BY valid_from DESC LIMIT 1`, vehicleId, date);
  if (current) return current;

  return db.getFirstAsync<{ data: string }>(`${PROFILE_COLUMNS} ORDER BY valid_from ASC LIMIT 1`, vehicleId);
}

const VEHICLE_COLUMNS = 'SELECT id, name, kind, fuel FROM vehicles';

export class OnlyVehicleError extends Error {
  constructor() {
    super('only-vehicle');
  }
}

export function createVehicleRepository(connection: () => SqlExecutor = getDb) {
  return {
    list(): Promise<Vehicle[]> {
      return connection().getAllAsync<Vehicle>(`${VEHICLE_COLUMNS} WHERE active = 1 ORDER BY id`);
    },

    listArchived(): Promise<Vehicle[]> {
      return connection().getAllAsync<Vehicle>(`${VEHICLE_COLUMNS} WHERE active = 0 ORDER BY id`);
    },

    async reactivate(id: number): Promise<void> {
      await connection().runAsync('UPDATE vehicles SET active = 1 WHERE id = ?', id);
    },

    find(id: number): Promise<Vehicle | null> {
      return connection().getFirstAsync<Vehicle>(`${VEHICLE_COLUMNS} WHERE id = ?`, id);
    },

    getCurrent(): Promise<Vehicle | null> {
      return connection().getFirstAsync<Vehicle>(
        `${VEHICLE_COLUMNS} WHERE active = 1
         ORDER BY id = (SELECT CAST(value AS INTEGER) FROM settings WHERE key = '${SETTING_KEYS.currentVehicle}') DESC, id DESC LIMIT 1`,
      );
    },

    async setCurrent(id: number): Promise<void> {
      await connection().runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        SETTING_KEYS.currentVehicle,
        String(id),
      );
    },

    async archive(id: number): Promise<void> {
      const db = connection();
      const others = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM vehicles WHERE active = 1 AND id != ?', id);
      if (!others?.total) throw new OnlyVehicleError();

      await db.runAsync('UPDATE vehicles SET active = 0 WHERE id = ?', id);
    },

    async save(input: Omit<Vehicle, 'id'> & { id?: number }): Promise<number> {
      const db = connection();
      if (input.id) {
        await db.runAsync('UPDATE vehicles SET name = ?, kind = ?, fuel = ? WHERE id = ?', input.name, input.kind, input.fuel, input.id);
        return input.id;
      }

      const result = await db.runAsync(
        'INSERT INTO vehicles (name, kind, fuel, active, created_at) VALUES (?, ?, ?, 1, ?)',
        input.name,
        input.kind,
        input.fuel,
        Date.now(),
      );
      return result.lastInsertRowId;
    },

    async saveCostProfile(vehicleId: number, validFrom: string, profile: CostProfile): Promise<void> {
      await connection().runAsync(
        `INSERT INTO cost_profiles (vehicle_id, valid_from, data) VALUES (?, ?, ?)
         ON CONFLICT(vehicle_id, valid_from) DO UPDATE SET data = excluded.data`,
        vehicleId,
        validFrom,
        JSON.stringify(profile),
      );
    },

    async getCostProfile(vehicleId: number, date: string): Promise<CostProfile | null> {
      const row = await findProfileRow(connection(), vehicleId, date);
      return row ? parseJsonColumn(row.data, costProfileSchema) : null;
    },

    async getCostsAt(date: string, vehicleId?: number | null): Promise<VehicleCosts> {
      const vehicle = vehicleId ? await this.find(vehicleId) : await this.getCurrent();
      if (!vehicle) return { vehicle: null, profile: null, costs: null };

      const profile = await this.getCostProfile(vehicle.id, date);
      return { vehicle, profile, costs: profile ? computeCosts(profile) : null };
    },
  };
}

export const vehicleRepository = createVehicleRepository();
