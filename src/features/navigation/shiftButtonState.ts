import type { TFunction } from 'i18next';
import { elapsedParts } from '@shared/utils/dates';

export type ShiftButtonState = 'idle' | 'running' | 'paused';

export const LONG_TIME_LENGTH = 6;

export function shiftButtonState(started: boolean, running: boolean): ShiftButtonState {
  if (!started) return 'idle';
  return running ? 'running' : 'paused';
}

export function spokenElapsed(elapsedMs: number, t: TFunction): string {
  const { hours, minutes, overDay } = elapsedParts(elapsedMs);
  if (overDay) return t('tabs.shiftButton.overDay');
  if (hours === 0 && minutes === 0) return t('tabs.shiftButton.lessThanMinute');

  const spokenHours = t('tabs.shiftButton.hours', { count: hours });
  const spokenMinutes = t('tabs.shiftButton.minutes', { count: minutes });
  if (hours === 0) return spokenMinutes;
  if (minutes === 0) return spokenHours;
  return t('tabs.shiftButton.hoursAndMinutes', { hours: spokenHours, minutes: spokenMinutes });
}
