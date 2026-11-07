import { z } from 'zod';
import { MINUTES_PER_HOUR } from '@/shared/utils/time';

export type OfferColor = 'green' | 'yellow' | 'red' | 'neutral';
export const OFFER_MODES = ['normal', 'low'] as const;
export type OfferMode = (typeof OFFER_MODES)[number];

export interface OfferInput {
  valueCents: number;
  km: number;
  minutes: number;
  costPerKm: number;
  targetPerKmCents: number;
  targetPerHourCents: number;
}

export const offerTargetsSchema = z.object({
  targetPerKmCents: z.number().nonnegative(),
  targetPerHourCents: z.number().nonnegative(),
});

export type OfferTargets = z.infer<typeof offerTargetsSchema>;

export interface OfferSettings {
  mode: OfferMode;
  normal: OfferTargets;
  low: OfferTargets;
  followGoal: boolean;
}

export const DEFAULT_OFFER_TARGETS: OfferTargets = { targetPerKmCents: 200, targetPerHourCents: 3000 };
export const DEFAULT_LOW_DEMAND_TARGETS: OfferTargets = { targetPerKmCents: 150, targetPerHourCents: 2000 };

export const activeTargets = (settings: OfferSettings): OfferTargets => settings[settings.mode];

export function withGoalTargets(settings: OfferSettings, suggestion: OfferTargets | null): OfferSettings {
  if (!settings.followGoal || !suggestion) return settings;

  return {
    ...settings,
    normal: { targetPerKmCents: suggestion.targetPerKmCents, targetPerHourCents: suggestion.targetPerHourCents },
  };
}

function resolveColor(offer: OfferInput, profitCents: number, perKm: number, perHour: number): OfferColor {
  if (offer.costPerKm <= 0) return 'neutral';
  if (profitCents < 0) return 'red';
  if (perKm < offer.targetPerKmCents) return 'yellow';
  if (offer.minutes > 0 && perHour < offer.targetPerHourCents) return 'yellow';
  return 'green';
}

const NO_TIME_MAX_SCORE = 4;
const NO_TIME = 'sem tempo na oferta';
const TARGET_SCORE = 3.5;
const MAX_SCORE = 5;
const SCORE_PER_RATIO_ABOVE_TARGET = 3;
const SCORE_BANDS: Record<Exclude<OfferColor, 'neutral'>, [number, number]> = {
  green: [TARGET_SCORE, MAX_SCORE],
  yellow: [2, 3.4],
  red: [0, 1.9],
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
  const base = offer.minutes > 0 ? (Math.min(kmScore, hourScore) + (kmScore + hourScore) / 2) / 2 : kmScore;
  const [low, bandHigh] = SCORE_BANDS[color];
  const high = offer.minutes > 0 ? bandHigh : Math.min(bandHigh, NO_TIME_MAX_SCORE);
  return Math.round(Math.max(low, Math.min(high, base)) * 10) / 10;
}

function compareToTarget(value: number, target: number): string {
  if (target <= 0) return 'sem mínimo';

  const percent = Math.round((value / target - 1) * 100);
  if (percent === 0) return 'no mínimo';
  return percent > 0 ? `${percent}% acima do mínimo` : `${-percent}% abaixo do mínimo`;
}

function resolveReason(offer: OfferInput, color: OfferColor, perKm: number, perHour: number): string {
  if (color === 'neutral') return 'Cadastre seus custos para ver a nota';
  if (color === 'red') return 'Não cobre seu custo por km';
  return `km: ${compareToTarget(perKm, offer.targetPerKmCents)} · hora: ${offer.minutes > 0 ? compareToTarget(perHour, offer.targetPerHourCents) : NO_TIME}`;
}

export function classifyOffer(offer: OfferInput) {
  const perKm = offer.km > 0 ? offer.valueCents / offer.km : 0;
  const perHour = offer.minutes > 0 ? (offer.valueCents / offer.minutes) * MINUTES_PER_HOUR : 0;
  const profit = offer.valueCents - offer.km * offer.costPerKm;
  const color = resolveColor(offer, profit, perKm, perHour);
  const profitCents = color === 'neutral' ? null : profit;

  return {
    perKm,
    perHour,
    profitCents,
    color,
    score: resolveScore(offer, color, perKm, perHour),
    reason: resolveReason(offer, color, perKm, perHour),
  };
}
