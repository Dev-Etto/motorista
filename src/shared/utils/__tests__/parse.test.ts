import { csvField, toCsv } from '../csv';
import { parseBRL, parseDecimal } from '../money';
import { centsOrNull, centsOrZero, decimalOrNull, hasInvalidHour, hasInvalidNumber, intOrNull, parseHours } from '../parse';

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

describe('números digitados em formulário', () => {
  it('recusa valores negativos', () => {
    expect(hasInvalidNumber('-50')).toBe(true);
    expect(centsOrNull('-50')).toBeNull();
    expect(centsOrZero('-50')).toBe(0);
    expect(decimalOrNull('-3')).toBeNull();
    expect(intOrNull('-2')).toBeNull();
    expect(parseHours('-1')).toBeNull();
  });

  it('continua aceitando zero e positivos', () => {
    expect(centsOrNull('0')).toBe(0);
    expect(centsOrNull('12,5')).toBe(1250);
    expect(decimalOrNull('45,5')).toBe(45.5);
  });

  it('aceita a hora de início só de 0 a 23', () => {
    expect(hasInvalidHour('')).toBe(false);
    expect(hasInvalidHour('0')).toBe(false);
    expect(hasInvalidHour('23')).toBe(false);
    expect(hasInvalidHour('24')).toBe(true);
    expect(hasInvalidHour('8,5')).toBe(true);
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
