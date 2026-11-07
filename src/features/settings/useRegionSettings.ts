import { regionalStore } from '@application/regional';
import { useRegional } from '@application/useRegional';
import { shiftRepository } from '@data/repositories/shiftRepository';
import {
  ConsumptionUnit,
  DistanceUnit,
  EMPTY_SAVED_REGIONAL,
  formatLocaleChoices,
  Language,
  Market,
  MARKET_CURRENCY,
  resolveRegionalProfile,
  SUPPORTED_LANGUAGES,
  SUPPORTED_MARKETS,
  VolumeUnit,
} from '@domain/regional/regional';
import { readDeviceLocale } from '@shared/platform/locale';

export function useRegionSettings() {
  const profile = useRegional();
  const saved = regionalStore.saved();
  const device = readDeviceLocale();
  const automatic = resolveRegionalProfile(device, EMPTY_SAVED_REGIONAL);

  return {
    profile,
    languages: SUPPORTED_LANGUAGES,
    formatLocales: formatLocaleChoices(profile.formatLocale),
    automatic,
    markets: SUPPORTED_MARKETS,
    currencyOf: (market: Market) => MARKET_CURRENCY[market],
    followsDeviceLanguage: saved.language === null,
    followsDeviceFormat: saved.formatLocale === null,
    chooseLanguage: (language: Language | null) => regionalStore.chooseLanguage(language),
    chooseFormat: (formatLocale: string | null) => regionalStore.update({ formatLocale }),
    chooseMarket: (market: Market) => regionalStore.update({ market }),
    chooseDistance: (distanceUnit: DistanceUnit) => regionalStore.update({ distanceUnit }),
    chooseVolume: (volumeUnit: VolumeUnit) => regionalStore.update({ volumeUnit }),
    chooseConsumption: (consumptionUnit: ConsumptionUnit) => regionalStore.update({ consumptionUnit }),
    chooseFirstWeekday: (firstWeekday: number) => regionalStore.update({ firstWeekday }),
    hasSavedData: async () => (await shiftRepository.usageStats()).total > 0,
  };
}
