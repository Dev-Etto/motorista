import * as TaskManager from 'expo-task-manager';
import type { LocationObject } from 'expo-location';
import { gpsSessionRepository } from '@/data/repositories/gpsSessionRepository';
import { accumulateGps, GpsPoint } from '@/domain/gps/gps';

export const GPS_TASK = 'shift-km-tracking';

const toPoint = (location: LocationObject): GpsPoint => ({
  lat: location.coords.latitude,
  lng: location.coords.longitude,
  accuracy: location.coords.accuracy,
  time: location.timestamp,
});

async function applyLocations(locations: LocationObject[]) {
  const session = await gpsSessionRepository.get();
  if (!session.running) return;

  const next = locations.map(toPoint).reduce(
    (state, point) => {
      const step = accumulateGps(state.lastPoint, point);
      return { meters: state.meters + step.meters, lastPoint: step.last };
    },
    { meters: session.meters, lastPoint: session.lastPoint },
  );
  await gpsSessionRepository.save({ ...next, running: true });
}

TaskManager.defineTask<{ locations: LocationObject[] }>(GPS_TASK, async ({ data, error }) => {
  if (error || !data) return;
  await applyLocations(data.locations);
});
