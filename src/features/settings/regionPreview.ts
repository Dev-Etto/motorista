import type { ConsumptionUnit } from '@domain/regional/regional';
import type { Formatter } from '@shared/i18n/format';

const EXAMPLE_CENTS = 123680;
const EXAMPLE_KM = 8.5;
const EXAMPLE_KM_PER_LITER = 11;

export const CONSUMPTION_KEYS: Record<ConsumptionUnit, 'kmPerLiter' | 'litersPer100km' | 'mpg'> = {
  'km/L': 'kmPerLiter',
  'L/100km': 'litersPer100km',
  mpg: 'mpg',
};

export type RegionPreviewItem = { id: 'money' | 'date' | 'distance' | 'consumption'; value: string };

export function buildRegionPreview(format: Formatter, date: string, consumptionUnitLabel: string): RegionPreviewItem[] {
  return [
    { id: 'money', value: format.money(EXAMPLE_CENTS) },
    { id: 'date', value: format.date(date) },
    { id: 'distance', value: format.distance(EXAMPLE_KM) },
    { id: 'consumption', value: `${format.consumptionInput(EXAMPLE_KM_PER_LITER)} ${consumptionUnitLabel}` },
  ];
}
