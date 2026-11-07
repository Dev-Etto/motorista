import { vehicleRepository } from '@data/repositories/vehicleRepository';

export async function loadVehicleStatus(vehicleId: number | undefined) {
  if (!vehicleId) return { canUseNow: false, canArchive: false };

  const [vehicles, current] = await Promise.all([vehicleRepository.list(), vehicleRepository.getCurrent()]);
  return { canUseNow: current?.id !== vehicleId, canArchive: vehicles.length > 1 };
}
