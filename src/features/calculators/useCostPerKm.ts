import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { today } from '@/shared/utils/dates';

export function useCostPerKm() {
  const { data } = useAsyncData(() => vehicleRepository.getCostsAt(today()));
  return data?.costs?.fullPerKm ?? 0;
}
