import { csvField, toCsv } from '../csv';
import { parseBRL, parseDecimal } from '../money';
import { hasInvalidNumber, parseHours } from '../parse';

describe('leitura de números', () => {
  it('aceita a vírgula no final, enquanto o motorista digita', () => {
    expect(parseDecimal('150,')).toBe(150);
    expect(parseBRL('150,')).toBe(15000);
  });

  it('lê milhar e decimal', () => {
    expect(parseBRL('1.500,50')).toBe(150050);
    expect(parseBRL('1.500')).toBe(150000);
    expect(parseDecimal('8,5')).toBe(8.5);
  });

  it('marca como inválido o que está preenchido e não é número', () => {
    expect(hasInvalidNumber('abc')).toBe(true);
    expect(hasInvalidNumber('1,2,3')).toBe(true);
    expect(hasInvalidNumber('')).toBe(false);
    expect(hasInvalidNumber('150,')).toBe(false);
  });

  it('lê horas com vírgula e com dois pontos', () => {
    expect(parseHours('8,5')).toBe(8.5);
    expect(parseHours('8:30')).toBe(8.5);
    expect(parseHours('8:')).toBeNull();
    expect(parseHours('')).toBeNull();
  });
});

describe('planilha', () => {
  it('não corrompe valor negativo', () => {
    expect(csvField('-12,34')).toBe('-12,34');
    expect(csvField(-5)).toBe('-5');
  });

  it('continua protegendo contra fórmula', () => {
    expect(csvField('=SOMA(A1)')).toBe("'=SOMA(A1)");
    expect(csvField('-cmd')).toBe("'-cmd");
  });

  it('separa as colunas com ponto e vírgula', () => {
    expect(toCsv(['a', 'b'], [[1, '-2,50']])).toContain('1;-2,50');
  });
});
