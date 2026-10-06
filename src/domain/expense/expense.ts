export type ExpenseCategory = 'fuel' | 'maintenance' | 'toll' | 'parking' | 'wash' | 'food' | 'other';

export const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  fuel: 'Abastecimento',
  maintenance: 'Manutenção',
  toll: 'Pedágio',
  parking: 'Estacionamento',
  wash: 'Lavagem',
  food: 'Alimentação',
  other: 'Outra despesa',
};

export function countsAgainstProfit(category: ExpenseCategory): boolean {
  return category !== 'fuel' && category !== 'maintenance';
}
