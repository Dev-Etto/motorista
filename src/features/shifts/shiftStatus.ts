import { copilot } from '@modules/copilot';

export type ShiftStatus = 'idle' | 'running' | 'paused';

export function shiftStatusNow(): ShiftStatus {
  const timer = copilot.getTimer();
  if (!timer.started) return 'idle';
  return timer.running ? 'running' : 'paused';
}
