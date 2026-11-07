import { listVehicles } from '@application/vehicles';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { today } from '@shared/utils/dates';

export function useVehicles() {
  return useAsyncData(() => listVehicles(today()));
}
