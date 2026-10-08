export type OfferColor = 'green' | 'yellow' | 'red';

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

export const DEFAULT_OFFER_TARGETS: OfferTargets = { targetPerKmCents: 200, targetPerHourCents: 3000 };

function resolveColor(offer: OfferInput, profitCents: number, perKm: number, perHour: number): OfferColor {
  if (profitCents < 0) return 'red';
  if (perKm < offer.targetPerKmCents) return 'yellow';
  if (perHour < offer.targetPerHourCents) return 'yellow';
  return 'green';
}

export function classifyOffer(offer: OfferInput) {
  const perKm = offer.km > 0 ? offer.valueCents / offer.km : 0;
  const perHour = offer.minutes > 0 ? (offer.valueCents / offer.minutes) * 60 : 0;
  const profitCents = offer.valueCents - offer.km * offer.costPerKm;

  return { perKm, perHour, profitCents, color: resolveColor(offer, profitCents, perKm, perHour) };
}
