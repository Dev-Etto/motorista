import { OfferRange } from '@/domain/offer/offerLog';
import { addDays, dayRange } from '@/shared/utils/dates';

export type OfferPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface CustomDates {
  start: string;
  end: string;
}

const WEEK_DAYS_BACK = 6;
const MONTH_DAYS_BACK = 29;

export const PERIOD_OPTIONS: { value: OfferPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'week', label: '7 dias' },
  { value: 'month', label: '30 dias' },
  { value: 'custom', label: 'Escolher datas' },
];

const spanning = (start: string, end: string): OfferRange => ({ from: dayRange(start).from, to: dayRange(end).to });

export const defaultCustomDates = (date: string): CustomDates => ({ start: addDays(date, -MONTH_DAYS_BACK), end: date });

export function periodRange(period: OfferPeriod, date: string, custom: CustomDates): OfferRange {
  if (period === 'today') return dayRange(date);
  if (period === 'yesterday') return dayRange(addDays(date, -1));
  if (period === 'week') return spanning(addDays(date, -WEEK_DAYS_BACK), date);
  if (period === 'month') return spanning(addDays(date, -MONTH_DAYS_BACK), date);
  return custom.start <= custom.end ? spanning(custom.start, custom.end) : spanning(custom.end, custom.start);
}
