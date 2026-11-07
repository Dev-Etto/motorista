export interface KmReminder {
  dueKm: number | null;
  done: boolean;
}

export function isDueByKm(reminder: KmReminder, totalKm: number): boolean {
  if (reminder.done || reminder.dueKm === null) return false;
  return totalKm >= reminder.dueKm;
}

export function kmRemaining(dueKm: number, totalKm: number): number {
  return Math.max(0, dueKm - totalKm);
}
