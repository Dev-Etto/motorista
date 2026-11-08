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

export type ReminderUrgency = 'overdue' | 'soon';

export const SOON_KM = 1000;
export const SOON_DAYS = 7;

export interface UrgencyInput {
  dueKm: number | null;
  dueDate: string | null;
  totalKm: number;
  today: string;
  soonDate: string;
}

export function reminderUrgency({ dueKm, dueDate, totalKm, today, soonDate }: UrgencyInput): ReminderUrgency | null {
  const kmLeft = dueKm === null ? null : dueKm - totalKm;
  if ((kmLeft !== null && kmLeft <= 0) || (dueDate !== null && dueDate < today)) return 'overdue';
  if ((kmLeft !== null && kmLeft <= SOON_KM) || (dueDate !== null && dueDate <= soonDate)) return 'soon';
  return null;
}
