export type ExpenseField = 'value' | 'liters' | 'odometer';

export type ExpenseFieldError = 'required' | 'invalid';

export interface ExpenseFormCheck {
  cents: number | null;
  litersInvalid: boolean;
  odometerInvalid: boolean;
}

export function expenseFormErrors(check: ExpenseFormCheck): Partial<Record<ExpenseField, ExpenseFieldError>> {
  return {
    ...(check.cents ? {} : { value: 'required' }),
    ...(check.litersInvalid ? { liters: 'invalid' } : {}),
    ...(check.odometerInvalid ? { odometer: 'invalid' } : {}),
  };
}
