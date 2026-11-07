export interface KmReminder {
  dueKm: number | null;
  done: boolean;
}

export interface KmTotals {
  all: number;
  byVehicle: Record<number, number>;
}

export const kmFor = (vehicleId: number | null, totals: KmTotals) => (vehicleId === null ? totals.all : (totals.byVehicle[vehicleId] ?? 0));

export function isDueByKm(reminder: KmReminder, totalKm: number): boolean {
  if (reminder.done || reminder.dueKm === null) return false;
  return totalKm >= reminder.dueKm;
}

export function kmRemaining(dueKm: number, totalKm: number): number {
  return Math.max(0, dueKm - totalKm);
}
