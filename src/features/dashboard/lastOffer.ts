import type { TFunction } from 'i18next';
import { MINUTES_PER_HOUR, MS_PER_MINUTE } from '@shared/utils/time';

export function describeAgo(timestamp: number, now: number, t: TFunction<'dashboard'>): string {
  const minutes = Math.floor(Math.max(0, now - timestamp) / MS_PER_MINUTE);
  if (minutes < 1) return t('lastOffer.now');
  if (minutes < MINUTES_PER_HOUR) return t('lastOffer.minutes', { count: minutes });
  return t('lastOffer.hours', { count: Math.floor(minutes / MINUTES_PER_HOUR) });
}
