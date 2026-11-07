import { vehicleInUse } from '@application/vehicleInUse';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { today } from '@shared/utils/dates';

export function useCostPerKm() {
  const { data } = useAsyncData(async () => vehicleRepository.getCostsAt(today(), (await vehicleInUse())?.id));
  return data?.costs?.fullPerKm ?? 0;
}
