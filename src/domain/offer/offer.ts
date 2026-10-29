export type OfferColor = 'green' | 'yellow' | 'red' | 'neutral';
export type OfferMode = 'normal' | 'low';

export interface OfferInput {
  valueCents: number;
  km: number;
  minutes: number;
  costPerKm: number;
  targetPerKmCents: number;
  targetPerHourCents: number;
}

export interface OfferTargets {
  targetPerKmCents: number;
  targetPerHourCents: number;
}

export interface OfferSettings {
  mode: OfferMode;
  normal: OfferTargets;
  low: OfferTargets;
}

export const DEFAULT_OFFER_TARGETS: OfferTargets = { targetPerKmCents: 200, targetPerHourCents: 3000 };
export const DEFAULT_LOW_DEMAND_TARGETS: OfferTargets = { targetPerKmCents: 150, targetPerHourCents: 2000 };

export const activeTargets = (settings: OfferSettings): OfferTargets => settings[settings.mode];

function resolveColor(offer: OfferInput, profitCents: number, perKm: number, perHour: number): OfferColor {
  if (offer.costPerKm <= 0) return 'neutral';
  if (profitCents < 0) return 'red';
  if (perKm < offer.targetPerKmCents) return 'yellow';
  if (perHour < offer.targetPerHourCents) return 'yellow';
  return 'green';
}

const TARGET_SCORE = 7;
const MAX_SCORE = 10;
const SCORE_PER_RATIO_ABOVE_TARGET = 6;
const SCORE_BANDS: Record<Exclude<OfferColor, 'neutral'>, [number, number]> = {
  green: [7, 10],
  yellow: [4, 6.9],
  red: [0, 3.9],
};

function partialScore(value: number, target: number): number {
  if (target <= 0) return MAX_SCORE;

  const ratio = value / target;
  if (ratio <= 1) return TARGET_SCORE * ratio;
  return Math.min(MAX_SCORE, TARGET_SCORE + (ratio - 1) * SCORE_PER_RATIO_ABOVE_TARGET);
}

function resolveScore(offer: OfferInput, color: OfferColor, perKm: number, perHour: number): number | null {
  if (color === 'neutral') return null;

  const kmScore = partialScore(perKm, offer.targetPerKmCents);
  const hourScore = partialScore(perHour, offer.targetPerHourCents);
  const base = (Math.min(kmScore, hourScore) + (kmScore + hourScore) / 2) / 2;
  const [low, high] = SCORE_BANDS[color];
  return Math.round(Math.max(low, Math.min(high, base)) * 10) / 10;
}

function compareToTarget(value: number, target: number): string {
  if (target <= 0) return 'sem meta';

  const percent = Math.round((value / target - 1) * 100);
  if (percent === 0) return 'na meta';
  return percent > 0 ? `${percent}% acima da meta` : `${-percent}% abaixo da meta`;
}

function resolveReason(offer: OfferInput, color: OfferColor, perKm: number, perHour: number): string {
  if (color === 'neutral') return 'Cadastre seus custos para ver a nota';
  if (color === 'red') return 'Não cobre seu custo por km';
  return `km: ${compareToTarget(perKm, offer.targetPerKmCents)} · hora: ${compareToTarget(perHour, offer.targetPerHourCents)}`;
}

export function classifyOffer(offer: OfferInput) {
  const perKm = offer.km > 0 ? offer.valueCents / offer.km : 0;
  const perHour = offer.minutes > 0 ? (offer.valueCents / offer.minutes) * 60 : 0;
  const profitCents = offer.valueCents - offer.km * offer.costPerKm;

  const color = resolveColor(offer, profitCents, perKm, perHour);

  return {
    perKm,
    perHour,
    profitCents,
    color,
    score: resolveScore(offer, color, perKm, perHour),
    reason: resolveReason(offer, color, perKm, perHour),
  };
}
