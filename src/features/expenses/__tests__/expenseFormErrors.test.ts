import { expenseFormErrors } from '@features/expenses/expenseFormErrors';

describe('erros do formulário de despesa', () => {
  it('cada problema fica no próprio campo', () => {
    expect(expenseFormErrors({ cents: null, litersInvalid: true, odometerInvalid: true })).toEqual({
      value: 'required',
      liters: 'invalid',
      odometer: 'invalid',
    });
  });

  it('odômetro inválido não aparece no campo de valor', () => {
    expect(expenseFormErrors({ cents: 5000, litersInvalid: false, odometerInvalid: true })).toEqual({ odometer: 'invalid' });
  });

  it('formulário certo não tem erro', () => {
    expect(expenseFormErrors({ cents: 5000, litersInvalid: false, odometerInvalid: false })).toEqual({});
  });
});
