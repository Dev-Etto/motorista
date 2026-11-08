import { useSyncExternalStore } from 'react';
import {
  formatClock,
  formatDate,
  formatDayMonth,
  formatDayOfMonth,
  formatDuration,
  formatHourOfDay,
  formatLongDay,
  formatMonth,
  formatMonthShort,
  HourCycle,
  weekBounds,
  weekdaysFrom,
} from '@shared/utils/dates';
import { PLACEHOLDER } from '@shared/utils/format';
import { currencySymbolOf, fractionDigitsOf, Money, MoneyFormat } from '@shared/utils/money';
import { decimalToInput, formatNumber, formatPercent } from '@shared/utils/numbers';
import { centsOrNull, centsOrZero, decimalOrNull, decimalOrZero, hasInvalidHour, hasInvalidNumber, intOrNull, parseHours } from '@shared/utils/parse';
import {
  ConsumptionUnit,
  consumptionToKmPerLiter,
  DistanceUnit,
  distanceToKm,
  kmPerLiterToConsumption,
  kmToDistance,
  litersToVolume,
  perDistanceToPerKm,
  perKmToPerDistance,
  perLiterToPerVolume,
  perVolumeToPerLiter,
  VolumeUnit,
  volumeToLiters,
} from '@shared/utils/units';
import { i18n } from '.';

export interface RegionalFormat {
  language: string;
  locale: string;
  currency: string;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  consumptionUnit: ConsumptionUnit;
  firstWeekday: number;
  hourCycle: HourCycle;
}

export const DEFAULT_FORMAT: RegionalFormat = {
  language: 'pt-BR',
  locale: 'pt-BR',
  currency: 'BRL',
  distanceUnit: 'km',
  volumeUnit: 'L',
  consumptionUnit: 'km/L',
  firstWeekday: 1,
  hourCycle: 'h23',
};

const HOUR = 'h';

export function createFormatter(format: RegionalFormat) {
  const { locale, distanceUnit, volumeUnit, consumptionUnit } = format;
  const spec: MoneyFormat = { locale, currency: format.currency };
  const money = (cents: number) => Money.fromCents(cents).format(spec);
  const per = (amount: string, unit: string) => i18n.t('perUnit', { amount, unit });

  return {
    profile: format,
    distanceUnit,
    volumeUnit,
    consumptionUnit,

    currencySymbol: currencySymbolOf(spec),
    moneyDigits: fractionDigitsOf(spec),
    perDistanceLabel: `${currencySymbolOf(spec)}/${distanceUnit}`,
    money,
    moneyWhole: (cents: number) => Money.fromCents(cents).formatWhole(spec),
    moneyInput: (cents: number) => Money.fromCents(cents).toInput(spec),
    parseCents: (text: string) => centsOrNull(text, spec),
    centsOrZero: (text: string) => centsOrZero(text, spec),
    perDistance: (centsPerKm: number | null) => (centsPerKm === null ? PLACEHOLDER : per(money(perKmToPerDistance(centsPerKm, distanceUnit)), distanceUnit)),
    perDistanceAmount: (centsPerKm: number) => money(perKmToPerDistance(centsPerKm, distanceUnit)),
    perHour: (cents: number | null) => (cents === null ? PLACEHOLDER : per(money(cents), HOUR)),
    perDistanceInput: (centsPerKm: number) => Money.fromCents(perKmToPerDistance(centsPerKm, distanceUnit)).toInput(spec),
    parsePerDistance: (text: string) => {
      const cents = centsOrNull(text, spec);
      return cents === null ? null : Math.round(perDistanceToPerKm(cents, distanceUnit));
    },

    number: (value: number, decimals = 1) => formatNumber(value, locale, { decimals }),
    percent: (value: number) => formatPercent(value, locale),
    decimalInput: (value: number, maxDecimals = 2) => decimalToInput(value, locale, maxDecimals),
    parseDecimal: (text: string) => decimalOrNull(text, locale),
    decimalOrZero: (text: string) => decimalOrZero(text, locale),
    parseInt: (text: string) => intOrNull(text, locale),
    hasInvalidNumber: (text: string) => hasInvalidNumber(text, locale),
    hasInvalidHour: (text: string) => hasInvalidHour(text, locale),
    parseHours: (text: string) => parseHours(text, locale),

    distance: (km: number | null, decimals = 1) =>
      km === null ? PLACEHOLDER : `${formatNumber(kmToDistance(km, distanceUnit), locale, { decimals })} ${distanceUnit}`,
    distanceInput: (km: number, maxDecimals = 2) => decimalToInput(kmToDistance(km, distanceUnit), locale, maxDecimals),
    parseDistance: (text: string) => {
      const value = decimalOrNull(text, locale);
      return value === null ? null : distanceToKm(value, distanceUnit);
    },
    distanceOrZero: (text: string) => distanceToKm(decimalOrZero(text, locale), distanceUnit),

    volumeInput: (liters: number) => decimalToInput(litersToVolume(liters, volumeUnit), locale),
    parseVolume: (text: string) => {
      const value = decimalOrNull(text, locale);
      return value === null ? null : volumeToLiters(value, volumeUnit);
    },
    perVolumeInput: (centsPerLiter: number) => Money.fromCents(perLiterToPerVolume(centsPerLiter, volumeUnit)).toInput(spec),
    perVolumeOrZero: (text: string) => Math.round(perVolumeToPerLiter(centsOrZero(text, spec), volumeUnit)),
    consumptionInput: (kmPerLiter: number) => decimalToInput(kmPerLiterToConsumption(kmPerLiter, consumptionUnit), locale),
    consumptionOrZero: (text: string) => consumptionToKmPerLiter(decimalOrZero(text, locale), consumptionUnit),

    date: (iso: string) => formatDate(iso, locale),
    longDay: (iso: string) => formatLongDay(iso, locale),
    dayMonth: (iso: string) => formatDayMonth(iso, locale),
    month: (iso: string) => formatMonth(iso, format.language),
    monthShort: (iso: string) => formatMonthShort(iso, format.language),
    dayOfMonth: formatDayOfMonth,
    duration: formatDuration,
    clock: formatClock,
    hourOfDay: (hour: number) => i18n.t('hourOfDay', { hour: formatHourOfDay(hour, locale, format.hourCycle) }),
    weekday: (index: number) => i18n.t(`weekday.${index}`, { defaultValue: '' }),
    weekdays: () => weekdaysFrom(format.firstWeekday),
    weekBounds: (iso: string) => weekBounds(iso, format.firstWeekday),
  };
}

export type Formatter = ReturnType<typeof createFormatter>;

const listeners = new Set<() => void>();
let current = createFormatter(DEFAULT_FORMAT);

export const currentFormat = () => current;

export function setActiveFormat(format: RegionalFormat): void {
  current = createFormatter(format);
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useFormat = () => useSyncExternalStore(subscribe, currentFormat);
