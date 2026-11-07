import { i18n, setLanguage } from '@shared/i18n';
import { resources, SOURCE_LANGUAGE } from '@shared/i18n/resources';

afterEach(() => setLanguage(SOURCE_LANGUAGE));

describe('traduções', () => {
  it('começa no idioma de origem', () => {
    expect(i18n.language).toBe('pt-BR');
    expect(i18n.t('app.loading')).toBe('Carregando…');
  });

  it('idioma sem tradução cai para o português', async () => {
    await setLanguage('fr');
    expect(i18n.language).toBe('fr');
    expect(i18n.t('app.loading')).toBe('Carregando…');
  });

  it('inglês e espanhol têm tradução própria', async () => {
    await setLanguage('en');
    expect(i18n.t('app.loading')).not.toBe('Carregando…');
    await setLanguage('es');
    expect(i18n.t('app.loading')).not.toBe('Carregando…');
  });

  it('o português é o idioma de origem dos recursos', () => {
    expect(Object.keys(resources)).toContain(SOURCE_LANGUAGE);
  });
});
