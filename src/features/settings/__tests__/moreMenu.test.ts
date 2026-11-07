import { existsSync } from 'fs';
import { join } from 'path';
import { MORE_SECTIONS } from '@features/settings/moreMenu';
import { i18n } from '@shared/i18n';

const ROUTES_DIR = join(__dirname, '..', '..', '..', 'app');
const t = i18n.getFixedT('pt-BR', 'settings');
const ITEMS = MORE_SECTIONS.flatMap((section) => section.items).map((item) => ({ title: t(`more.item.${item.id}.title`), href: item.href }));

describe('menu Mais', () => {
  it.each(ITEMS)('$title aponta para uma rota existente', ({ href }) => {
    expect(existsSync(join(ROUTES_DIR, `${href}.tsx`))).toBe(true);
  });
});
