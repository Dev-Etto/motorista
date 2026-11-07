export const DISTANCE_UNITS = ['km', 'mi'] as const;
export const VOLUME_UNITS = ['L', 'gal'] as const;
export const CONSUMPTION_UNITS = ['km/L', 'L/100km', 'mpg'] as const;

export type DistanceUnit = (typeof DISTANCE_UNITS)[number];
export type VolumeUnit = (typeof VOLUME_UNITS)[number];
export type ConsumptionUnit = (typeof CONSUMPTION_UNITS)[number];

export const KM_PER_MILE = 1.609344;
export const LITERS_PER_GALLON = 3.785411784;
const HUNDRED_KM = 100;

const kmPerDistance = (unit: DistanceUnit) => (unit === 'mi' ? KM_PER_MILE : 1);
const litersPerVolume = (unit: VolumeUnit) => (unit === 'gal' ? LITERS_PER_GALLON : 1);

export const kmToDistance = (km: number, unit: DistanceUnit) => km / kmPerDistance(unit);
export const distanceToKm = (distance: number, unit: DistanceUnit) => distance * kmPerDistance(unit);

export const perKmToPerDistance = (perKm: number, unit: DistanceUnit) => perKm * kmPerDistance(unit);
export const perDistanceToPerKm = (perDistance: number, unit: DistanceUnit) => perDistance / kmPerDistance(unit);

export const litersToVolume = (liters: number, unit: VolumeUnit) => liters / litersPerVolume(unit);
export const volumeToLiters = (volume: number, unit: VolumeUnit) => volume * litersPerVolume(unit);

export const perLiterToPerVolume = (perLiter: number, unit: VolumeUnit) => perLiter * litersPerVolume(unit);
export const perVolumeToPerLiter = (perVolume: number, unit: VolumeUnit) => perVolume / litersPerVolume(unit);

export function kmPerLiterToConsumption(kmPerLiter: number, unit: ConsumptionUnit): number {
  if (kmPerLiter <= 0) return 0;
  if (unit === 'L/100km') return HUNDRED_KM / kmPerLiter;
  if (unit === 'mpg') return (kmPerLiter * LITERS_PER_GALLON) / KM_PER_MILE;
  return kmPerLiter;
}

export function consumptionToKmPerLiter(consumption: number, unit: ConsumptionUnit): number {
  if (consumption <= 0) return 0;
  if (unit === 'L/100km') return HUNDRED_KM / consumption;
  if (unit === 'mpg') return (consumption * KM_PER_MILE) / LITERS_PER_GALLON;
  return consumption;
}
