import { getDb } from '@/data/database/connection';
import { parseJsonColumn } from '@/data/database/jsonColumn';
import { computeCosts, type CostBreakdown, type CostProfile, costProfileSchema, type FuelType, type VehicleKind } from '@/domain/vehicle/costs';

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

async function findProfileRow(vehicleId: number, date: string) {
  const db = getDb();
  const current = await db.getFirstAsync<{ data: string }>(
    `${PROFILE_COLUMNS} AND valid_from <= ? ORDER BY valid_from DESC LIMIT 1`,
    vehicleId,
    date,
  );
  if (current) return current;

  return db.getFirstAsync<{ data: string }>(`${PROFILE_COLUMNS} ORDER BY valid_from ASC LIMIT 1`, vehicleId);
}

export const vehicleRepository = {
  getActive(): Promise<Vehicle | null> {
    return getDb().getFirstAsync<Vehicle>('SELECT id, name, kind, fuel FROM vehicles WHERE active = 1 ORDER BY id DESC LIMIT 1');
  },

  async save(input: Omit<Vehicle, 'id'> & { id?: number }): Promise<number> {
    const db = getDb();
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
    await getDb().runAsync(
      `INSERT INTO cost_profiles (vehicle_id, valid_from, data) VALUES (?, ?, ?)
       ON CONFLICT(vehicle_id, valid_from) DO UPDATE SET data = excluded.data`,
      vehicleId,
      validFrom,
      JSON.stringify(profile),
    );
  },

  async getCostProfile(vehicleId: number, date: string): Promise<CostProfile | null> {
    const row = await findProfileRow(vehicleId, date);
    return row ? parseJsonColumn(row.data, costProfileSchema) : null;
  },

  async getCostsAt(date: string): Promise<VehicleCosts> {
    const vehicle = await this.getActive();
    if (!vehicle) return { vehicle: null, profile: null, costs: null };

    const profile = await this.getCostProfile(vehicle.id, date);
    return { vehicle, profile, costs: profile ? computeCosts(profile) : null };
  },
};
