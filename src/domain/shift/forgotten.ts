import { MS_PER_HOUR } from '@/shared/utils/time';

const FORGOTTEN_AFTER_HOURS = 14;
const FORGOTTEN_AFTER_MS = FORGOTTEN_AFTER_HOURS * MS_PER_HOUR;

export const isTimerForgotten = (running: boolean, elapsedMs: number) => running && elapsedMs >= FORGOTTEN_AFTER_MS;
