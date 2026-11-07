import { useCallback, useState } from 'react';
import { copilot, TimerState } from '@modules/copilot';
import { useInterval } from '@shared/hooks/useInterval';
import { MS_PER_MINUTE } from '@shared/utils/time';

const TICK_MS = 1000;

export function useShiftTimer() {
  const [state, setState] = useState<TimerState>(() => copilot.getTimer());

  useInterval(() => {
    setState((current) => {
      const next = copilot.getTimer();
      return next.started || current.started ? next : current;
    });
  }, TICK_MS);

  const start = useCallback(() => setState(copilot.startTimer()), []);
  const pause = useCallback(() => setState(copilot.pauseTimer()), []);
  const reset = useCallback(() => setState(copilot.resetTimer()), []);

  return { ...state, minutes: Math.round(state.elapsedMs / MS_PER_MINUTE), start, pause, reset };
}
