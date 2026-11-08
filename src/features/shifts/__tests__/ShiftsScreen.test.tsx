import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ShiftsScreen from '@features/shifts/ShiftsScreen';
import { showDialog } from '@shared/ui/dialog';
import { addDays, monthBounds, today } from '@shared/utils/dates';

const mockPush = jest.fn();
const MOCK_FIRST_DAY = monthBounds(today()).start;
const MOCK_SECOND_DAY = addDays(MOCK_FIRST_DAY, 1);
const mockShifts: { list: object[] } = { list: [] };
const shiftOn = (id: number, date: string, startHour: number | null) => ({
  id,
  date,
  startHour,
  minutes: 240,
  km: 100,
  grossCents: 30000,
  expensesCents: 0,
  costPerKm: 50,
  partial: false,
  vehicleId: 1,
  earnings: [],
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));
jest.mock('@shared/ui/dialog', () => ({ showDialog: jest.fn() }));
jest.mock('@features/reports', () => ({
  ReportSummary: () => {
    const { Text } = jest.requireActual('react-native');
    return <Text>Resumo do período</Text>;
  },
}));
jest.mock('@features/shifts/shiftQueries', () => ({
  loadMonth: jest.fn(async () => ({
    shifts: mockShifts.list,
    expenses: [
      { id: 1, date: MOCK_FIRST_DAY, category: 'fuel', cents: 20000 },
      { id: 2, date: MOCK_SECOND_DAY, category: 'other', cents: 1500 },
    ],
  })),
}));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ShiftsScreen />
    </SafeAreaProvider>,
  );

describe('tela Jornadas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShifts.list = [];
  });

  it('um botão Adicionar oferece jornada, abastecimento e outra despesa', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Adicionar'));

    const labels = jest.mocked(showDialog).mock.calls[0]?.[0].actions.map((action) => action.label);
    expect(labels).toEqual(['Jornada', 'Abastecimento', 'Outra despesa', 'Cancelar']);
  });

  it('tocar num lançamento abre a edição', async () => {
    await renderScreen();

    await fireEvent.press(await screen.findByText('Abastecimento'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/expense/new', params: { id: '1' } });
  });

  it('o dia escolhido filtra também os lançamentos', async () => {
    await renderScreen();
    expect(await screen.findByText('Outra despesa')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(/^Dia 1,/));

    expect(screen.getByText('Abastecimento')).toBeTruthy();
    expect(screen.queryByText('Outra despesa')).toBeNull();
  });

  it('Lista e Resumo trocam a visão. Resumo traz o antigo Relatórios', async () => {
    await renderScreen();
    expect(screen.getByRole('radio', { name: 'Lista', checked: true })).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Resumo' }));

    expect(screen.getByText('Resumo do período')).toBeTruthy();
    expect(screen.queryByText('Adicionar')).toBeNull();
  });

  it('agrupa as jornadas por dia, com o lucro do dia no topo do card', async () => {
    mockShifts.list = [shiftOn(3, MOCK_SECOND_DAY, 6), shiftOn(2, MOCK_SECOND_DAY, null), shiftOn(1, MOCK_FIRST_DAY, 15)];
    await renderScreen();

    const headers = await screen.findAllByRole('header', { name: /lucro do dia/ });
    expect(headers).toHaveLength(2);
    expect(headers[0]?.props.accessibilityLabel).toMatch(/2 jornadas · 200,0 km, lucro do dia R\$\s500,00$/);
    expect(headers[1]?.props.accessibilityLabel).toMatch(/1 jornada · 100,0 km, lucro do dia R\$\s250,00$/);
    expect(screen.getAllByText('Lucro do dia')).toHaveLength(2);
    expect(screen.getByText(/^Jornada · 0?6/)).toBeTruthy();
    expect(screen.getByText('Jornada')).toBeTruthy();
  });
});
