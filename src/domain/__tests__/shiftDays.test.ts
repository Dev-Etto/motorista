import { buildWeek, groupShiftsByDay } from '@domain/shift/days';

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

  it('os lançamentos entram no dia deles. Só os que contam no lucro descontam', () => {
    const days = groupShiftsByDay(
      [{ id: 1, date: '2026-11-07', km: 116, profitCents: 18640 }],
      [
        { id: 9, date: '2026-11-07', cents: 19200, countable: false },
        { id: 8, date: '2026-11-07', cents: 1500, countable: true },
        { id: 7, date: '2026-11-05', cents: 2000, countable: true },
      ],
    );

    expect(days.map((day) => day.date)).toEqual(['2026-11-07', '2026-11-05']);
    expect(days[0]).toMatchObject({ profitCents: 17140 });
    expect(days[0]?.expenses.map((expense) => expense.id)).toEqual([9, 8]);
    expect(days[1]).toMatchObject({ shifts: [], profitCents: -2000 });
  });

  it('sem jornadas, sem dias', () => {
    expect(groupShiftsByDay([])).toEqual([]);
  });
});

describe('faixa da semana', () => {
  it('tem os 7 dias a partir do início, com o lucro de quem trabalhou', () => {
    const week = buildWeek('2026-11-02', [{ date: '2026-11-04', profitCents: 1000 }]);

    expect(week).toHaveLength(7);
    expect(week[0]).toEqual({ date: '2026-11-02', profitCents: null });
    expect(week[2]).toEqual({ date: '2026-11-04', profitCents: 1000 });
    expect(week[6]?.date).toBe('2026-11-08');
  });
});
