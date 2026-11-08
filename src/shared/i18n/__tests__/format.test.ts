import { act, renderHook } from '@testing-library/react-native';
import { createFormatter, currentFormat, DEFAULT_FORMAT, setActiveFormat, useFormat } from '@shared/i18n/format';

const brazil = createFormatter(DEFAULT_FORMAT);
const unitedStates = createFormatter({
  language: 'en',
  locale: 'en-US',
  currency: 'USD',
  distanceUnit: 'mi',
  volumeUnit: 'gal',
  consumptionUnit: 'mpg',
  firstWeekday: 7,
  hourCycle: 'h12',
});

afterEach(() => setActiveFormat(DEFAULT_FORMAT));

describe('formatador em português, real e quilômetro', () => {
  it('mantém os textos de antes', () => {
    expect(brazil.money(123456)).toBe('R$ 1.234,56');
    expect(brazil.perDistance(81)).toBe('R$ 0,81/km');
    expect(brazil.perHour(2306)).toBe('R$ 23,06/h');
    expect(brazil.perHour(null)).toBe('—');
    expect(brazil.distance(150.44)).toBe('150,4 km');
    expect(brazil.date('2026-11-05')).toBe('05/11/2026');
    expect(brazil.weekday(1)).toBe('Segunda');
    expect(brazil.hourOfDay(20)).toBe('20h');
    expect(brazil.currencySymbol).toBe('R$');
    expect(brazil.moneyInput(0)).toBe('0,00');
  });
});

describe('formatador em inglês, dólar e milha', () => {
  it('mostra distância e preço por milha', () => {
    expect(unitedStates.distance(160.9344)).toBe('100.0 mi');
    expect(unitedStates.perDistance(100)).toBe('$1.61/mi');
    expect(unitedStates.perDistanceLabel).toBe('$/mi');
  });

  it('lê a distância digitada em milhas e guarda em km', () => {
    expect(unitedStates.parseDistance('100')).toBeCloseTo(160.9344, 6);
    expect(unitedStates.distanceInput(160.9344)).toBe('100');
  });

  it('lê o mínimo por milha e guarda por km sem perder a fração do centavo', () => {
    expect(unitedStates.parsePerDistance('3.20')).toBeCloseTo(198.839, 3);
    expect(unitedStates.perDistanceInput(199)).toBe('3.20');
    expect(unitedStates.perDistanceInput(unitedStates.parsePerDistance('3.00') ?? 0)).toBe('3.00');
  });

  it('converte combustível em galão e consumo em mpg', () => {
    expect(unitedStates.perVolumeOrZero('3.79')).toBeCloseTo(100.121, 3);
    expect(unitedStates.perVolumeInput(unitedStates.perVolumeOrZero('3.49'))).toBe('3.49');
    expect(unitedStates.consumptionInput(10)).toBe('23.52');
    expect(unitedStates.consumptionOrZero('23.52')).toBeCloseTo(10, 2);
    expect(unitedStates.parseVolume('1')).toBeCloseTo(3.785411784, 9);
  });

  it('começa a semana no domingo', () => {
    expect(unitedStates.weekdays()[0]).toBe(0);
    expect(unitedStates.weekBounds('2026-11-05')).toEqual({ start: '2026-11-01', end: '2026-11-07' });
  });
});

describe('formatador ativo', () => {
  it('troca e avisa quem usa o hook', async () => {
    const { result } = await renderHook(() => useFormat());
    expect(result.current.money(100)).toBe('R$ 1,00');

    await act(async () => setActiveFormat({ ...DEFAULT_FORMAT, locale: 'en-US', currency: 'USD' }));

    expect(result.current.money(100)).toBe('$1.00');
    expect(currentFormat().money(100)).toBe('$1.00');
  });
});

describe('nomes de mês seguem o idioma', () => {
  it('inglês com formato brasileiro escreve o mês em inglês e a data no padrão brasileiro', () => {
    const mixed = createFormatter({ ...DEFAULT_FORMAT, language: 'en' });
    expect(mixed.month('2026-11-05')).toBe('November 2026');
    expect(mixed.date('2026-11-05')).toBe('05/11/2026');
    expect(mixed.money(123456)).toBe('R$ 1.234,56');
  });
});
