import { z } from 'zod';
import { MONTHS_PER_YEAR } from '@shared/utils/time';

export type VehicleKind = 'car' | 'motorcycle';
export type FuelType = 'gasoline' | 'ethanol' | 'diesel' | 'cng' | 'electric';

const amount = z.number().nonnegative();
const PERCENT = 100;

export const costProfileSchema = z.object({
  ownership: z.enum(['owned', 'financed', 'rented']),
  fuelPriceCents: amount,
  consumptionKmPerUnit: amount,
  oilChangeCents: amount,
  oilIntervalKm: amount,
  tiresCents: amount,
  tiresLifeKm: amount,
  maintenanceMonthlyCents: amount,
  insuranceMonthlyCents: amount,
  ipvaYearlyCents: amount,
  licensingYearlyCents: amount,
  paymentMonthlyCents: amount,
  vehicleValueCents: amount,
  depreciationAnnualPct: amount,
  depreciationEnabled: z.boolean(),
  otherFixedMonthlyCents: amount,
  plannedKmMonth: amount,
});

export type CostProfile = z.infer<typeof costProfileSchema>;
export type Ownership = CostProfile['ownership'];

export interface CostBreakdown {
  fuelPerKm: number;
  oilPerKm: number;
  tiresPerKm: number;
  maintenancePerKm: number;
  variablePerKm: number;
  insuranceMonthly: number;
  taxesMonthly: number;
  paymentMonthly: number;
  depreciationMonthly: number;
  otherFixedMonthly: number;
  fixedMonthly: number;
  fixedPerKm: number;
  fullPerKm: number;
}

export function defaultDepreciationEnabled(ownership: Ownership): boolean {
  return ownership === 'owned';
}

function safeDivide(value: number, by: number): number {
  return by > 0 ? value / by : 0;
}

export function computeCosts(p: CostProfile): CostBreakdown {
  const fuelPerKm = safeDivide(p.fuelPriceCents, p.consumptionKmPerUnit);
  const oilPerKm = safeDivide(p.oilChangeCents, p.oilIntervalKm);
  const tiresPerKm = safeDivide(p.tiresCents, p.tiresLifeKm);
  const maintenancePerKm = safeDivide(p.maintenanceMonthlyCents, p.plannedKmMonth);
  const variablePerKm = fuelPerKm + oilPerKm + tiresPerKm + maintenancePerKm;

  const taxesMonthly = (p.ipvaYearlyCents + p.licensingYearlyCents) / MONTHS_PER_YEAR;
  const depreciates = p.depreciationEnabled && p.ownership !== 'rented';
  const depreciationMonthly = depreciates ? (p.vehicleValueCents * (p.depreciationAnnualPct / PERCENT)) / MONTHS_PER_YEAR : 0;
  const paymentMonthly = p.ownership === 'owned' ? 0 : p.paymentMonthlyCents;
  const fixedMonthly = p.insuranceMonthlyCents + taxesMonthly + paymentMonthly + depreciationMonthly + p.otherFixedMonthlyCents;
  const fixedPerKm = safeDivide(fixedMonthly, p.plannedKmMonth);

  return {
    fuelPerKm,
    oilPerKm,
    tiresPerKm,
    maintenancePerKm,
    variablePerKm,
    insuranceMonthly: p.insuranceMonthlyCents,
    taxesMonthly,
    paymentMonthly,
    depreciationMonthly,
    otherFixedMonthly: p.otherFixedMonthlyCents,
    fixedMonthly,
    fixedPerKm,
    fullPerKm: variablePerKm + fixedPerKm,
  };
}

const FUEL_SUGGESTIONS: Record<FuelType, { priceCents: number; car: number; motorcycle: number }> = {
  gasoline: { priceCents: 600, car: 11, motorcycle: 30 },
  ethanol: { priceCents: 420, car: 8, motorcycle: 21 },
  diesel: { priceCents: 620, car: 13, motorcycle: 30 },
  cng: { priceCents: 480, car: 13, motorcycle: 30 },
  electric: { priceCents: 95, car: 6.5, motorcycle: 25 },
};

export function suggestedFuel(kind: VehicleKind, fuel: FuelType): Pick<CostProfile, 'fuelPriceCents' | 'consumptionKmPerUnit'> {
  const suggestion = FUEL_SUGGESTIONS[fuel];
  return { fuelPriceCents: suggestion.priceCents, consumptionKmPerUnit: suggestion[kind] };
}

export function suggestedProfile(kind: VehicleKind, ownership: Ownership, fuel: FuelType = 'gasoline'): CostProfile {
  const isCar = kind === 'car';
  return {
    ownership,
    ...suggestedFuel(kind, fuel),
    oilChangeCents: isCar ? 25000 : 6000,
    oilIntervalKm: isCar ? 10000 : 3000,
    tiresCents: isCar ? 200000 : 60000,
    tiresLifeKm: isCar ? 50000 : 20000,
    maintenanceMonthlyCents: isCar ? 30000 : 10000,
    insuranceMonthlyCents: 0,
    ipvaYearlyCents: 0,
    licensingYearlyCents: 0,
    paymentMonthlyCents: 0,
    vehicleValueCents: 0,
    depreciationAnnualPct: 10,
    depreciationEnabled: defaultDepreciationEnabled(ownership),
    otherFixedMonthlyCents: 0,
    plannedKmMonth: 4000,
  };
}
