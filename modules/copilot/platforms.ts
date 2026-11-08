import catalog from './rideApps.json';

export type RideAppKey = 'uber' | 'ninetyNine' | 'inDrive';

export interface RideApp {
  key: RideAppKey;
  packageName: string;
  label: string;
  background: string;
  text: string;
}

export const RIDE_APPS = catalog as RideApp[];

export const PLATFORM_PACKAGES = Object.fromEntries(RIDE_APPS.map((app) => [app.key, app.packageName])) as Record<RideAppKey, string>;

export const rideAppByLabel = (label: string): RideApp | undefined => RIDE_APPS.find((app) => app.label === label);
