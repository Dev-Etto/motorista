import { averageScore, estimateEarnings, filterOffers, listSources, matchPlatforms, OfferLogEntry, statusOf, summarizeOutcomes } from '@domain/offer/offerLog';

const offer = (over: Partial<OfferLogEntry>): OfferLogEntry => ({ timestamp: 100, source: 'Uber', valueCents: 1000, km: 5, ...over });

const OFFERS = [
  offer({ timestamp: 100, status: 'accepted' }),
  offer({ timestamp: 200, source: '99', valueCents: 2000, km: 10, status: 'accepted' }),
  offer({ timestamp: 300, source: 'inDrive', status: 'declined' }),
  offer({ timestamp: 400, status: 'unanswered' }),
  offer({ timestamp: 500, source: 'inDrive', status: 'countered' }),
];
const WHOLE = { from: 0, to: 1000, outcome: 'all', source: null } as const;

describe('estimativa de faturamento', () => {
  it('soma só as aceitas, por plataforma', () => {
    const estimate = estimateEarnings(OFFERS);
    expect(estimate.totalCents).toBe(3000);
    expect(estimate.trips).toBe(2);
    expect(estimate.byPlatform).toEqual([
      { source: '99', cents: 2000, trips: 1 },
      { source: 'Uber', cents: 1000, trips: 1 },
    ]);
  });

  it('contraoferta fica fora da soma', () => {
    expect(estimateEarnings([offer({ status: 'countered' })]).totalCents).toBe(0);
  });

  it('sem aceites, a estimativa é zero', () => {
    expect(estimateEarnings([offer({ status: 'declined' })])).toEqual({ totalCents: 0, trips: 0, byPlatform: [] });
  });

  it('oferta antiga, sem estado, conta como sem resposta', () => {
    expect(statusOf(offer({}))).toBe('unanswered');
    expect(estimateEarnings([offer({})]).totalCents).toBe(0);
  });
});

describe('filtros', () => {
  it('separa aceitas e não aceitas', () => {
    expect(filterOffers(OFFERS, { ...WHOLE, outcome: 'accepted' })).toHaveLength(2);
    expect(filterOffers(OFFERS, { ...WHOLE, outcome: 'notAccepted' })).toHaveLength(3);
  });

  it('filtra por plataforma e período', () => {
    expect(filterOffers(OFFERS, { ...WHOLE, source: 'inDrive' })).toHaveLength(2);
    expect(filterOffers(OFFERS, { ...WHOLE, from: 200, to: 400 }).map((entry) => entry.timestamp)).toEqual([200, 300]);
  });

  it('lista as plataformas sem repetir', () => {
    expect(listSources(OFFERS)).toEqual(['99', 'Uber', 'inDrive']);
  });
});

describe('comparação', () => {
  it('conta e calcula o R$/km de cada grupo', () => {
    const summary = summarizeOutcomes(OFFERS);
    expect(summary).toMatchObject({ received: 5, accepted: 2, notAccepted: 3, acceptedPerKmCents: 200 });
    expect(summary.notAcceptedPerKmCents).toBeCloseTo(3000 / 15);
  });

  it('sem km, não há R$/km', () => {
    expect(summarizeOutcomes([]).acceptedPerKmCents).toBeNull();
  });
});

describe('ligação com as plataformas da jornada', () => {
  const platforms = [
    { id: 1, name: 'Uber' },
    { id: 2, name: '99' },
  ];

  it('liga pelo nome e avisa o que não encontrou', () => {
    const estimate = estimateEarnings([...OFFERS, offer({ source: 'inDrive', status: 'accepted' })]);
    const { matched, unmatched } = matchPlatforms(estimate, platforms);
    expect(matched).toEqual([
      { platformId: 2, cents: 2000, trips: 1 },
      { platformId: 1, cents: 1000, trips: 1 },
    ]);
    expect(unmatched).toEqual(['inDrive']);
  });
});
