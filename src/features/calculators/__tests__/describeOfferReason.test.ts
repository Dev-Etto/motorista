import { classifyOffer, type OfferInput } from '@domain/offer/offer';
import { describeOfferReason } from '@features/calculators/describeOfferReason';
import fixtures from '@modules/copilot/fixtures/offers.json';
import { i18n } from '@shared/i18n';

describe('motivo da nota com o mesmo texto do Kotlin', () => {
  it.each(fixtures.classification)('$valueCents em $km km: $reason', ({ reason, color, score, perKm, perHour, profitCents, ...input }) => {
    const result = classifyOffer(input as OfferInput);
    expect(describeOfferReason(result.reason, i18n.getFixedT('pt-BR', 'offers'), 'km')).toBe(reason);
  });
});

describe('motivo da nota em milhas', () => {
  it('fala da milha no lugar do km', () => {
    const t = i18n.getFixedT('pt-BR', 'offers');
    expect(describeOfferReason({ kind: 'below-cost' }, t, 'mi')).toBe('Não cobre seu custo por mi');
    expect(describeOfferReason({ kind: 'targets', perKm: { kind: 'at-target' }, perHour: null }, t, 'mi')).toBe('mi: no mínimo · hora: sem tempo na oferta');
  });
});
