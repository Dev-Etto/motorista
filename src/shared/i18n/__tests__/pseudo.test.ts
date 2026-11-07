import { pseudoText, pseudoTree } from '@shared/i18n/pseudo';

describe('pseudo-idioma', () => {
  it('acentua, alonga e marca o começo e o fim do texto', () => {
    const text = pseudoText('Salvar');
    expect(text.startsWith('[Sálvár')).toBe(true);
    expect(text.endsWith(']')).toBe(true);
    expect(text.length).toBeGreaterThan('Salvar'.length * 1.4);
  });

  it('preserva interpolação, tags e quebra de linha', () => {
    const text = pseudoText('Faltam {{amount}} hoje.\\nVeja os <bold>Termos</bold>');
    expect(text).toContain('{{amount}}');
    expect(text).toContain('<bold>');
    expect(text).toContain('</bold>');
    expect(text).toContain('\\n');
  });

  it('transforma a árvore inteira mantendo as chaves', () => {
    expect(Object.keys(pseudoTree({ a: 'x', b: { c: 'y' } }))).toEqual(['a', 'b']);
  });
});
