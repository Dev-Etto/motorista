import { type Vehicle, vehicleRepository } from '@data/repositories/vehicleRepository';
import { type CostBreakdown } from '@domain/vehicle/costs';
import { syncCopilotTargets } from './offerSettings';
import { shiftVehicle } from './vehicleInUse';

export type { Vehicle };

export interface VehicleSummary {
  vehicle: Vehicle;
  costs: CostBreakdown | null;
  current: boolean;
}

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

export async function archiveVehicle(id: number): Promise<void> {
  if (await isInRunningShift(id)) throw new VehicleInShiftError();
  await vehicleRepository.archive(id);
  await syncCopilotTargets();
}
