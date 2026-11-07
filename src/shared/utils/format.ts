export const PLACEHOLDER = '—';

export type ProfitTone = 'negative' | 'positive' | 'default';

export function profitTone(cents: number): ProfitTone {
  if (cents < 0) return 'negative';
  return cents > 0 ? 'positive' : 'default';
}
