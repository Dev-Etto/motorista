import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ExpenseFormScreen from '@features/expenses/ExpenseFormScreen';
import { removeExpense, saveExpense } from '@features/expenses/saveExpense';
import { confirmAction } from '@shared/ui/dialog';

const mockBack = jest.fn();
const mockParams: { id?: string; category?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
}));
jest.mock('@shared/ui/dialog', () => ({ confirmAction: jest.fn() }));
jest.mock('@features/expenses/saveExpense', () => ({
  findExpense: jest.fn().mockResolvedValue({ id: 7, date: '2026-11-03', category: 'other', cents: 1500, liters: null, odometer: null, note: 'Café' }),
  saveExpense: jest.fn(),
  removeExpense: jest.fn(),
}));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderForm = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ExpenseFormScreen />
    </SafeAreaProvider>,
  );

describe('editar lançamento avulso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete mockParams.category;
    mockParams.id = '7';
  });

  it('abre com os dados do lançamento e salva nele mesmo', async () => {
    await renderForm();
    expect(await screen.findByDisplayValue('Café')).toBeTruthy();

    await fireEvent.press(screen.getByText('Salvar'));

    expect(saveExpense).toHaveBeenCalledWith(expect.objectContaining({ category: 'other', cents: 1500, note: 'Café' }), 7);
    expect(mockBack).toHaveBeenCalled();
  });

  it('excluir pede confirmação', async () => {
    await renderForm();
    await screen.findByDisplayValue('Café');

    await fireEvent.press(screen.getByText('Excluir'));
    expect(removeExpense).not.toHaveBeenCalled();

    await jest.mocked(confirmAction).mock.calls[0]?.[0].onConfirm();
    expect(removeExpense).toHaveBeenCalledWith(7);
  });

  it('novo lançamento não mostra excluir', async () => {
    delete mockParams.id;
    mockParams.category = 'other';
    await renderForm();

    expect(screen.queryByText('Excluir')).toBeNull();
  });
});
