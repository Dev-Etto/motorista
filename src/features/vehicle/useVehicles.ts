import { listArchivedVehicles, listVehicles } from '@application/vehicles';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { today } from '@shared/utils/dates';

export function useVehicles() {
  return useAsyncData(async () => {
    const [active, archived] = await Promise.all([listVehicles(today()), listArchivedVehicles()]);
    return { active, archived };
  });
}
