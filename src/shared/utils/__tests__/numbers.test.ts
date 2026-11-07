import { decimalToInput, formatNumber, formatPercent, parseDecimal, separatorsOf } from '@shared/utils/numbers';

describe('números por região', () => {
  it.each([
    ['pt-BR', ',', '.', '1.234,6', '12%'],
    ['en-US', '.', ',', '1,234.6', '12%'],
    ['es-MX', '.', ',', '1,234.6', '12%'],
    ['es-ES', ',', '.', '1234,6', '12 %'],
  ])('%s', (locale, decimal, group, formatted, percent) => {
    expect(separatorsOf(locale)).toEqual({ decimal, group });
    expect(formatNumber(1234.56, locale)).toBe(formatted);
    expect(formatPercent(12, locale)).toBe(percent);
  });

  it('formata casas fixas e sem separador de milhar', () => {
    expect(formatNumber(1000, 'pt-BR', { decimals: 0 })).toBe('1.000');
    expect(formatNumber(1234.5, 'pt-BR', { decimals: 2, grouping: false })).toBe('1234,50');
    expect(formatNumber(-0, 'pt-BR')).toBe('0,0');
  });
});

describe('leitura de números por região', () => {
  it('lê como antes em português', () => {
    expect(parseDecimal('150,', 'pt-BR')).toBe(150);
    expect(parseDecimal('8,5', 'pt-BR')).toBe(8.5);
    expect(parseDecimal('1.500', 'pt-BR')).toBe(1500);
    expect(parseDecimal('12.5', 'pt-BR')).toBe(12.5);
    expect(parseDecimal('-1.234,5', 'pt-BR')).toBe(-1234.5);
    expect(parseDecimal('1,2,3', 'pt-BR')).toBeNull();
    expect(parseDecimal('abc', 'pt-BR')).toBeNull();
  });

  it('lê com ponto decimal em inglês e aceita vírgula digitada como decimal', () => {
    expect(parseDecimal('1,234.56', 'en-US')).toBe(1234.56);
    expect(parseDecimal('1,500', 'en-US')).toBe(1500);
    expect(parseDecimal('8.5', 'en-US')).toBe(8.5);
    expect(parseDecimal('12,5', 'en-US')).toBe(12.5);
  });

  it('mostra no campo de edição sem milhar e com até as casas pedidas', () => {
    expect(decimalToInput(45090.200000000004, 'pt-BR')).toBe('45090,2');
    expect(decimalToInput(12, 'pt-BR')).toBe('12');
    expect(decimalToInput(8.125, 'pt-BR')).toBe('8,13');
    expect(decimalToInput(140.55, 'pt-BR', 1)).toBe('140,6');
    expect(decimalToInput(140.55, 'en-US', 1)).toBe('140.6');
  });
});
