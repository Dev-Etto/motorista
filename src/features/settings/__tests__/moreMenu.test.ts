import { existsSync } from 'fs';
import { join } from 'path';
import { MORE_MENU } from '../moreMenu';

const ROUTES_DIR = join(__dirname, '../../../app');

describe('menu Mais', () => {
  it.each(MORE_MENU)('$title aponta para uma rota existente', ({ href }) => {
    expect(existsSync(join(ROUTES_DIR, `${href}.tsx`))).toBe(true);
  });
});
