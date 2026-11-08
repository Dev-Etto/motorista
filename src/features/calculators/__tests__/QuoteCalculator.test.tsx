import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { QuoteCalculator } from '@features/calculators/QuoteCalculator';
import { showDialog } from '@shared/ui/dialog';

jest.mock('@shared/ui/dialog', () => ({ showDialog: jest.fn(), confirmAction: jest.fn() }));
jest.mock('@features/calculators/useMinimumPerHour', () => ({ useMinimumPerHour: () => 4500 }));
jest.mock('@features/calculators/useSavedQuotes', () => ({
  useSavedQuotes: () => ({
    state: {
      data: [{ id: 3, createdAt: 1, label: 'Aeroporto', priceCents: 8000, fields: { kmTrip: '25', label: 'Aeroporto' } }],
      loading: false,
      error: null,
      reload: jest.fn(),
    },
    save: jest.fn(),
    remove: jest.fn(),
  }),
}));

describe('orçamento de corrida particular', () => {
  it('o lucro por hora começa pelo mínimo por hora das ofertas', async () => {
    await render(<QuoteCalculator costPerKm={80} />);
    await fireEvent.press(screen.getByText('Mais opções'));

    expect(screen.getByDisplayValue('45,00')).toBeTruthy();
  });

  it('tocar num orçamento salvo oferece abrir e carrega os valores', async () => {
    await render(<QuoteCalculator costPerKm={80} />);

    await fireEvent.press(screen.getByText('Aeroporto'));
    const options = jest.mocked(showDialog).mock.calls.at(-1)?.[0];
    expect(options?.actions.map((action) => action.label)).toEqual(['Abrir', 'Remover', 'Cancelar']);

    await act(async () => jest.mocked(showDialog).mock.calls.at(-1)?.[0].actions[0]?.onPress?.());
    expect(screen.getByDisplayValue('25')).toBeTruthy();
  });
});
