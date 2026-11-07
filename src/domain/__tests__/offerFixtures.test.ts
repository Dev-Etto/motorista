import fixtures from '@modules/copilot/fixtures/offers.json';
import { classifyOffer, OfferInput } from '../offer/offer';

describe('oferta com os casos compartilhados com o Kotlin', () => {
  it.each(fixtures.classification)('classifica $valueCents em $km km como $color', ({ color, score, reason, perKm, perHour, profitCents, ...input }) => {
    const result = classifyOffer(input as OfferInput);
    expect(result.color).toBe(color);
    expect(result.score).toBe(score);
    expect(result.reason).toBe(reason);
    expect(result.perKm).toBeCloseTo(perKm, 3);
    expect(result.perHour).toBeCloseTo(perHour, 3);
    if (profitCents === null) expect(result.profitCents).toBeNull();
    if (profitCents !== null) expect(result.profitCents).toBeCloseTo(profitCents, 3);
  });
});
