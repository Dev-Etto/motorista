import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gpsSessionRepository } from '@data/repositories/gpsSessionRepository';
import { useInterval } from '@shared/hooks/useInterval';
import { useFormat } from '@shared/i18n/format';
import {
  ensureLocation,
  isTrackingInBackground,
  locationPermissionMessage,
  readGpsProblem,
  startBackgroundTracking,
  stopBackgroundTracking,
} from '@shared/platform/location';
import { reportError } from '@shared/utils/reportError';
import { GPS_TASK } from './gpsTask';

const METERS_PER_KM = 1000;
const REFRESH_MS = 3000;
const DISTANCE_INTERVAL_M = 25;
const TIME_INTERVAL_MS = 5000;

export function useGpsTracking() {
  const { t } = useTranslation('shifts');
  const { distanceUnit } = useFormat();
  const [running, setRunning] = useState(false);
  const [meters, setMeters] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const session = await gpsSessionRepository.get();
    setMeters(session.meters);
    if (!session.running) return setRunning(false);

    const problem = (await readGpsProblem()) ?? ((await isTrackingInBackground(GPS_TASK)) ? null : t('gps.stopped', { context: distanceUnit }));
    setRunning(problem === null);
    if (problem === null) return;

    setError(problem);
    await gpsSessionRepository.stop();
  }, [t, distanceUnit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useInterval(() => void refresh(), running ? REFRESH_MS : null);

  const start = async () => {
    setError(null);
    try {
      if (!(await ensureLocation())) return setError(locationPermissionMessage());

      const problem = await readGpsProblem();
      if (problem) return setError(problem);

      await startBackgroundTracking(GPS_TASK, {
        distanceInterval: DISTANCE_INTERVAL_M,
        timeInterval: TIME_INTERVAL_MS,
        notification: { title: t('gps.notificationTitle', { context: distanceUnit }), body: t('gps.notificationBody') },
      });
    } catch (error) {
      reportError(error);
      return setError(t('gps.startError'));
    }
    await gpsSessionRepository.start();
    await refresh();
  };

  const pause = async () => {
    await stopBackgroundTracking(GPS_TASK);
    await gpsSessionRepository.stop();
    const session = await gpsSessionRepository.get();
    await refresh();
    return session.meters / METERS_PER_KM;
  };

  const reset = async () => {
    await stopBackgroundTracking(GPS_TASK);
    await gpsSessionRepository.reset();
    await refresh();
  };

  return { running, km: meters / METERS_PER_KM, error, start, pause, reset };
}
