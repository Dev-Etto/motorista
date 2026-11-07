import { type Vehicle, vehicleRepository } from '@data/repositories/vehicleRepository';
import { type CostBreakdown } from '@domain/vehicle/costs';
import { syncCopilotTargets } from './offerSettings';

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

export async function archiveVehicle(id: number): Promise<void> {
  await vehicleRepository.archive(id);
  await syncCopilotTargets();
}
