import * as Location from 'expo-location';
import { i18n } from '@shared/i18n';
import { currentFormat } from '@shared/i18n/format';

export type { LocationObject } from 'expo-location';

export interface BackgroundTracking {
  distanceInterval: number;
  timeInterval: number;
  notification: { title: string; body: string };
}

export const locationPermissionMessage = () => i18n.t('location.permissionNeeded', { context: currentFormat().distanceUnit });
const servicesMessage = () => i18n.t('location.servicesOff', { context: currentFormat().distanceUnit });

export async function ensureLocation(): Promise<boolean> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  return granted;
}

export async function hasLocationPermission(): Promise<boolean> {
  const { granted } = await Location.getForegroundPermissionsAsync();
  return granted;
}

export async function readGpsProblem(): Promise<string | null> {
  const [granted, servicesEnabled] = await Promise.all([hasLocationPermission(), Location.hasServicesEnabledAsync()]);
  if (!granted) return locationPermissionMessage();
  return servicesEnabled ? null : servicesMessage();
}

export function startBackgroundTracking(task: string, tracking: BackgroundTracking): Promise<void> {
  return Location.startLocationUpdatesAsync(task, {
    accuracy: Location.Accuracy.High,
    distanceInterval: tracking.distanceInterval,
    timeInterval: tracking.timeInterval,
    foregroundService: { notificationTitle: tracking.notification.title, notificationBody: tracking.notification.body },
  });
}

export function isTrackingInBackground(task: string): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(task);
}

export async function stopBackgroundTracking(task: string): Promise<void> {
  if (await isTrackingInBackground(task)) await Location.stopLocationUpdatesAsync(task);
}
