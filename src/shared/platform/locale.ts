import { getCalendars, getLocales } from 'expo-localization';
import { AppState } from 'react-native';

export interface DeviceLocale {
  languageTags: string[];
  regionCode: string | null;
  currencyCode: string | null;
  measurementSystem: 'metric' | 'us' | 'uk' | null;
  firstWeekday: number | null;
  uses24hourClock: boolean | null;
}

export function readDeviceLocale(): DeviceLocale {
  const locales = getLocales();
  const [primary] = locales;
  const [calendar] = getCalendars();
  return {
    languageTags: locales.map((locale) => locale.languageTag),
    regionCode: primary.regionCode,
    currencyCode: primary.currencyCode,
    measurementSystem: primary.measurementSystem,
    firstWeekday: calendar.firstWeekday,
    uses24hourClock: calendar.uses24hourClock,
  };
}

export function onDeviceLocaleMaybeChanged(listener: () => void): () => void {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') listener();
  });
  return () => subscription.remove();
}
