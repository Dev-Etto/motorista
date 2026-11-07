import { copilotRegionalOf, createRegionalStore, formatOf } from '@application/regional';
import { DeviceRegional, EMPTY_SAVED_REGIONAL, LEGACY_REGIONAL, RegionalProfile, SavedRegional } from '@domain/regional/regional';

const spanishDevice: DeviceRegional = {
  languageTags: ['es-MX'],
  regionCode: 'MX',
  currencyCode: 'MXN',
  measurementSystem: 'metric',
  firstWeekday: 1,
  uses24hourClock: true,
};

function setup(stored: SavedRegional = EMPTY_SAVED_REGIONAL, initialAppLanguage: string | null = null) {
  let device = spanishDevice;
  let appLanguage = initialAppLanguage;
  const applied: RegionalProfile[] = [];
  const saves: Partial<SavedRegional>[] = [];
  const store = createRegionalStore({
    load: async () => stored,
    save: async (changes) => void saves.push(changes),
    readDevice: () => device,
    apply: async (profile) => void applied.push(profile),
    readAppLanguage: () => appLanguage,
    writeAppLanguage: (language) => {
      appLanguage = language;
    },
  });
  const changeDevice = (next: Partial<DeviceRegional>) => {
    device = { ...device, ...next };
  };
  const changeAppLanguage = (next: string | null) => {
    appLanguage = next;
  };
  return { store, applied, saves, changeDevice, changeAppLanguage, appLanguage: () => appLanguage };
}

describe('perfil regional do app', () => {
  it('antes de carregar já responde com o aparelho', () => {
    const { store, applied } = setup();
    expect(store.current()).toMatchObject({ language: 'es', currency: 'BRL' });
    expect(applied).toHaveLength(0);
  });

  it('ao carregar aplica o perfil mesmo que seja igual ao inicial', async () => {
    const { store, applied } = setup();
    store.current();
    await store.load();
    expect(applied.map((profile) => profile.language)).toEqual(['es']);
  });

  it('a escolha salva vence o aparelho e avisa quem escuta', async () => {
    const { store, applied } = setup(LEGACY_REGIONAL);
    const listener = jest.fn();
    store.subscribe(listener);
    await store.load();
    expect(store.current()).toMatchObject({ language: 'pt-BR', market: 'BR' });
    expect(applied).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('salva a mudança e reaplica', async () => {
    const { store, saves } = setup();
    await store.load();
    await store.update({ language: 'en' });
    expect(saves).toEqual([{ language: 'en' }]);
    expect(store.current().language).toBe('en');
    expect(store.current().currency).toBe('BRL');
  });

  it('segue a troca de idioma do aparelho só no que não foi escolhido', async () => {
    const { store, changeDevice } = setup({ ...EMPTY_SAVED_REGIONAL, distanceUnit: 'km' });
    await store.load();
    changeDevice({ languageTags: ['en-US'], measurementSystem: 'us' });
    await store.refresh();
    expect(store.current()).toMatchObject({ language: 'en', distanceUnit: 'km', volumeUnit: 'gal' });
  });

  it('voltar ao app antes de carregar não aplica nem salva nada', async () => {
    const { store, applied, saves } = setup(EMPTY_SAVED_REGIONAL, 'en');
    await store.refresh();

    expect(applied).toEqual([]);
    expect(saves).toEqual([]);
  });

  it('não reaplica nem avisa quando nada mudou', async () => {
    const { store, applied } = setup();
    await store.load();
    const listener = jest.fn();
    store.subscribe(listener);
    await store.refresh();
    expect(applied).toHaveLength(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('o retorno de subscribe para de avisar', async () => {
    const { store } = setup();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    await store.load();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('idioma por app do Android', () => {
  it('escolher no app grava também no sistema', async () => {
    const helpers = setup();
    await helpers.store.load();
    await helpers.store.chooseLanguage('en');
    expect(helpers.appLanguage()).toBe('en');
    expect(helpers.store.current().language).toBe('en');
    expect(helpers.saves).toContainEqual({ language: 'en' });
  });

  it('automático limpa a escolha no sistema e volta a seguir o aparelho', async () => {
    const helpers = setup({ ...EMPTY_SAVED_REGIONAL, language: 'en' }, 'en');
    await helpers.store.load();
    await helpers.store.chooseLanguage(null);
    expect(helpers.appLanguage()).toBeNull();
    expect(helpers.store.current().language).toBe('es');
  });

  it('trocar nas configurações do sistema vale ao voltar para o app', async () => {
    const helpers = setup({ ...EMPTY_SAVED_REGIONAL, language: 'en' }, 'en');
    await helpers.store.load();
    helpers.changeAppLanguage('pt-BR');
    await helpers.store.refresh();
    expect(helpers.store.current().language).toBe('pt-BR');
    expect(helpers.saves).toContainEqual({ language: 'pt-BR' });
  });
});

describe('formato aplicado a partir do perfil', () => {
  it('leva idioma, formato regional, moeda e unidades', () => {
    expect(formatOf({ ...LEGACY_REGIONAL, language: 'en', formatLocale: 'en-US', distanceUnit: 'mi', hourCycle: 'h12', currency: 'USD' })).toEqual({
      language: 'en',
      locale: 'en-US',
      currency: 'USD',
      distanceUnit: 'mi',
      volumeUnit: 'L',
      consumptionUnit: 'km/L',
      firstWeekday: 1,
      hourCycle: 'h12',
    });
  });
});

describe('perfil enviado ao Copiloto', () => {
  it('leva idioma, formato, moeda e unidade de distância', () => {
    expect(copilotRegionalOf({ ...LEGACY_REGIONAL, language: 'es', formatLocale: 'es-MX', currency: 'MXN', hourCycle: 'h23' })).toEqual({
      languageTag: 'es',
      formatLocale: 'es-MX',
      currencyCode: 'MXN',
      distanceUnit: 'km',
    });
  });
});
