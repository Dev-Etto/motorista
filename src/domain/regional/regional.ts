import { z } from 'zod';
import { CONSUMPTION_UNITS, type ConsumptionUnit, DISTANCE_UNITS, type DistanceUnit, VOLUME_UNITS, type VolumeUnit } from '@shared/utils/units';

export { CONSUMPTION_UNITS, DISTANCE_UNITS, VOLUME_UNITS };
export type { ConsumptionUnit, DistanceUnit, VolumeUnit };

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es'] as const;
export const SUPPORTED_MARKETS = ['BR'] as const;
export const HOUR_CYCLES = ['h12', 'h23'] as const;
export const SYSTEM = 'system';

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export type Market = (typeof SUPPORTED_MARKETS)[number];
export type HourCycle = (typeof HOUR_CYCLES)[number];
export type MeasurementSystem = 'metric' | 'us' | 'uk';

const ISO_MONDAY = 1;
const ISO_SUNDAY = 7;
const FALLBACK_LANGUAGE: Language = 'en';
const DEFAULT_MARKET: Market = 'BR';

export const MARKET_CURRENCY: Record<Market, string> = { BR: 'BRL' };
const KM_PER_LITER_REGIONS = new Set([
  'AR',
  'BO',
  'BR',
  'CL',
  'CO',
  'CR',
  'CU',
  'DO',
  'EC',
  'GT',
  'HN',
  'IN',
  'JP',
  'MX',
  'NI',
  'PA',
  'PE',
  'PR',
  'PY',
  'SV',
  'UY',
  'VE',
]);

const currencySchema = z.string().regex(/^[A-Z]{3}$/);
const weekdaySchema = z.number().int().min(ISO_MONDAY).max(ISO_SUNDAY);

export const regionalProfileSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES),
  formatLocale: z.string().min(2),
  market: z.enum(SUPPORTED_MARKETS),
  currency: currencySchema,
  distanceUnit: z.enum(DISTANCE_UNITS),
  volumeUnit: z.enum(VOLUME_UNITS),
  consumptionUnit: z.enum(CONSUMPTION_UNITS),
  firstWeekday: weekdaySchema,
  hourCycle: z.enum(HOUR_CYCLES),
});

export type RegionalProfile = z.infer<typeof regionalProfileSchema>;

export interface DeviceRegional {
  languageTags: string[];
  regionCode: string | null;
  currencyCode: string | null;
  measurementSystem: MeasurementSystem | null;
  firstWeekday: number | null;
  uses24hourClock: boolean | null;
}

export interface SavedRegional {
  language: Language | null;
  formatLocale: string | null;
  market: Market | null;
  distanceUnit: DistanceUnit | null;
  volumeUnit: VolumeUnit | null;
  consumptionUnit: ConsumptionUnit | null;
  firstWeekday: number | null;
}

export const EMPTY_SAVED_REGIONAL: SavedRegional = {
  language: null,
  formatLocale: null,
  market: null,
  distanceUnit: null,
  volumeUnit: null,
  consumptionUnit: null,
  firstWeekday: null,
};

export const LEGACY_REGIONAL: { [K in keyof SavedRegional]: NonNullable<SavedRegional[K]> } = {
  language: 'pt-BR',
  formatLocale: 'pt-BR',
  market: 'BR',
  distanceUnit: 'km',
  volumeUnit: 'L',
  consumptionUnit: 'km/L',
  firstWeekday: ISO_MONDAY,
};

const primarySubtag = (tag: string) => tag.split('-')[0]?.toLowerCase() ?? '';

const canonicalLocale = (tag: string): string | null => {
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? null;
  } catch {
    return null;
  }
};

export function matchLanguage(tags: string[]): Language {
  const exact = tags.map((tag) => SUPPORTED_LANGUAGES.find((language) => language.toLowerCase() === tag.toLowerCase())).find(Boolean);
  if (exact) return exact;

  const close = tags.map((tag) => SUPPORTED_LANGUAGES.find((language) => primarySubtag(language) === primarySubtag(tag))).find(Boolean);
  return close ?? FALLBACK_LANGUAGE;
}

export const isSameMarket = (a: Market, b: Market): boolean => a === b;

export const matchMarket = (regionCode: string | null): Market => SUPPORTED_MARKETS.find((market) => market === regionCode) ?? DEFAULT_MARKET;

const fromSundayBased = (weekday: number) => (weekday === 1 ? ISO_SUNDAY : weekday - 1);

const defaultFirstWeekday = (device: DeviceRegional) => (device.firstWeekday === null ? LEGACY_REGIONAL.firstWeekday : fromSundayBased(device.firstWeekday));

const defaultDistance = (system: MeasurementSystem | null): DistanceUnit => (system === 'us' || system === 'uk' ? 'mi' : 'km');

const defaultVolume = (system: MeasurementSystem | null): VolumeUnit => (system === 'us' ? 'gal' : 'L');

function defaultConsumption(device: DeviceRegional): ConsumptionUnit {
  if (device.measurementSystem === 'us') return 'mpg';
  if (device.regionCode === null || KM_PER_LITER_REGIONS.has(device.regionCode)) return 'km/L';
  return 'L/100km';
}

const defaultFormatLocale = (device: DeviceRegional, language: Language) =>
  device.languageTags.map(canonicalLocale).find((tag): tag is string => tag !== null) ?? language;

export function resolveRegionalProfile(device: DeviceRegional, saved: SavedRegional): RegionalProfile {
  const language = saved.language ?? (device.languageTags.length > 0 ? matchLanguage(device.languageTags) : LEGACY_REGIONAL.language);
  const market = saved.market ?? matchMarket(device.regionCode);

  return {
    language,
    formatLocale: (saved.formatLocale && canonicalLocale(saved.formatLocale)) ?? defaultFormatLocale(device, language),
    market,
    currency: MARKET_CURRENCY[market],
    distanceUnit: saved.distanceUnit ?? defaultDistance(device.measurementSystem),
    volumeUnit: saved.volumeUnit ?? defaultVolume(device.measurementSystem),
    consumptionUnit: saved.consumptionUnit ?? defaultConsumption(device),
    firstWeekday: saved.firstWeekday ?? defaultFirstWeekday(device),
    hourCycle: device.uses24hourClock === false ? 'h12' : 'h23',
  };
}

export const isIsoWeekday = (value: number) => weekdaySchema.safeParse(value).success;

export const FORMAT_LOCALE_CHOICES = ['pt-BR', 'pt-PT', 'en-US', 'en-GB', 'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE'] as const;
export const FIRST_WEEKDAY_CHOICES = [1, 7, 6] as const;

export function formatLocaleChoices(current: string): string[] {
  return [...new Set([current, ...FORMAT_LOCALE_CHOICES])];
}
