import { vehicleInUse } from '@application/vehicleInUse';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { today } from '@shared/utils/dates';

async function loadCostBasis() {
  const [vehicle, vehicles] = await Promise.all([vehicleInUse(), vehicleRepository.list()]);
  const { costs } = await vehicleRepository.getCostsAt(today(), vehicle?.id);
  return { costPerKm: costs?.fullPerKm ?? 0, vehicleName: vehicles.length > 1 ? (vehicle?.name ?? null) : null };
}

export function useCostBasis() {
  const { data } = useAsyncData(loadCostBasis);
  return data ?? { costPerKm: 0, vehicleName: null };
}
