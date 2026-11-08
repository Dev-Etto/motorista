import { existsSync } from 'fs';
import { join } from 'path';
import { ABOUT_SECTIONS, MORE_SECTIONS } from '@features/settings/moreMenu';
import { i18n } from '@shared/i18n';

const ROUTES_DIR = join(__dirname, '..', '..', '..', 'app');
const t = i18n.getFixedT('pt-BR', 'settings');
const ITEMS = [...MORE_SECTIONS, ...ABOUT_SECTIONS]
  .flatMap((section) => section.items)
  .map((item) => ({ title: t(`more.item.${item.id}.title`), href: item.href }));
const idsOf = (id: string) => MORE_SECTIONS.find((section) => section.id === id)?.items.map((item) => item.id);

describe('menu Mais', () => {
  it('tem três grupos: Trabalho, App e Ajuda e sobre', () => {
    expect(MORE_SECTIONS.map((section) => t(`more.section.${section.id}`))).toEqual(['Trabalho', 'App', 'Ajuda e sobre']);
  });

  it('Trabalho reúne veículos, meta, plataformas e o Copiloto', () => {
    expect(idsOf('work')).toEqual(['vehicle', 'goal', 'platforms', 'copilot']);
  });

  it('App reúne idioma, lembretes, backup e permissões', () => {
    expect(idsOf('app')).toEqual(['region', 'reminders', 'backup', 'permissions']);
  });

  it('resumo, relato, privacidade e termos ficam em Sobre', () => {
    expect(idsOf('help')).toEqual(['help', 'about']);
    expect(ABOUT_SECTIONS.flatMap((section) => section.items).map((item) => item.id)).toEqual(['summary', 'report', 'privacy', 'terms']);
  });

  it.each(ITEMS)('$title aponta para uma rota existente', ({ href }) => {
    expect(existsSync(join(ROUTES_DIR, `${href}.tsx`))).toBe(true);
  });
});
