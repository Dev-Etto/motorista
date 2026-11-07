import { useTranslation } from 'react-i18next';
import { FUEL_CHOICES, KIND_CHOICES, OWNERSHIP_CHOICES } from './vehicleForm';

export function useVehicleOptions() {
  const { t } = useTranslation('vehicle');
  return {
    fuelOptions: FUEL_CHOICES.map((value) => ({ value, label: t(`fuel.${value}`) })),
    kindOptions: KIND_CHOICES.map((value) => ({ value, label: t(`kind.${value}`) })),
    ownershipOptions: OWNERSHIP_CHOICES.map((value) => ({ value, label: t(`ownership.${value}`) })),
  };
}
