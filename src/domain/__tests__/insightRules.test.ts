import { addDays, weekdayName, weekdayOf } from '@/shared/utils/dates';
import { bestWeekdayRule, realProfitRule } from '../insights/rules';
import { ShiftFact } from '../insights/types';

const TODAY = '2026-11-28';

const shift = (date: string, grossCents: number, over: Partial<ShiftFact> = {}): ShiftFact => ({
  date,
  startHour: 8,
  minutes: 60,
  km: 10,
  grossCents,
  expensesCents: 0,
  costPerKm: 100,
  earnings: [],
  ...over,
});

const context = (shifts: ShiftFact[]) => ({ today: TODAY, shifts, costs: null, plannedKmMonth: 0, fuelPaidCents: 0, fuelKm: 0 });

describe('melhor dia nas últimas 4 semanas', () => {
  const weak = [shift(addDays(TODAY, -7), 2000), shift(addDays(TODAY, -14), 2000)];
  const strong = [shift(addDays(TODAY, -1), 9000), shift(addDays(TODAY, -8), 9000)];
  const strongDay = weekdayName(weekdayOf(addDays(TODAY, -1)));

  it('considera só os 28 dias até hoje', () => {
    const outside = [shift(addDays(TODAY, -28), 900000), shift(addDays(TODAY, 7), 900000)];

    expect(bestWeekdayRule(context([...weak, ...strong, ...outside]))?.message).toContain(strongDay);
  });
});

describe('lucro real nas regras', () => {
  it('usa a mesma conta da jornada, sem custo para km negativo', () => {
    const insight = realProfitRule(context([shift(TODAY, 10000, { km: -5 })]));

    expect(insight?.basis).toContain('lucro R$ 100,00');
  });
});
