import { expenseRepository } from '@data/repositories/expenseRepository';

export type ExpenseInput = Parameters<typeof expenseRepository.add>[0];

export const saveExpense = (input: ExpenseInput, id?: number) => (id ? expenseRepository.update(id, input) : expenseRepository.add(input));

export const findExpense = (id: number) => expenseRepository.find(id);

export const removeExpense = (id: number) => expenseRepository.remove(id);
