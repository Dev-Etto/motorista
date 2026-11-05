import { CostProfile, defaultDepreciationEnabled, FuelType, Ownership, suggestedProfile, VehicleKind } from '@/domain/vehicle/costs';
import { centsToInput } from '@/shared/utils/money';
import { centsOrZero, decimalOrZero } from '@/shared/utils/parse';

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

export function profileToFields(profile: CostProfile): CostFields {
  return {
    fuelPrice: centsToInput(profile.fuelPriceCents),
    consumption: String(profile.consumptionKmPerUnit).replace('.', ','),
    oilChange: centsToInput(profile.oilChangeCents),
    oilInterval: String(profile.oilIntervalKm),
    tires: centsToInput(profile.tiresCents),
    tiresLife: String(profile.tiresLifeKm),
    maintenance: centsToInput(profile.maintenanceMonthlyCents),
    insurance: centsToInput(profile.insuranceMonthlyCents),
    ipva: centsToInput(profile.ipvaYearlyCents),
    licensing: centsToInput(profile.licensingYearlyCents),
    payment: centsToInput(profile.paymentMonthlyCents),
    vehicleValue: centsToInput(profile.vehicleValueCents),
    depreciationPct: String(profile.depreciationAnnualPct).replace('.', ','),
    otherFixed: centsToInput(profile.otherFixedMonthlyCents),
    plannedKm: String(profile.plannedKmMonth),
  };
}

export function fieldsToProfile(fields: CostFields, ownership: Ownership, depreciationEnabled: boolean): CostProfile {
  return {
    ownership,
    fuelPriceCents: centsOrZero(fields.fuelPrice),
    consumptionKmPerUnit: decimalOrZero(fields.consumption),
    oilChangeCents: centsOrZero(fields.oilChange),
    oilIntervalKm: decimalOrZero(fields.oilInterval),
    tiresCents: centsOrZero(fields.tires),
    tiresLifeKm: decimalOrZero(fields.tiresLife),
    maintenanceMonthlyCents: centsOrZero(fields.maintenance),
    insuranceMonthlyCents: centsOrZero(fields.insurance),
    ipvaYearlyCents: centsOrZero(fields.ipva),
    licensingYearlyCents: centsOrZero(fields.licensing),
    paymentMonthlyCents: centsOrZero(fields.payment),
    vehicleValueCents: centsOrZero(fields.vehicleValue),
    depreciationAnnualPct: decimalOrZero(fields.depreciationPct),
    depreciationEnabled,
    otherFixedMonthlyCents: centsOrZero(fields.otherFixed),
    plannedKmMonth: decimalOrZero(fields.plannedKm),
  };
}

const MAX_FUEL_PRICE_CENTS = 5000;

export function validateProfile(profile: CostProfile): string | null {
  if (profile.consumptionKmPerUnit <= 0) return 'Informe o consumo do veículo.';
  if (profile.plannedKmMonth <= 0) return 'Informe quantos km você roda por mês.';
  if (profile.fuelPriceCents <= 0) return 'Informe o preço do combustível.';
  if (profile.fuelPriceCents > MAX_FUEL_PRICE_CENTS) return 'Confira o preço do combustível. Use vírgula nos centavos, como 5,89.';
  return null;
}

export const CONSUMPTION_UNITS: Record<FuelType, string> = {
  gasoline: 'km/l',
  ethanol: 'km/l',
  diesel: 'km/l',
  cng: 'km/m³',
  electric: 'km/kWh',
};

export const FUEL_OPTIONS: { value: FuelType; label: string }[] = [
  { value: 'gasoline', label: 'Gasolina' },
  { value: 'ethanol', label: 'Etanol' },
  { value: 'cng', label: 'GNV' },
  { value: 'electric', label: 'Elétrico' },
];

export const KIND_OPTIONS: { value: VehicleKind; label: string }[] = [
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Moto' },
];

export const OWNERSHIP_OPTIONS: { value: Ownership; label: string }[] = [
  { value: 'owned', label: 'Quitado' },
  { value: 'financed', label: 'Financiado' },
  { value: 'rented', label: 'Alugado' },
];

export { defaultDepreciationEnabled, suggestedProfile };
