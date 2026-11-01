import { useState } from 'react';
import { useGpsTracking } from './useGpsTracking';
import { useShiftTimer } from './useShiftTimer';

export function useLiveTracking(onApply: (minutes: number, startedAt: number, km: number) => void) {
  const timer = useShiftTimer();
  const gps = useGpsTracking();
  const [measureKm, setMeasureKm] = useState(true);
  const [applied, setApplied] = useState(false);

  const start = async () => {
    setApplied(false);
    timer.start();
    if (measureKm) await gps.start();
  };

  const pause = async () => {
    timer.pause();
    await gps.pause();
  };

  const toggleMeasureKm = async (value: boolean) => {
    setMeasureKm(value);
    if (!timer.running) return;

    if (value) await gps.start();
    if (!value) await gps.pause();
  };

  const apply = async () => {
    timer.pause();
    await gps.pause();
    onApply(timer.minutes, timer.startedAt, gps.km);
    setApplied(true);
  };

  const discard = async () => {
    timer.reset();
    await gps.reset();
    setApplied(false);
  };

  return {
    elapsedMs: timer.elapsedMs,
    running: timer.running,
    started: timer.started,
    km: gps.km,
    gpsError: gps.error,
    measureKm: timer.running ? gps.running : measureKm,
    applied,
    pending: timer.started && !applied,
    toggleMeasureKm,
    start,
    pause,
    apply,
    discard,
  };
}

export type LiveTrackingState = ReturnType<typeof useLiveTracking>;
