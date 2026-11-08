import { todayGoal } from '@domain/goal/todayGoal';

describe('meta de hoje no Início', () => {
  it('diz quanto da meta do dia já foi e quanto falta', () => {
    expect(todayGoal({ todayIsWorkDay: true, dailyTargetCents: 30000, profitTodayCents: 18640 })).toEqual({
      percent: 62,
      remainingCents: 11360,
      progress: 18640 / 30000,
    });
  });

  it('passando da meta, não falta nada e a barra fica cheia', () => {
    expect(todayGoal({ todayIsWorkDay: true, dailyTargetCents: 30000, profitTodayCents: 36000 })).toMatchObject({
      percent: 120,
      remainingCents: 0,
      progress: 1,
    });
  });

  it('prejuízo conta como zero da meta', () => {
    expect(todayGoal({ todayIsWorkDay: true, dailyTargetCents: 30000, profitTodayCents: -500 })).toMatchObject({ percent: 0, remainingCents: 30500 });
  });

  it('sem meta do dia ou em dia de folga, não mostra', () => {
    expect(todayGoal({ todayIsWorkDay: false, dailyTargetCents: 30000, profitTodayCents: 0 })).toBeNull();
    expect(todayGoal({ todayIsWorkDay: true, dailyTargetCents: null, profitTodayCents: 0 })).toBeNull();
  });
});
