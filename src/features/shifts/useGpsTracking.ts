import { useCallback, useEffect, useState } from 'react';
import { gpsSessionRepository } from '@/data/repositories/gpsSessionRepository';
import { useInterval } from '@/shared/hooks/useInterval';
import {
  ensureLocation,
  isTrackingInBackground,
  LOCATION_PERMISSION_MESSAGE,
  readGpsProblem,
  startBackgroundTracking,
  stopBackgroundTracking,
} from '@/shared/platform/location';
import { GPS_TASK } from './gpsTask';

const METERS_PER_KM = 1000;
const REFRESH_MS = 3000;
const DISTANCE_INTERVAL_M = 25;
const TIME_INTERVAL_MS = 5000;
const START_ERROR = 'Não foi possível iniciar o GPS. Confira a localização do celular e tente de novo.';
const STOPPED_ERROR = 'A medição de km parou. Ligue o GPS de novo para continuar.';

export function useGpsTracking() {
  const [running, setRunning] = useState(false);
  const [meters, setMeters] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const session = await gpsSessionRepository.get();
    setMeters(session.meters);
    if (!session.running) return setRunning(false);

    const problem = (await readGpsProblem()) ?? ((await isTrackingInBackground(GPS_TASK)) ? null : STOPPED_ERROR);
    setRunning(problem === null);
    if (problem === null) return;

    setError(problem);
    await gpsSessionRepository.stop();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useInterval(() => void refresh(), running ? REFRESH_MS : null);

  const start = async () => {
    setError(null);
    try {
      if (!(await ensureLocation())) return setError(LOCATION_PERMISSION_MESSAGE);

      const problem = await readGpsProblem();
      if (problem) return setError(problem);

      await startBackgroundTracking(GPS_TASK, {
        distanceInterval: DISTANCE_INTERVAL_M,
        timeInterval: TIME_INTERVAL_MS,
        notification: { title: 'Medindo os km da jornada', body: 'A posição fica só no aparelho. Pause em deslocamentos pessoais.' },
      });
    } catch {
      return setError(START_ERROR);
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
