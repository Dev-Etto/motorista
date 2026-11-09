import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { QuoteCalculator } from '@features/calculators/QuoteCalculator';
import { showDialog } from '@shared/ui/dialog';

jest.mock('expo-router', () => ({
  Stack: { Screen: ({ options }: { options: { headerRight?: () => ReactNode } }) => options.headerRight?.() ?? null },
}));
jest.mock('@shared/ui/dialog', () => ({ showDialog: jest.fn(), confirmAction: jest.fn() }));
jest.mock('@features/calculators/useMinimumPerHour', () => ({ useMinimumPerHour: () => 4500 }));
jest.mock('@features/calculators/useSavedQuotes', () => ({
  useSavedQuotes: () => ({
    state: {
      data: [{ id: 3, createdAt: 1, label: 'Aeroporto', priceCents: 8000, fields: { kmTrip: '25', kmReturn: '25', label: 'Aeroporto' } }],
      loading: false,
      error: null,
      reload: jest.fn(),
    },
    save: jest.fn(),
    remove: jest.fn(),
  }),
}));

describe('orçamento de corrida particular', () => {
  it('pede para quem, os km e o tempo, e guarda pedágio e extras recolhidos', async () => {
    await render(<QuoteCalculator costPerKm={80} />);

    expect(screen.getByText('Para quem ou para onde')).toBeTruthy();
    expect(screen.getByText('Até buscar')).toBeTruthy();
    expect(screen.getByText('Viagem')).toBeTruthy();
    expect(screen.getByText('Tempo')).toBeTruthy();
    expect(screen.getByText('Contar a volta vazia')).toBeTruthy();
    expect(screen.queryByText('Pedágio')).toBeNull();
  });

  it('o lucro por hora começa pelo mínimo por hora das ofertas', async () => {
    await render(<QuoteCalculator costPerKm={80} />);
    await fireEvent.press(screen.getByText('Pedágio, extras e valor mínimo'));

    expect(screen.getByDisplayValue('45,00')).toBeTruthy();
  });

  it('mostra quanto cobrar, os km cobertos e conta a volta vazia', async () => {
    await render(<QuoteCalculator costPerKm={80} />);
    await fireEvent.changeText(screen.getByLabelText('Até buscar, km'), '3');
    await fireEvent.changeText(screen.getByLabelText('Viagem, km'), '25');
    await fireEvent.changeText(screen.getByLabelText('Tempo, min'), '45');

    expect(screen.getByText('Cobre')).toBeTruthy();
    expect(screen.getByText(/Cobre o veículo em 28 km e paga R\$ 45,00\/h, seu mínimo por hora/)).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
    expect(screen.getByText('Enviar ao cliente')).toBeTruthy();

    await fireEvent(screen.getByLabelText('Contar a volta vazia'), 'valueChange', true);
    expect(screen.getByText(/Cobre o veículo em 53 km/)).toBeTruthy();
  });

  it('Salvos no topo mostra os orçamentos, e abrir um carrega os valores', async () => {
    await render(<QuoteCalculator costPerKm={80} />);
    expect(screen.queryByText('Aeroporto')).toBeNull();

    await fireEvent.press(screen.getByText('Salvo (1)'));
    await fireEvent.press(screen.getByText('Aeroporto'));
    const options = jest.mocked(showDialog).mock.calls.at(-1)?.[0];
    expect(options?.actions.map((action) => action.label)).toEqual(['Abrir', 'Remover', 'Cancelar']);

    await act(async () => jest.mocked(showDialog).mock.calls.at(-1)?.[0].actions[0]?.onPress?.());
    expect(screen.getByDisplayValue('25')).toBeTruthy();
    expect(screen.getByLabelText('Contar a volta vazia').props.value).toBe(true);
  });
});
