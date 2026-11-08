import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { today } from '@shared/utils/dates';

export function useExampleCost(): number | null {
  const costs = useAsyncData(() => vehicleRepository.getCostsAt(today()));
  return costs.data?.costs?.fullPerKm || null;
}
