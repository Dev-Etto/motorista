import { loadGoalProgress } from '@application/goalProgress';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { today } from '@shared/utils/dates';

export function useMoreSummary() {
  return useAsyncData(async () => {
    const date = today();
    const [{ vehicle, costs }, goal] = await Promise.all([vehicleRepository.getCostsAt(date), loadGoalProgress(date)]);
    return { vehicle, costPerKm: costs?.fullPerKm ?? null, goal };
  });
}
