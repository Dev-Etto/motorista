import { isShiftForgotten, minutesUntil, suggestedStopAt } from '@domain/shift/forgotten';
import { nextClockTime } from '@shared/utils/dates';
import { profitTone } from '@shared/utils/format';
import { MS_PER_HOUR } from '@shared/utils/time';

const START = new Date(2026, 10, 7, 8, 0).getTime();

describe('jornada esquecida', () => {
  it('é esquecida com 14 h ou mais, mesmo pausada', () => {
    expect(isShiftForgotten(true, 14 * MS_PER_HOUR)).toBe(true);
    expect(isShiftForgotten(true, 13 * MS_PER_HOUR)).toBe(false);
    expect(isShiftForgotten(false, 20 * MS_PER_HOUR)).toBe(false);
  });

  it('sugere a parada pelas horas da meta ou 8 h', () => {
    expect(suggestedStopAt(START, 10)).toBe(START + 10 * MS_PER_HOUR);
    expect(suggestedStopAt(START, null)).toBe(START + 8 * MS_PER_HOUR);
  });

  it('a hora de parada é a próxima depois do início, mesmo no dia seguinte', () => {
    const sameDay = nextClockTime(START, 18 * 60);
    expect(minutesUntil(START, sameDay)).toBe(10 * 60);

    const nextDay = nextClockTime(START, 2 * 60);
    expect(minutesUntil(START, nextDay)).toBe(18 * 60);
  });

  it('lucro zero fica em tom neutro', () => {
    expect(profitTone(0)).toBe('default');
    expect(profitTone(100)).toBe('positive');
    expect(profitTone(-1)).toBe('negative');
  });
});
