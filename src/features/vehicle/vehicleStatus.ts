import { isInRunningShift, nextCurrentIfArchived } from '@application/vehicles';
import { vehicleRepository } from '@data/repositories/vehicleRepository';

export async function loadVehicleStatus(vehicleId: number | undefined) {
  if (!vehicleId) return { canUseNow: false, canArchive: false, inShift: false, nextCurrent: null };

  const [vehicles, current, inShift, nextCurrent] = await Promise.all([
    vehicleRepository.list(),
    vehicleRepository.getCurrent(),
    isInRunningShift(vehicleId),
    nextCurrentIfArchived(vehicleId),
  ]);
  return { canUseNow: current?.id !== vehicleId, canArchive: vehicles.length > 1 && !inShift, inShift, nextCurrent };
}
