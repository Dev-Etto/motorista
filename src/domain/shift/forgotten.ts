import { MS_PER_HOUR, MS_PER_MINUTE } from '@shared/utils/time';

const FORGOTTEN_AFTER_HOURS = 14;
const FORGOTTEN_AFTER_MS = FORGOTTEN_AFTER_HOURS * MS_PER_HOUR;

export const DEFAULT_PLANNED_HOURS = 8;

export const isShiftForgotten = (started: boolean, elapsedMs: number) => started && elapsedMs >= FORGOTTEN_AFTER_MS;

export const suggestedStopAt = (startedAt: number, plannedHours: number | null) => startedAt + (plannedHours ?? DEFAULT_PLANNED_HOURS) * MS_PER_HOUR;

export interface TimerSnapshot {
  startedAt: number;
  elapsedMs: number;
  running: boolean;
}

export function workedMinutesUntil(timer: TimerSnapshot, stopAt: number, now: number): number {
  const sinceStart = Math.max(0, stopAt - timer.startedAt);
  const worked = timer.running ? timer.elapsedMs - Math.max(0, now - stopAt) : Math.min(timer.elapsedMs, sinceStart);
  return Math.round(Math.min(Math.max(0, worked), sinceStart) / MS_PER_MINUTE);
}
