import { centsToInput, formatBRL, formatNumber, Money, parseBRL } from '../money';

describe('Money', () => {
  it('formata em reais', () => {
    expect(Money.fromCents(123456).format()).toBe('R$ 1.234,56');
    expect(Money.fromCents(-1234).format()).toBe('-R$ 12,34');
    expect(Money.fromCents(5).format()).toBe('R$ 0,05');
    expect(Money.fromCents(0).format()).toBe('R$ 0,00');
    expect(Money.fromCents(123456789).format()).toBe('R$ 1.234.567,89');
  });

  it('formata o valor inteiro', () => {
    expect(Money.fromCents(9149).formatWhole()).toBe('R$ 91');
    expect(Money.fromCents(9150).formatWhole()).toBe('R$ 92');
  });

  it('mantém fração de centavo nas contas e arredonda ao formatar', () => {
    const rate = Money.fromCents(95.8333);
    expect(rate.times(3).cents).toBeCloseTo(287.4999, 3);
    expect(rate.format()).toBe('R$ 0,96');
  });

  it('soma, subtrai e divide sem perder centavos', () => {
    const total = Money.fromCents(10).plus(Money.fromCents(20)).minus(Money.fromCents(5));
    expect(total.cents).toBe(25);
    expect(Money.fromCents(1000).dividedBy(3).cents).toBeCloseTo(333.3333, 3);
    expect(Money.fromCents(-1).isNegative()).toBe(true);
  });

  it('lê o texto digitado', () => {
    expect(Money.parse('1.234,56')?.cents).toBe(123456);
    expect(Money.parse('1.234')?.cents).toBe(123400);
    expect(Money.parse('12,5')?.cents).toBe(1250);
    expect(Money.parse('R$ 150,')?.cents).toBe(15000);
    expect(Money.parse('-1.234')?.cents).toBe(-123400);
    expect(Money.parse('abc')).toBeNull();
    expect(Money.parse('')).toBeNull();
  });

  it('mostra o valor no campo de edição', () => {
    expect(Money.fromCents(123456).toInput()).toBe('1234,56');
    expect(Money.fromCents(5).toInput()).toBe('0,05');
  });
});

describe('atalhos de dinheiro', () => {
  it('mantêm o formato de antes', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(-0.4)).toBe('R$ 0,00');
    expect(formatBRL(99.5)).toBe('R$ 1,00');
    expect(centsToInput(1250)).toBe('12,50');
    expect(parseBRL('12,5')).toBe(1250);
    expect(formatNumber(1234.56, 1)).toBe('1.234,6');
  });
});
