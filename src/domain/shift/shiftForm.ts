import { HOURS_PER_DAY, MINUTES_PER_HOUR } from '@shared/utils/time';

export const MAX_SHIFT_MINUTES = HOURS_PER_DAY * MINUTES_PER_HOUR;

export type KmEntryMode = 'manual' | 'odometer';

export type ShiftFormError = 'invalid-number' | 'invalid-hours' | 'invalid-start-hour' | 'too-long' | 'no-earnings' | 'odometer-order';

export type ShiftFormField = 'hours' | 'startHour' | 'odometerEnd';

const FIELD_OF_ERROR: Partial<Record<ShiftFormError, ShiftFormField>> = {
  'invalid-hours': 'hours',
  'too-long': 'hours',
  'invalid-start-hour': 'startHour',
  'odometer-order': 'odometerEnd',
};

export const fieldOfError = (error: ShiftFormError): ShiftFormField | null => FIELD_OF_ERROR[error] ?? null;

export interface KmEntry {
  mode: KmEntryMode;
  km: number | null;
  odometerStart: number | null;
  odometerEnd: number | null;
}

export interface ShiftFormCheck {
  hasInvalidNumber: boolean;
  hasInvalidHours: boolean;
  hasInvalidHour: boolean;
  minutes: number;
  grossCents: number;
  kmMode: KmEntryMode;
  km: number | null;
  odometerTyped: boolean;
}

export function kmFromEntry(entry: KmEntry): number | null {
  if (entry.mode === 'manual') return entry.km;

  const { odometerStart: start, odometerEnd: end } = entry;
  if (start === null || end === null || end < start) return null;
  return end - start;
}

export function validateShiftForm(check: ShiftFormCheck): ShiftFormError | null {
  if (check.hasInvalidHours) return 'invalid-hours';
  if (check.hasInvalidNumber) return 'invalid-number';
  if (check.hasInvalidHour) return 'invalid-start-hour';
  if (check.minutes > MAX_SHIFT_MINUTES) return 'too-long';
  if (check.grossCents <= 0) return 'no-earnings';
  if (check.kmMode === 'odometer' && check.km === null && check.odometerTyped) return 'odometer-order';
  return null;
}
