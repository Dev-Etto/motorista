import { MS_PER_HOUR, MS_PER_MINUTE } from '@shared/utils/time';

const FORGOTTEN_AFTER_HOURS = 14;
const FORGOTTEN_AFTER_MS = FORGOTTEN_AFTER_HOURS * MS_PER_HOUR;

export const DEFAULT_PLANNED_HOURS = 8;

export const isTimerForgotten = (running: boolean, elapsedMs: number) => running && elapsedMs >= FORGOTTEN_AFTER_MS;

export const isShiftForgotten = (started: boolean, elapsedMs: number) => started && elapsedMs >= FORGOTTEN_AFTER_MS;

export const suggestedStopAt = (startedAt: number, plannedHours: number | null) => startedAt + (plannedHours ?? DEFAULT_PLANNED_HOURS) * MS_PER_HOUR;

export const minutesUntil = (startedAt: number, stopAt: number) => Math.max(0, Math.round((stopAt - startedAt) / MS_PER_MINUTE));
