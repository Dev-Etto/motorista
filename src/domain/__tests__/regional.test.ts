import {
  DeviceRegional,
  EMPTY_SAVED_REGIONAL,
  LEGACY_REGIONAL,
  matchLanguage,
  regionalProfileSchema,
  resolveRegionalProfile,
  SavedRegional,
  MARKET_CURRENCY,
  matchMarket,
  formatLocaleChoices,
} from '@domain/regional/regional';

const brazil: DeviceRegional = {
  languageTags: ['pt-BR'],
  regionCode: 'BR',
  currencyCode: 'BRL',
  measurementSystem: 'metric',
  firstWeekday: 1,
  uses24hourClock: true,
};

const unitedStates: DeviceRegional = {
  languageTags: ['en-US'],
  regionCode: 'US',
  currencyCode: 'USD',
  measurementSystem: 'us',
  firstWeekday: 1,
  uses24hourClock: false,
};

const spain: DeviceRegional = {
  languageTags: ['es-ES'],
  regionCode: 'ES',
  currencyCode: 'EUR',
  measurementSystem: 'metric',
  firstWeekday: 2,
  uses24hourClock: true,
};

const saved = (overrides: Partial<SavedRegional>): SavedRegional => ({ ...EMPTY_SAVED_REGIONAL, ...overrides });

describe('idioma suportado mais próximo', () => {
  it.each([
    [['pt-BR'], 'pt-BR'],
    [['pt-PT'], 'pt-BR'],
    [['es-AR'], 'es'],
    [['es-419'], 'es'],
    [['en-GB'], 'en'],
    [['EN-us'], 'en'],
    [['fr-FR'], 'en'],
    [['fr-FR', 'es-MX'], 'es'],
    [['de-DE', 'pt-BR', 'es-MX'], 'pt-BR'],
  ])('%j vira %s', (tags, expected) => {
    expect(matchLanguage(tags)).toBe(expected);
  });
});

describe('perfil regional', () => {
  it('segue o aparelho quando nada foi escolhido', () => {
    expect(resolveRegionalProfile(unitedStates, EMPTY_SAVED_REGIONAL)).toEqual({
      language: 'en',
      formatLocale: 'en-US',
      market: 'BR',
      currency: 'BRL',
      distanceUnit: 'mi',
      volumeUnit: 'gal',
      consumptionUnit: 'mpg',
      firstWeekday: 7,
      hourCycle: 'h12',
    });
  });

  it('usa L/100km fora das regiões que medem em km/L e começa a semana no dia do aparelho', () => {
    const profile = resolveRegionalProfile(spain, EMPTY_SAVED_REGIONAL);
    expect(profile).toMatchObject({
      language: 'es',
      formatLocale: 'es-ES',
      currency: 'BRL',
      distanceUnit: 'km',
      volumeUnit: 'L',
      consumptionUnit: 'L/100km',
      firstWeekday: 1,
    });
  });

  it('usa milha e litro no Reino Unido', () => {
    const profile = resolveRegionalProfile(
      { ...spain, languageTags: ['en-GB'], regionCode: 'GB', currencyCode: 'GBP', measurementSystem: 'uk' },
      EMPTY_SAVED_REGIONAL,
    );
    expect(profile).toMatchObject({ distanceUnit: 'mi', volumeUnit: 'L', market: 'BR', currency: 'BRL' });
  });

  it('a escolha salva vence o aparelho, campo a campo', () => {
    const profile = resolveRegionalProfile(unitedStates, saved({ language: 'pt-BR', market: 'BR' }));
    expect(profile).toMatchObject({ language: 'pt-BR', currency: 'BRL', formatLocale: 'en-US', distanceUnit: 'mi' });
  });

  it('o perfil das instalações antigas fica igual ao de antes', () => {
    expect(resolveRegionalProfile(unitedStates, LEGACY_REGIONAL)).toEqual({ ...LEGACY_REGIONAL, currency: 'BRL', hourCycle: 'h12' });
  });

  it('sem região conhecida usa real, quilômetro e km/L', () => {
    const profile = resolveRegionalProfile(
      { ...brazil, languageTags: ['fr'], regionCode: null, currencyCode: null, measurementSystem: null, firstWeekday: null },
      EMPTY_SAVED_REGIONAL,
    );
    expect(profile).toMatchObject({ language: 'en', currency: 'BRL', distanceUnit: 'km', volumeUnit: 'L', consumptionUnit: 'km/L', firstWeekday: 1 });
  });

  it('sem idioma no aparelho usa português', () => {
    const profile = resolveRegionalProfile({ ...brazil, languageTags: [] }, EMPTY_SAVED_REGIONAL);
    expect(profile).toMatchObject({ language: 'pt-BR', formatLocale: 'pt-BR' });
  });

  it('ignora formato regional salvo inválido', () => {
    expect(resolveRegionalProfile(brazil, saved({ formatLocale: 'not a locale!' })).formatLocale).toBe('pt-BR');
  });

  it('o resultado sempre passa no schema', () => {
    [brazil, unitedStates, spain].forEach((device) => {
      expect(regionalProfileSchema.safeParse(resolveRegionalProfile(device, EMPTY_SAVED_REGIONAL)).success).toBe(true);
    });
  });
});

describe('país onde o motorista dirige', () => {
  it('a moeda segue o país, nunca a moeda do aparelho', () => {
    expect(resolveRegionalProfile({ ...brazil, currencyCode: 'USD' }, EMPTY_SAVED_REGIONAL)).toMatchObject({ market: 'BR', currency: 'BRL' });
  });

  it('país sem leitura das plataformas usa o Brasil', () => {
    expect(matchMarket('US')).toBe('BR');
    expect(matchMarket(null)).toBe('BR');
    expect(matchMarket('BR')).toBe('BR');
  });

  it('cada país tem a moeda das plataformas de lá', () => {
    expect(MARKET_CURRENCY.BR).toBe('BRL');
  });
});

describe('opções de formato', () => {
  it('inclui o formato atual mesmo fora da lista', () => {
    expect(formatLocaleChoices('fr-FR')[0]).toBe('fr-FR');
    expect(formatLocaleChoices('pt-BR').filter((tag) => tag === 'pt-BR')).toHaveLength(1);
  });
});
