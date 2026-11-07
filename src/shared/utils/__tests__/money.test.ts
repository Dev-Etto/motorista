import { Money, type MoneyFormat } from '@shared/utils/money';

const BRL: MoneyFormat = { locale: 'pt-BR', currency: 'BRL' };

describe('Money', () => {
  it('formata em reais', () => {
    expect(Money.fromCents(123456).format(BRL)).toBe('R$ 1.234,56');
    expect(Money.fromCents(-1234).format(BRL)).toBe('-R$ 12,34');
    expect(Money.fromCents(5).format(BRL)).toBe('R$ 0,05');
    expect(Money.fromCents(0).format(BRL)).toBe('R$ 0,00');
    expect(Money.fromCents(123456789).format(BRL)).toBe('R$ 1.234.567,89');
  });

  it('não mostra zero negativo', () => {
    expect(Money.fromCents(-0.4).format(BRL)).toBe('R$ 0,00');
    expect(Money.fromCents(99.5).format(BRL)).toBe('R$ 1,00');
    expect(Money.fromCents(-40).formatWhole(BRL)).toBe('R$ 0');
  });

  it('formata o valor inteiro', () => {
    expect(Money.fromCents(9149).formatWhole(BRL)).toBe('R$ 91');
    expect(Money.fromCents(9150).formatWhole(BRL)).toBe('R$ 92');
  });

  it('mantém fração de centavo nas contas e arredonda ao formatar', () => {
    const rate = Money.fromCents(95.8333);
    expect(rate.times(3).cents).toBeCloseTo(287.4999, 3);
    expect(rate.format(BRL)).toBe('R$ 0,96');
  });

  it('soma, subtrai e divide sem perder centavos', () => {
    const total = Money.fromCents(10).plus(Money.fromCents(20)).minus(Money.fromCents(5));
    expect(total.cents).toBe(25);
    expect(Money.fromCents(1000).dividedBy(3).cents).toBeCloseTo(333.3333, 3);
    expect(Money.fromCents(-1).isNegative()).toBe(true);
  });

  it('lê o texto digitado', () => {
    expect(Money.parse('1.234,56', BRL)?.cents).toBe(123456);
    expect(Money.parse('1.234', BRL)?.cents).toBe(123400);
    expect(Money.parse('12,5', BRL)?.cents).toBe(1250);
    expect(Money.parse('R$ 150,', BRL)?.cents).toBe(15000);
    expect(Money.parse('-1.234', BRL)?.cents).toBe(-123400);
    expect(Money.parse('abc', BRL)).toBeNull();
    expect(Money.parse('', BRL)).toBeNull();
  });

  it('mostra o valor no campo de edição', () => {
    expect(Money.fromCents(123456).toInput(BRL)).toBe('1.234,56');
    expect(Money.fromCents(5).toInput(BRL)).toBe('0,05');
    expect(Money.fromCents(1250).toInput(BRL)).toBe('12,50');
  });
});

describe('dinheiro por região e moeda', () => {
  it.each<[MoneyFormat, string, string, string, string]>([
    [BRL, 'R$ 1.234,56', '-R$ 12,34', 'R$ 92', '1.234,56'],
    [{ locale: 'en-US', currency: 'USD' }, '$1,234.56', '-$12.34', '$92', '1,234.56'],
    [{ locale: 'es-MX', currency: 'MXN' }, '$1,234.56', '-$12.34', '$92', '1,234.56'],
    [{ locale: 'es-ES', currency: 'EUR' }, '1234,56 €', '-12,34 €', '92 €', '1234,56'],
    [{ locale: 'es-CL', currency: 'CLP' }, '$1.235', '$-12', '$92', '1.235'],
    [{ locale: 'pt-BR', currency: 'USD' }, 'US$ 1.234,56', '-US$ 12,34', 'US$ 92', '1.234,56'],
  ])('%o', (spec, positive, negative, whole, input) => {
    expect(Money.fromCents(123456).format(spec)).toBe(positive);
    expect(Money.fromCents(-1234).format(spec)).toBe(negative);
    expect(Money.fromCents(9150).formatWhole(spec)).toBe(whole);
    expect(Money.fromCents(123456).toInput(spec)).toBe(input);
    expect(Money.parse(input, spec)?.toInput(spec)).toBe(input);
  });

  it('lê o valor com o separador de cada região e ignora o símbolo', () => {
    expect(Money.parse('$1,234.56', { locale: 'en-US', currency: 'USD' })?.cents).toBe(123456);
    expect(Money.parse('1234,56 €', { locale: 'es-ES', currency: 'EUR' })?.cents).toBe(123456);
    expect(Money.parse('12.5', { locale: 'en-US', currency: 'USD' })?.cents).toBe(1250);
  });
});
