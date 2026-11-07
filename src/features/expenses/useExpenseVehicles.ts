import { vehicleInUse } from '@application/vehicleInUse';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';

async function loadExpenseVehicles() {
  const [vehicles, inUse] = await Promise.all([vehicleRepository.list(), vehicleInUse()]);
  return { vehicles, inUseId: inUse?.id ?? null };
}

export function useExpenseVehicles() {
  const { data } = useAsyncData(loadExpenseVehicles, []);
  return { vehicles: data?.vehicles ?? [], inUseId: data?.inUseId ?? null };
}
