import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { gpsSessionRepository } from '@/data/repositories/gpsSessionRepository';
import { useInterval } from '@/shared/hooks/useInterval';
import { readGpsProblem } from './gpsStatus';
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

    const problem = (await readGpsProblem()) ?? ((await Location.hasStartedLocationUpdatesAsync(GPS_TASK)) ? null : STOPPED_ERROR);
    setRunning(problem === null);
    if (problem === null) return;

    setError(problem);
    await gpsSessionRepository.save({ meters: session.meters, lastPoint: null, running: false });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useInterval(() => void refresh(), running ? REFRESH_MS : null);

  const start = async () => {
    setError(null);
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return setError('Permita a localização para medir os km por GPS.');

    const problem = await readGpsProblem();
    if (problem) return setError(problem);

    const session = await gpsSessionRepository.get();
    try {
      await Location.startLocationUpdatesAsync(GPS_TASK, {
        accuracy: Location.Accuracy.High,
        distanceInterval: DISTANCE_INTERVAL_M,
        timeInterval: TIME_INTERVAL_MS,
        foregroundService: {
          notificationTitle: 'Medindo os km da jornada',
          notificationBody: 'A posição fica só no aparelho. Pause em deslocamentos pessoais.',
        },
      });
    } catch {
      return setError(START_ERROR);
    }
    await gpsSessionRepository.save({ meters: session.meters, lastPoint: null, running: true });
    await refresh();
  };

  const stopUpdates = async () => {
    const active = await Location.hasStartedLocationUpdatesAsync(GPS_TASK);
    if (active) await Location.stopLocationUpdatesAsync(GPS_TASK);
  };

  const pause = async () => {
    await stopUpdates();
    const session = await gpsSessionRepository.get();
    await gpsSessionRepository.save({ meters: session.meters, lastPoint: null, running: false });
    await refresh();
    return session.meters / METERS_PER_KM;
  };

  const reset = async () => {
    await stopUpdates();
    await gpsSessionRepository.save({ meters: 0, lastPoint: null, running: false });
    await refresh();
  };

  return { running, km: meters / METERS_PER_KM, error, start, pause, reset };
}
