export interface QuoteInput {
  kmToPassenger: number;
  kmTrip: number;
  kmReturn: number;
  minutes: number;
  costPerKm: number;
  desiredProfitPerHourCents: number;
  tollCents: number;
  extrasCents: number;
  minimumCents: number;
  roundToCents?: number;
}

const DEFAULT_ROUNDING_CENTS = 100;

export function computeQuote(quote: QuoteInput) {
  const totalKm = quote.kmToPassenger + quote.kmTrip + quote.kmReturn;
  const vehicleCostCents = totalKm * quote.costPerKm;
  const timeCents = quote.minutes * (quote.desiredProfitPerHourCents / 60);
  const rawPriceCents = vehicleCostCents + timeCents + quote.tollCents + quote.extrasCents;
  const step = quote.roundToCents ?? DEFAULT_ROUNDING_CENTS;
  const priceCents = Math.max(Math.ceil(rawPriceCents / step) * step, quote.minimumCents);
  const totalCostCents = vehicleCostCents + quote.tollCents;

  return {
    totalKm,
    vehicleCostCents,
    timeCents,
    tollCents: quote.tollCents,
    extrasCents: quote.extrasCents,
    rawPriceCents,
    priceCents,
    estimatedProfitCents: priceCents - totalCostCents,
    perKm: totalKm > 0 ? priceCents / totalKm : null,
  };
}
