import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fuelPriceSuggestion, updateFuelPrice } from '@application/vehicles';
import ExpenseFormScreen from '@features/expenses/ExpenseFormScreen';
import { removeExpense, saveExpense } from '@features/expenses/saveExpense';
import { confirmAction, showDialog } from '@shared/ui/dialog';

const mockBack = jest.fn();
const mockParams: { id?: string; category?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
  usePreventRemove: () => jest.fn(),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));
jest.mock('@shared/ui/dialog', () => ({ confirmAction: jest.fn(), showDialog: jest.fn() }));
jest.mock('@application/vehicleInUse', () => ({ vehicleInUse: jest.fn().mockResolvedValue({ id: 2, name: 'Moto' }) }));
jest.mock('@application/vehicles', () => ({ fuelPriceSuggestion: jest.fn().mockResolvedValue(null), updateFuelPrice: jest.fn() }));
jest.mock('@data/repositories/vehicleRepository', () => ({
  vehicleRepository: {
    list: jest.fn().mockResolvedValue([
      { id: 1, name: 'Carro' },
      { id: 2, name: 'Moto' },
    ]),
  },
}));
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

    expect(saveExpense).toHaveBeenCalledWith(expect.objectContaining({ category: 'other', cents: 1500, note: 'Café', vehicle_id: 2 }), 7);
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

  it('com mais de um veículo, escolhe o veículo, marcando o em uso', async () => {
    delete mockParams.id;
    await renderForm();

    expect(await screen.findByText('Moto')).toBeTruthy();
    expect(screen.getByText('Carro')).toBeTruthy();
  });

  it('abastecimento com outro preço por litro oferece atualizar o custo do veículo', async () => {
    delete mockParams.id;
    mockParams.category = 'fuel';
    jest.mocked(fuelPriceSuggestion).mockResolvedValueOnce({ vehicle: { id: 2, name: 'Moto' }, priceCents: 650 } as never);
    await renderForm();
    await screen.findByText('Moto');

    await fireEvent.changeText(screen.getByLabelText(/Valor/), '13000');
    await fireEvent.press(screen.getByText('Salvar'));

    expect(mockBack).toHaveBeenCalled();
    const options = jest.mocked(showDialog).mock.calls[0]?.[0];
    expect(options?.title).toBe('Atualizar o preço do combustível do Moto?');
    await options?.actions[1]?.onPress?.();
    expect(updateFuelPrice).toHaveBeenCalledWith(2, 650);
  });
});
