export const PLACEHOLDER = '—';

export const profitTone = (cents: number) => (cents < 0 ? 'negative' : 'positive') as 'negative' | 'positive';
