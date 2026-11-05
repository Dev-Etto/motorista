import { existsSync } from 'fs';
import { join } from 'path';
import { MORE_SECTIONS } from '../moreMenu';

const ROUTES_DIR = join(__dirname, '../../../app');

describe('menu Mais', () => {
  it.each(MORE_SECTIONS.flatMap((section) => section.items))('$title aponta para uma rota existente', ({ href }) => {
    expect(existsSync(join(ROUTES_DIR, `${href}.tsx`))).toBe(true);
  });
});
