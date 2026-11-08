import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ShiftDetailScreen from '@features/shifts/ShiftDetailScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: '7' }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));
jest.mock('@features/shifts/shiftQueries', () => ({
  removeShift: jest.fn(),
  loadShiftDetail: jest.fn(async () => ({
    shift: { id: 7, date: '2026-11-07', startHour: 6, minutes: 500, km: 116, costPerKm: 69 },
    earnings: [
      { platformId: 1, name: 'Uber', cents: 16400 },
      { platformId: 2, name: '99', cents: 10400 },
    ],
    expenses: [{ id: 3, category: 'food', cents: 3180 }],
    dayOffers: [],
    vehicleName: 'Meu carro',
  })),
}));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

describe('detalhe da jornada', () => {
  it('mostra o que sobrou, a conta e cada plataforma', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <ShiftDetailScreen />
      </SafeAreaProvider>,
    );

    expect(await screen.findByText('Sábado, 7 de novembro')).toBeTruthy();
    expect(screen.getByRole('header', { name: /^Sobrou · 0?6.* · Meu carro$/ })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'A conta' })).toBeTruthy();
    expect(screen.getByText('Ganhos')).toBeTruthy();
    expect(screen.getByText(/^Custo do carro · R\$\s0,69\/km$/)).toBeTruthy();
    expect(screen.getByLabelText(/^Uber, R\$\s164,00$/)).toBeTruthy();
  });
});
