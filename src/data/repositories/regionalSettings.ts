import {
  CONSUMPTION_UNITS,
  DISTANCE_UNITS,
  isIsoWeekday,
  SavedRegional,
  SUPPORTED_LANGUAGES,
  SUPPORTED_MARKETS,
  SYSTEM,
  VOLUME_UNITS,
} from '@domain/regional/regional';
import { createSettingsRepository, SETTING_KEYS, SettingKey, settingsRepository } from './settingsRepository';

type Settings = ReturnType<typeof createSettingsRepository>;

const KEYS: { [K in keyof SavedRegional]: SettingKey } = {
  language: SETTING_KEYS.language,
  formatLocale: SETTING_KEYS.formatLocale,
  market: SETTING_KEYS.market,
  distanceUnit: SETTING_KEYS.distanceUnit,
  volumeUnit: SETTING_KEYS.volumeUnit,
  consumptionUnit: SETTING_KEYS.consumptionUnit,
  firstWeekday: SETTING_KEYS.firstWeekday,
};

const FIELDS: (keyof SavedRegional)[] = ['language', 'formatLocale', 'market', 'distanceUnit', 'volumeUnit', 'consumptionUnit', 'firstWeekday'];

const oneOf = async <T extends string>(settings: Settings, key: SettingKey, values: readonly T[]): Promise<T | null> => {
  const raw = await settings.get(key);
  return values.find((value) => value === raw) ?? null;
};

const chosen = (raw: string | null) => (raw === null || raw === SYSTEM ? null : raw);

const weekdayOf = (raw: string | null) => {
  const weekday = Number(raw);
  return raw !== null && isIsoWeekday(weekday) ? weekday : null;
};

export function createRegionalSettings(settings: Settings) {
  return {
    async load(): Promise<SavedRegional> {
      const [language, formatLocale, market, distanceUnit, volumeUnit, consumptionUnit, firstWeekday] = await Promise.all([
        oneOf(settings, KEYS.language, SUPPORTED_LANGUAGES),
        settings.get(KEYS.formatLocale),
        oneOf(settings, KEYS.market, SUPPORTED_MARKETS),
        oneOf(settings, KEYS.distanceUnit, DISTANCE_UNITS),
        oneOf(settings, KEYS.volumeUnit, VOLUME_UNITS),
        oneOf(settings, KEYS.consumptionUnit, CONSUMPTION_UNITS),
        settings.get(KEYS.firstWeekday),
      ]);
      return {
        language,
        formatLocale: chosen(formatLocale),
        market,
        distanceUnit,
        volumeUnit,
        consumptionUnit,
        firstWeekday: weekdayOf(firstWeekday),
      };
    },

    async save(changes: Partial<SavedRegional>): Promise<void> {
      for (const field of FIELDS) {
        const value = changes[field];
        if (value === undefined) continue;
        await (value === null ? settings.remove(KEYS[field]) : settings.set(KEYS[field], String(value)));
      }
    },
  };
}

export const regionalSettings = createRegionalSettings(settingsRepository);
