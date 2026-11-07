import { validateGoalForm } from '@features/goals/goalForm';
import { currentFormat } from '@shared/i18n/format';

const VALID = { desired: '3.000,00', hoursPerDay: '8', weekdays: [1, 2, 3], dayTarget: '' };

describe('formulário da meta', () => {
  it('formulário válido não tem erros', () => {
    expect(validateGoalForm(VALID, currentFormat())).toEqual({});
  });

  it('cada problema fica no próprio campo', () => {
    const errors = validateGoalForm({ desired: '', hoursPerDay: '30', weekdays: [], dayTarget: 'abc' }, currentFormat());
    expect(errors).toEqual({ desired: true, hoursPerDay: true, weekdays: true, dayTarget: true });
  });
});
