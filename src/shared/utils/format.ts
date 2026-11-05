import { formatBRL, formatNumber } from './money';

const PLACEHOLDER = '—';

export const formatPerKm = (cents: number | null) => (cents === null ? PLACEHOLDER : `${formatBRL(cents)}/km`);
export const formatPerHour = (cents: number | null) => (cents === null ? PLACEHOLDER : `${formatBRL(cents)}/h`);
export const formatKm = (km: number | null) => (km === null ? PLACEHOLDER : `${formatNumber(km, 1)} km`);
export const profitTone = (cents: number) => (cents < 0 ? 'negative' : 'positive') as 'negative' | 'positive';
