import type { ConsumptionUnit } from '@domain/regional/regional';
import type { Formatter } from '@shared/i18n/format';

const EXAMPLE_CENTS = 123456;
const EXAMPLE_KM = 12.5;
const EXAMPLE_PER_KM_CENTS = 250;
const EXAMPLE_KM_PER_LITER = 10.5;

export const CONSUMPTION_KEYS: Record<ConsumptionUnit, 'kmPerLiter' | 'litersPer100km' | 'mpg'> = {
  'km/L': 'kmPerLiter',
  'L/100km': 'litersPer100km',
  mpg: 'mpg',
};

export function buildRegionPreview(format: Formatter, date: string, consumptionUnitLabel: string): string[] {
  return [
    format.money(EXAMPLE_CENTS),
    format.distance(EXAMPLE_KM),
    format.perDistance(EXAMPLE_PER_KM_CENTS),
    format.date(date),
    `${format.consumptionInput(EXAMPLE_KM_PER_LITER)} ${consumptionUnitLabel}`,
  ];
}
