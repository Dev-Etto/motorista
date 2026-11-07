import { CostProfile, defaultDepreciationEnabled, FuelType, Ownership, suggestedProfile, VehicleKind } from '@domain/vehicle/costs';
import type { Formatter } from '@shared/i18n/format';
import type { ConsumptionUnit } from '@shared/utils/units';

export type CostFields = {
  fuelPrice: string;
  consumption: string;
  oilChange: string;
  oilInterval: string;
  tires: string;
  tiresLife: string;
  maintenance: string;
  insurance: string;
  ipva: string;
  licensing: string;
  payment: string;
  vehicleValue: string;
  depreciationPct: string;
  otherFixed: string;
  plannedKm: string;
};

const LIQUID_FUELS: FuelType[] = ['gasoline', 'ethanol', 'diesel'];

const isLiquid = (fuel: FuelType) => LIQUID_FUELS.includes(fuel);

const LIQUID_CONSUMPTION_LABELS: Record<ConsumptionUnit, string> = { 'km/L': 'km/l', 'L/100km': 'L/100 km', mpg: 'mpg' };

const ENERGY_UNITS: Partial<Record<FuelType, string>> = { cng: 'm³', electric: 'kWh' };

export function consumptionLabel(fuel: FuelType, format: Formatter): string {
  if (isLiquid(fuel)) return LIQUID_CONSUMPTION_LABELS[format.consumptionUnit];
  return `${format.distanceUnit}/${ENERGY_UNITS[fuel] ?? ''}`;
}

const consumptionInput = (kmPerUnit: number, fuel: FuelType, format: Formatter) =>
  isLiquid(fuel) ? format.consumptionInput(kmPerUnit) : format.distanceInput(kmPerUnit);

const consumptionOf = (text: string, fuel: FuelType, format: Formatter) => (isLiquid(fuel) ? format.consumptionOrZero(text) : format.distanceOrZero(text));

const fuelPriceInput = (cents: number, fuel: FuelType, format: Formatter) => (isLiquid(fuel) ? format.perVolumeInput(cents) : format.moneyInput(cents));

const fuelPriceOf = (text: string, fuel: FuelType, format: Formatter) => (isLiquid(fuel) ? format.perVolumeOrZero(text) : format.centsOrZero(text));

export function profileToFields(profile: CostProfile, fuel: FuelType, format: Formatter): CostFields {
  return {
    fuelPrice: fuelPriceInput(profile.fuelPriceCents, fuel, format),
    consumption: consumptionInput(profile.consumptionKmPerUnit, fuel, format),
    oilChange: format.moneyInput(profile.oilChangeCents),
    oilInterval: format.distanceInput(profile.oilIntervalKm, 0),
    tires: format.moneyInput(profile.tiresCents),
    tiresLife: format.distanceInput(profile.tiresLifeKm, 0),
    maintenance: format.moneyInput(profile.maintenanceMonthlyCents),
    insurance: format.moneyInput(profile.insuranceMonthlyCents),
    ipva: format.moneyInput(profile.ipvaYearlyCents),
    licensing: format.moneyInput(profile.licensingYearlyCents),
    payment: format.moneyInput(profile.paymentMonthlyCents),
    vehicleValue: format.moneyInput(profile.vehicleValueCents),
    depreciationPct: format.decimalInput(profile.depreciationAnnualPct),
    otherFixed: format.moneyInput(profile.otherFixedMonthlyCents),
    plannedKm: format.distanceInput(profile.plannedKmMonth, 0),
  };
}

export interface ProfileChoices {
  ownership: Ownership;
  depreciationEnabled: boolean;
  fuel: FuelType;
}

export function fieldsToProfile(fields: CostFields, choices: ProfileChoices, format: Formatter): CostProfile {
  return {
    ownership: choices.ownership,
    fuelPriceCents: fuelPriceOf(fields.fuelPrice, choices.fuel, format),
    consumptionKmPerUnit: consumptionOf(fields.consumption, choices.fuel, format),
    oilChangeCents: format.centsOrZero(fields.oilChange),
    oilIntervalKm: format.distanceOrZero(fields.oilInterval),
    tiresCents: format.centsOrZero(fields.tires),
    tiresLifeKm: format.distanceOrZero(fields.tiresLife),
    maintenanceMonthlyCents: format.centsOrZero(fields.maintenance),
    insuranceMonthlyCents: format.centsOrZero(fields.insurance),
    ipvaYearlyCents: format.centsOrZero(fields.ipva),
    licensingYearlyCents: format.centsOrZero(fields.licensing),
    paymentMonthlyCents: format.centsOrZero(fields.payment),
    vehicleValueCents: format.centsOrZero(fields.vehicleValue),
    depreciationAnnualPct: format.decimalOrZero(fields.depreciationPct),
    depreciationEnabled: choices.depreciationEnabled,
    otherFixedMonthlyCents: format.centsOrZero(fields.otherFixed),
    plannedKmMonth: format.distanceOrZero(fields.plannedKm),
  };
}

const MAX_FUEL_PRICE_CENTS = 5000;

export type ProfileProblem = 'consumption' | 'plannedDistance' | 'fuelPrice' | 'fuelPriceTooHigh';

export function validateProfile(profile: CostProfile): ProfileProblem | null {
  if (profile.consumptionKmPerUnit <= 0) return 'consumption';
  if (profile.plannedKmMonth <= 0) return 'plannedDistance';
  if (profile.fuelPriceCents <= 0) return 'fuelPrice';
  if (profile.fuelPriceCents > MAX_FUEL_PRICE_CENTS) return 'fuelPriceTooHigh';
  return null;
}

export const FUEL_CHOICES = ['gasoline', 'ethanol', 'cng', 'electric'] as const satisfies readonly FuelType[];

export const KIND_CHOICES = ['car', 'motorcycle'] as const satisfies readonly VehicleKind[];

export const OWNERSHIP_CHOICES = ['owned', 'financed', 'rented'] as const satisfies readonly Ownership[];

export const CONSUMPTION_HINT_KEYS = {
  'km/L': 'form.consumptionHint.kmPerLiter',
  'L/100km': 'form.consumptionHint.litersPer100km',
  mpg: 'form.consumptionHint.mpg',
} as const satisfies Record<ConsumptionUnit, string>;

export { defaultDepreciationEnabled, suggestedProfile };
