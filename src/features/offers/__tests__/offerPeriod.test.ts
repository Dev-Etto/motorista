import { defaultCustomDates, periodRange } from '@features/offers/offerPeriod';
import { addDays, dayRange } from '@shared/utils/dates';

const TODAY = '2026-11-05';
const CUSTOM = { start: '2026-01-10', end: '2026-03-20' };

describe('período das ofertas', () => {
  it('cobre um dia em hoje e ontem', () => {
    expect(periodRange('today', TODAY, CUSTOM)).toEqual(dayRange(TODAY));
    expect(periodRange('yesterday', TODAY, CUSTOM)).toEqual(dayRange('2026-11-04'));
  });

  it('cobre 7 e 30 dias contando com hoje', () => {
    expect(periodRange('week', TODAY, CUSTOM)).toEqual({ from: dayRange(addDays(TODAY, -6)).from, to: dayRange(TODAY).to });
    expect(periodRange('month', TODAY, CUSTOM)).toEqual({ from: dayRange(addDays(TODAY, -29)).from, to: dayRange(TODAY).to });
  });

  it('usa as datas escolhidas, inclusive o último dia', () => {
    expect(periodRange('custom', TODAY, CUSTOM)).toEqual({ from: dayRange('2026-01-10').from, to: dayRange('2026-03-20').to });
  });

  it('aceita as datas invertidas', () => {
    expect(periodRange('custom', TODAY, { start: '2026-03-20', end: '2026-01-10' })).toEqual({
      from: dayRange('2026-01-10').from,
      to: dayRange('2026-03-20').to,
    });
  });

  it('sugere os últimos 30 dias ao escolher datas', () => {
    expect(defaultCustomDates(TODAY)).toEqual({ start: addDays(TODAY, -29), end: TODAY });
  });
});
