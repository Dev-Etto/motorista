import fixtures from '@modules/copilot/fixtures/offers.json';
import { classifyOffer, OfferInput } from '../offer/offer';

describe('oferta com os casos compartilhados com o Kotlin', () => {
  it.each(fixtures.classification)('classifica $valueCents em $km km como $color', ({ color, score, reason, ...input }) => {
    const result = classifyOffer(input as OfferInput);
    expect(result.color).toBe(color);
    expect(result.score).toBe(score);
    expect(result.reason).toBe(reason);
  });
});
