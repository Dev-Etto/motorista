export interface ShiftInput {
  grossCents: number;
  km: number | null;
  minutes: number;
  expensesCents: number;
  costPerKm: number;
}

export interface ShiftResult {
  grossCents: number;
  vehicleCostCents: number;
  expensesCents: number;
  profitCents: number;
  grossPerKm: number | null;
  grossPerHour: number | null;
  profitPerHour: number | null;
  partial: boolean;
}

export interface MonthCloseInput {
  grossCents: number;
  km: number;
  expensesCents: number;
  variableCents: number;
  fixedMonthlyCents: number;
}

const perHour = (cents: number, minutes: number): number | null => (minutes > 0 ? (cents / minutes) * 60 : null);

export function computeShift(shift: ShiftInput): ShiftResult {
  const km = shift.km !== null && shift.km > 0 ? shift.km : null;
  const vehicleCostCents = km === null ? 0 : km * shift.costPerKm;
  const profitCents = shift.grossCents - vehicleCostCents - shift.expensesCents;

  return {
    grossCents: shift.grossCents,
    vehicleCostCents,
    expensesCents: shift.expensesCents,
    profitCents,
    grossPerKm: km === null ? null : shift.grossCents / km,
    grossPerHour: perHour(shift.grossCents, shift.minutes),
    profitPerHour: perHour(profitCents, shift.minutes),
    partial: km === null || shift.costPerKm <= 0,
  };
}

export function computeMonthClose(month: MonthCloseInput) {
  return {
    variableCents: month.variableCents,
    fixedCents: month.fixedMonthlyCents,
    expensesCents: month.expensesCents,
    profitCents: month.grossCents - month.variableCents - month.fixedMonthlyCents - month.expensesCents,
    realCostPerKm: month.km > 0 ? (month.variableCents + month.fixedMonthlyCents) / month.km : null,
  };
}
