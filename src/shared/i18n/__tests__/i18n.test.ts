import { i18n, setLanguage } from '@shared/i18n';
import { resources, SOURCE_LANGUAGE } from '@shared/i18n/resources';

afterEach(() => setLanguage(SOURCE_LANGUAGE));

describe('traduções', () => {
  it('começa no idioma de origem', () => {
    expect(i18n.language).toBe('pt-BR');
    expect(i18n.t('app.openFailed')).toBe('Não foi possível abrir os dados do app. Reinicie e tente novamente.');
  });

  it('idioma sem tradução cai para o português', async () => {
    await setLanguage('fr');
    expect(i18n.language).toBe('fr');
    expect(i18n.t('app.openFailed')).toBe('Não foi possível abrir os dados do app. Reinicie e tente novamente.');
  });

  it('inglês e espanhol têm tradução própria', async () => {
    await setLanguage('en');
    expect(i18n.t('app.openFailed')).not.toBe('Não foi possível abrir os dados do app. Reinicie e tente novamente.');
    await setLanguage('es');
    expect(i18n.t('app.openFailed')).not.toBe('Não foi possível abrir os dados do app. Reinicie e tente novamente.');
  });

  it('o português é o idioma de origem dos recursos', () => {
    expect(Object.keys(resources)).toContain(SOURCE_LANGUAGE);
  });
});
