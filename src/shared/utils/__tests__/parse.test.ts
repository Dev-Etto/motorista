import { csvField, toCsv } from '@shared/utils/csv';
import type { MoneyFormat } from '@shared/utils/money';
import { centsOrNull, centsOrZero, decimalOrNull, hasInvalidHour, hasInvalidNumber, hoursToInput, intOrNull, parseHours } from '@shared/utils/parse';

const BRL: MoneyFormat = { locale: 'pt-BR', currency: 'BRL' };
const PT = 'pt-BR';

describe('leitura de números', () => {
  it('lê centavos com milhar e vírgula no final', () => {
    expect(centsOrNull('150,', BRL)).toBe(15000);
    expect(centsOrNull('1.500,50', BRL)).toBe(150050);
    expect(centsOrNull('1.500', BRL)).toBe(150000);
  });

  it('marca como inválido o que está preenchido e não é número', () => {
    expect(hasInvalidNumber('abc', PT)).toBe(true);
    expect(hasInvalidNumber('1,2,3', PT)).toBe(true);
    expect(hasInvalidNumber('', PT)).toBe(false);
    expect(hasInvalidNumber('150,', PT)).toBe(false);
  });

  it('lê horas com vírgula e com dois pontos', () => {
    expect(parseHours('8,5', PT)).toBe(8.5);
    expect(parseHours('8:30', PT)).toBe(8.5);
    expect(parseHours('8:', PT)).toBeNull();
    expect(parseHours('', PT)).toBeNull();
    expect(parseHours('8.5', 'en-US')).toBe(8.5);
  });
});

describe('números digitados em formulário', () => {
  it('recusa valores negativos', () => {
    expect(hasInvalidNumber('-50', PT)).toBe(true);
    expect(centsOrNull('-50', BRL)).toBeNull();
    expect(centsOrZero('-50', BRL)).toBe(0);
    expect(decimalOrNull('-3', PT)).toBeNull();
    expect(intOrNull('-2', PT)).toBeNull();
    expect(parseHours('-1', PT)).toBeNull();
  });

  it('continua aceitando zero e positivos', () => {
    expect(centsOrNull('0', BRL)).toBe(0);
    expect(centsOrNull('12,5', BRL)).toBe(1250);
    expect(decimalOrNull('45,5', PT)).toBe(45.5);
  });

  it('aceita a hora de início só de 0 a 23', () => {
    expect(hasInvalidHour('', PT)).toBe(false);
    expect(hasInvalidHour('0', PT)).toBe(false);
    expect(hasInvalidHour('23', PT)).toBe(false);
    expect(hasInvalidHour('24', PT)).toBe(true);
    expect(hasInvalidHour('8,5', PT)).toBe(true);
  });
});

describe('valores preenchidos ao editar', () => {
  it('mostra as horas como H:MM', () => {
    expect(hoursToInput(125)).toBe('02:05');
    expect(hoursToInput(480)).toBe('08:00');
    expect(parseHours(hoursToInput(125), PT)).toBeCloseTo(125 / 60);
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

describe('horas com minutos inválidos', () => {
  it('recusa minutos acima de 59', () => {
    expect(parseHours('08:75', 'pt-BR')).toBeNull();
  });
});
