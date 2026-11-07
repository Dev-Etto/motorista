export type ExpenseCategory = 'fuel' | 'maintenance' | 'toll' | 'parking' | 'wash' | 'food' | 'other';

export function countsAgainstProfit(category: ExpenseCategory): boolean {
  return category !== 'fuel' && category !== 'maintenance';
}
