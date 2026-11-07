import { useEffect, useState } from 'react';
import { z } from 'zod';
import { syncCopilotTargets } from '@application/offerSettings';
import { releaseShiftVehicle, shiftVehicle } from '@application/vehicleInUse';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { reportError } from '@shared/utils/reportError';
import { useGpsTracking } from './useGpsTracking';
import { useShiftTimer } from './useShiftTimer';

export function useLiveTracking(onApply: (minutes: number, startedAt: number, km: number) => void) {
  const timer = useShiftTimer();
  const gps = useGpsTracking();
  const [measureKm, setMeasureKm] = useState(true);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    settingsRepository.getJson(SETTING_KEYS.gpsMeasureKm, z.boolean(), true).then(setMeasureKm, reportError);
  }, []);

  const start = async () => {
    setApplied(false);
    timer.start();
    await shiftVehicle();
    if (measureKm) await gps.start();
  };

  const pause = async () => {
    timer.pause();
    await gps.pause();
  };

  const toggleMeasureKm = async (value: boolean) => {
    setMeasureKm(value);
    await settingsRepository.setJson(SETTING_KEYS.gpsMeasureKm, value);
    if (!timer.running) return;

    if (value) await gps.start();
    if (!value) await gps.pause();
  };

  const apply = async () => {
    timer.pause();
    const km = await gps.pause();
    onApply(timer.minutes, timer.startedAt, km);
    setApplied(true);
  };

  const discard = async () => {
    timer.reset();
    await gps.reset();
    await releaseShiftVehicle();
    await syncCopilotTargets();
    setApplied(false);
  };

  return {
    elapsedMs: timer.elapsedMs,
    running: timer.running,
    started: timer.started,
    startedAt: timer.startedAt,
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
