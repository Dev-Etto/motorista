const FORGOTTEN_AFTER_MS = 14 * 60 * 60 * 1000;

export const isTimerForgotten = (running: boolean, elapsedMs: number) => running && elapsedMs >= FORGOTTEN_AFTER_MS;
