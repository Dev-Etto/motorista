import { File, Paths } from 'expo-file-system';
import { addDays, toISODate } from '@/shared/utils/dates';
import { runInTransaction } from './connection';

const REQUEST_FILE = 'mock-seed';
const SAMPLE_DAYS = 6;
const SAMPLE_EARNINGS_CENTS = 28000;
const SAMPLE_EARNINGS_STEP = 1500;
const SAMPLE_PROFILE = {
  ownership: 'owned',
  fuelPriceCents: 600,
  consumptionKmPerUnit: 12,
  oilChangeCents: 25000,
  oilIntervalKm: 10000,
  tiresCents: 160000,
  tiresLifeKm: 50000,
  maintenanceMonthlyCents: 20000,
  insuranceMonthlyCents: 25000,
  ipvaYearlyCents: 150000,
  licensingYearlyCents: 20000,
  paymentMonthlyCents: 0,
  vehicleValueCents: 5000000,
  depreciationAnnualPct: 10,
  depreciationEnabled: true,
  otherFixedMonthlyCents: 0,
  plannedKmMonth: 4000,
};

export async function seedSampleData(now = Date.now()): Promise<void> {
  await runInTransaction(async (tx) => {
    await tx.execAsync('DELETE FROM shift_earnings; DELETE FROM shifts; DELETE FROM cost_profiles; DELETE FROM vehicles;');
    await tx.runAsync("INSERT INTO vehicles (id, name, kind, fuel, active, created_at) VALUES (1, 'Carro de teste', 'car', 'gasoline', 1, ?)", now);
    await tx.runAsync("INSERT INTO cost_profiles (vehicle_id, valid_from, data) VALUES (1, '2020-01-01', ?)", JSON.stringify(SAMPLE_PROFILE));
    await tx.runAsync("INSERT INTO settings (key, value) VALUES ('onboarded', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    for (let day = 0; day < SAMPLE_DAYS; day++) {
      const date = addDays(toISODate(new Date(now)), -day);
      await tx.runAsync(
        'INSERT INTO shifts (id, vehicle_id, date, start_hour, minutes, km, cost_per_km, variable_per_km, created_at) VALUES (?, 1, ?, 8, 480, 140, 95, 60, ?)',
        day + 1,
        date,
        now,
      );
      await tx.runAsync('INSERT INTO shift_earnings (shift_id, platform_id, cents) VALUES (?, 1, ?)', day + 1, SAMPLE_EARNINGS_CENTS + day * SAMPLE_EARNINGS_STEP);
    }
  });
}

export async function applyRequestedSeed(): Promise<void> {
  const request = new File(Paths.document, REQUEST_FILE);
  if (!request.exists) return;

  request.delete();
  await seedSampleData();
}
