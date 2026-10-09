export interface GpsPoint {
  lat: number;
  lng: number;
  accuracy: number | null;
  time: number;
}

const EARTH_RADIUS_M = 6371000;
const MAX_ACCURACY_M = 50;
const MIN_STEP_M = 15;
const MAX_SPEED_MS = 70;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceMeters(from: GpsPoint, to: GpsPoint): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function accumulateGps(last: GpsPoint | null, next: GpsPoint): { meters: number; last: GpsPoint | null } {
  if (next.accuracy !== null && next.accuracy > MAX_ACCURACY_M) return { meters: 0, last };
  if (!last) return { meters: 0, last: next };

  const seconds = (next.time - last.time) / 1000;
  if (seconds <= 0) return { meters: 0, last };

  const meters = distanceMeters(last, next);
  if (meters < MIN_STEP_M) return { meters: 0, last };
  if (meters / seconds > MAX_SPEED_MS) return { meters: 0, last: next };

  return { meters, last: next };
}
