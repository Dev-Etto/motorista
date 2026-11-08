import { groupShiftsByDay } from '@domain/shift/days';

describe('jornadas por dia', () => {
  it('agrupa por dia, do mais recente ao mais antigo, somando km e lucro', () => {
    const days = groupShiftsByDay([
      { id: 1, date: '2026-11-06', km: 142, profitCents: 23110 },
      { id: 2, date: '2026-11-07', km: 80, profitCents: 12000 },
      { id: 3, date: '2026-11-07', km: null, profitCents: 6640 },
    ]);

    expect(days.map((day) => day.date)).toEqual(['2026-11-07', '2026-11-06']);
    expect(days[0]).toMatchObject({ km: 80, profitCents: 18640 });
    expect(days[0]?.shifts.map((shift) => shift.id)).toEqual([2, 3]);
  });

  it('sem jornadas, sem dias', () => {
    expect(groupShiftsByDay([])).toEqual([]);
  });
});
