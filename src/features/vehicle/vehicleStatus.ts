import { isInRunningShift } from '@application/vehicles';
import { vehicleRepository } from '@data/repositories/vehicleRepository';

export async function loadVehicleStatus(vehicleId: number | undefined) {
  if (!vehicleId) return { canUseNow: false, canArchive: false, inShift: false };

  const [vehicles, current, inShift] = await Promise.all([vehicleRepository.list(), vehicleRepository.getCurrent(), isInRunningShift(vehicleId)]);
  return { canUseNow: current?.id !== vehicleId, canArchive: vehicles.length > 1 && !inShift, inShift };
}
