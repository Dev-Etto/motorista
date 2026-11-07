import { completeDecimals, maskDecimal, maskDuration, maskInteger } from '@shared/utils/inputMask';

const PT = 'pt-BR';
const EN = 'en-US';

describe('máscara de número', () => {
  it('agrupa milhares e aceita ponto ou vírgula como separador decimal', () => {
    expect(maskDecimal('1234', PT, 2)).toBe('1.234');
    expect(maskDecimal('1234.', PT, 2)).toBe('1.234,');
    expect(maskDecimal('1.234,567', PT, 2)).toBe('1.234,56');
    expect(maskDecimal('12,', EN, 2)).toBe('12.');
    expect(maskDecimal('1,234.5', EN, 2)).toBe('1,234.5');
  });

  it('descarta letras e símbolos', () => {
    expect(maskDecimal('R$ 1a2b', PT, 2)).toBe('12');
    expect(maskDecimal('-5', PT, 2)).toBe('5');
  });

  it('tira zeros à esquerda e completa a parte inteira', () => {
    expect(maskDecimal('007', PT, 2)).toBe('7');
    expect(maskDecimal(',5', PT, 2)).toBe('0,5');
  });

  it('apagar a vírgula não vira outro número', () => {
    expect(maskDecimal('1.23456', PT, 2)).toBe('123.456');
  });

  it('sem casas decimais, ignora o separador', () => {
    expect(maskDecimal('12,5', PT, 0)).toBe('125');
  });

  it('completa as casas do dinheiro', () => {
    expect(completeDecimals('25', PT, 2)).toBe('25,00');
    expect(completeDecimals('1.234,5', PT, 2)).toBe('1.234,50');
  });
});

describe('máscara de inteiro e de duração', () => {
  it('aceita só dígitos', () => {
    expect(maskInteger('1a2', 2)).toBe('12');
    expect(maskInteger('123', 2)).toBe('12');
  });

  it('formata horas e minutos', () => {
    expect(maskDuration('8')).toBe('8');
    expect(maskDuration('083')).toBe('08:3');
    expect(maskDuration('0830')).toBe('08:30');
    expect(maskDuration('08:305')).toBe('08:30');
  });
});
