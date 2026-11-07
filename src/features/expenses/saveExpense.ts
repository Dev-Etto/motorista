import { expenseRepository } from '@/data/repositories/expenseRepository';

export const saveExpense = (input: Parameters<typeof expenseRepository.add>[0]) => expenseRepository.add(input);
