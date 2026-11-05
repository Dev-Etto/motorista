import { describeGoalDay, describePartialShifts, GoalDayFacts } from '../goalMessages';

const facts = (over: Partial<GoalDayFacts> = {}): GoalDayFacts => ({
  reached: false,
  surplusCents: 0,
  remainingCents: 200000,
  workDaysLeft: 10,
  todayIsWorkDay: true,
  dailyTargetCents: 20000,
  leftTodayCents: 5000,
  grossForDayCents: 33000,
  plannedKmPerDay: 160,
  ...over,
});

describe('frases da meta', () => {
  it('em dia de trabalho, diz quanto falta hoje e o que isso exige', () => {
    const text = describeGoalDay(facts());
    expect(text).toContain('Faltam R$ 50,00 de lucro hoje.');
    expect(text).toContain('cerca de R$ 330,00 de faturamento no dia, rodando 160 km');
    expect(text).toContain('Restam 10 dias de trabalho no mês, contando hoje.');
  });

  it('sem veículo, não inventa o faturamento', () => {
    expect(describeGoalDay(facts({ grossForDayCents: null }))).not.toContain('faturamento');
  });

  it('avisa quando a meta do dia foi batida', () => {
    expect(describeGoalDay(facts({ leftTodayCents: 0 }))).toContain('Meta de hoje batida');
  });

  it('avisa quando a meta do mês foi batida, com o que passou', () => {
    expect(describeGoalDay(facts({ reached: true, surplusCents: 12000 }))).toBe('Meta batida. Você já lucrou R$ 120,00 acima dela.');
    expect(describeGoalDay(facts({ reached: true }))).toBe('Meta batida.');
  });

  it('explica o dia de folga', () => {
    const text = describeGoalDay(facts({ todayIsWorkDay: false, workDaysLeft: 1 }));
    expect(text).toContain('Hoje não é dia de trabalho');
    expect(text).toContain('No último dia de trabalho do mês, o objetivo é lucrar R$ 200,00.');
    expect(describeGoalDay(facts({ todayIsWorkDay: false }))).toContain('Nos próximos 10 dias de trabalho, o objetivo é lucrar R$ 200,00 por dia.');
  });

  it('avisa no último dia de trabalho do mês', () => {
    expect(describeGoalDay(facts({ workDaysLeft: 1 }))).toContain('Hoje é o último dia de trabalho do mês.');
  });

  it('explica quando não há mais dias', () => {
    expect(describeGoalDay(facts({ dailyTargetCents: null, workDaysLeft: 0 }))).toContain('Faltaram R$ 2.000,00');
  });

  it('avisa sobre jornadas sem custo', () => {
    expect(describePartialShifts(1)).toContain('1 jornada');
    expect(describePartialShifts(2)).toContain('2 jornadas');
  });
});
