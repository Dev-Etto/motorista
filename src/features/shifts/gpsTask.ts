import * as TaskManager from 'expo-task-manager';
import { copilot } from '@modules/copilot';
import { gpsSessionRepository } from '@/data/repositories/gpsSessionRepository';
import { accumulateGps, GpsPoint } from '@/domain/gps/gps';
import type { LocationObject } from '@/shared/platform/location';

export const GPS_TASK = 'shift-km-tracking';

const toPoint = (location: LocationObject): GpsPoint => ({
  lat: location.coords.latitude,
  lng: location.coords.longitude,
  accuracy: location.coords.accuracy,
  time: location.timestamp,
});

export async function applyLocations(locations: LocationObject[]) {
  const session = await gpsSessionRepository.get();
  if (!session.running) return;
  if (!copilot.getTimer().running) return gpsSessionRepository.recordProgress(session.cycle, session.meters, null);

  const next = locations.map(toPoint).reduce(
    (state, point) => {
      const step = accumulateGps(state.lastPoint, point);
      return { meters: state.meters + step.meters, lastPoint: step.last };
    },
    { meters: session.meters, lastPoint: session.lastPoint },
  );
  await gpsSessionRepository.recordProgress(session.cycle, next.meters, next.lastPoint);
}

TaskManager.defineTask<{ locations: LocationObject[] }>(GPS_TASK, async ({ data, error }) => {
  if (error || !data) return;
  await applyLocations(data.locations);
});
