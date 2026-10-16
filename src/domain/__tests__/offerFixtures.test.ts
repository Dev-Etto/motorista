import fixtures from '@modules/copilot/fixtures/offers.json';
import { classifyOffer, OfferInput } from '../offer/offer';

describe('oferta com os casos compartilhados com o Kotlin', () => {
  it.each(fixtures.classification)('classifica $valueCents em $km km como $color', ({ color, ...input }) => {
    expect(classifyOffer(input as OfferInput).color).toBe(color);
  });
});
