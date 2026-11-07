import { type Vehicle, vehicleRepository } from '@data/repositories/vehicleRepository';
import { type CostBreakdown } from '@domain/vehicle/costs';
import { today } from '@shared/utils/dates';
import { syncCopilotTargets } from './offerSettings';
import { shiftVehicle } from './vehicleInUse';

export type { Vehicle };

export interface VehicleSummary {
  vehicle: Vehicle;
  costs: CostBreakdown | null;
  current: boolean;
}

export async function nextCurrentIfArchived(id: number): Promise<Vehicle | null> {
  const current = await vehicleRepository.getCurrent();
  if (current?.id !== id) return null;

  const others = (await vehicleRepository.list()).filter((vehicle) => vehicle.id !== id);
  return others.at(-1) ?? null;
}

export async function reactivateVehicle(id: number): Promise<void> {
  await vehicleRepository.reactivate(id);
}

export const listArchivedVehicles = () => vehicleRepository.listArchived();

export async function listVehicles(date: string): Promise<VehicleSummary[]> {
  const [vehicles, current] = await Promise.all([vehicleRepository.list(), vehicleRepository.getCurrent()]);
  return Promise.all(
    vehicles.map(async (vehicle) => ({
      vehicle,
      costs: (await vehicleRepository.getCostsAt(date, vehicle.id)).costs,
      current: vehicle.id === current?.id,
    })),
  );
}

export async function chooseCurrentVehicle(id: number): Promise<void> {
  await vehicleRepository.setCurrent(id);
  await syncCopilotTargets();
}

export class VehicleInShiftError extends Error {}

export async function shiftVehicleOtherThan(id: number): Promise<Vehicle | null> {
  const vehicle = await shiftVehicle();
  return vehicle && vehicle.id !== id ? vehicle : null;
}

export async function isInRunningShift(id: number): Promise<boolean> {
  return (await shiftVehicle())?.id === id;
}

const LIQUID_FUELS = ['gasoline', 'ethanol', 'diesel'];
const MIN_PRICE_CHANGE_CENTS = 1;

export async function fuelPriceSuggestion(
  vehicleId: number | null,
  cents: number,
  liters: number | null,
): Promise<{ vehicle: Vehicle; priceCents: number } | null> {
  if (!vehicleId || !liters || liters <= 0) return null;

  const { vehicle, profile } = await vehicleRepository.getCostsAt(today(), vehicleId);
  if (!vehicle || !profile || !LIQUID_FUELS.includes(vehicle.fuel)) return null;

  const priceCents = Math.round(cents / liters);
  return Math.abs(priceCents - profile.fuelPriceCents) >= MIN_PRICE_CHANGE_CENTS ? { vehicle, priceCents } : null;
}

export async function updateFuelPrice(vehicleId: number, priceCents: number): Promise<void> {
  const date = today();
  const profile = await vehicleRepository.getCostProfile(vehicleId, date);
  if (!profile) return;

  await vehicleRepository.saveCostProfile(vehicleId, date, { ...profile, fuelPriceCents: priceCents });
  await syncCopilotTargets();
}

export async function archiveVehicle(id: number): Promise<void> {
  if (await isInRunningShift(id)) throw new VehicleInShiftError();
  await vehicleRepository.archive(id);
  await syncCopilotTargets();
}
