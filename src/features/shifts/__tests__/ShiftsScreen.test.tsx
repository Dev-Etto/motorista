import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ShiftsScreen from '@features/shifts/ShiftsScreen';
import { DEFAULT_FORMAT } from '@shared/i18n/format';
import { showDialog } from '@shared/ui/dialog';
import { addDays, today, weekBounds } from '@shared/utils/dates';

const mockPush = jest.fn();
const MOCK_WEEK = weekBounds(today(), DEFAULT_FORMAT.firstWeekday);
const MOCK_FIRST_DAY = MOCK_WEEK.start;
const MOCK_SECOND_DAY = addDays(MOCK_FIRST_DAY, 1) <= today() ? addDays(MOCK_FIRST_DAY, 1) : MOCK_FIRST_DAY;
const mockData: { shifts: object[]; expenses: object[] } = { shifts: [], expenses: [] };
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
jest.mock('@features/shifts/shiftQueries', () => ({ loadPeriod: jest.fn(async () => mockData) }));
const mockLive = { started: false, running: false, elapsedMs: 0, km: 0, startedAt: 0, measureKm: false };
jest.mock('@features/shifts/useLiveTracking', () => ({ useLiveTracking: () => mockLive }));

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
    mockData.shifts = [];
    mockData.expenses = [];
    Object.assign(mockLive, { started: false, running: false, elapsedMs: 0, km: 0 });
  });

  it('com jornada pausada, mostra a jornada no topo e abre os controles', async () => {
    Object.assign(mockLive, { started: true, running: false, elapsedMs: 20_000 });
    await renderScreen();

    const row = await screen.findByRole('button', { name: 'Jornada pausada, 00:00:20. Abrir os controles da jornada' });
    await fireEvent.press(row);

    expect(screen.getByRole('button', { name: 'Retomar' })).toBeTruthy();
  });

  it('sem jornada iniciada, não mostra a jornada no topo', async () => {
    await renderScreen();

    expect(await screen.findByText('Nenhuma jornada nesta semana')).toBeTruthy();
    expect(screen.queryByText('Jornada pausada')).toBeNull();
  });

  it('um botão Adicionar oferece jornada, abastecimento e outra despesa', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Adicionar'));

    const labels = jest.mocked(showDialog).mock.calls[0]?.[0].actions.map((action) => action.label);
    expect(labels).toEqual(['Jornada', 'Abastecimento', 'Outra despesa', 'Cancelar']);
  });

  it('mostra os 7 dias da semana numa faixa', async () => {
    await renderScreen();

    expect(await screen.findAllByLabelText(/(sem jornada|lucro de)/)).toHaveLength(7);
  });

  it('os lançamentos ficam no card do dia e abrem a edição', async () => {
    mockData.expenses = [{ id: 1, date: MOCK_FIRST_DAY, category: 'fuel', cents: 20000 }];
    await renderScreen();

    await fireEvent.press(await screen.findByText('Abastecimento'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/expense/new', params: { id: '1' } });
    expect(screen.getByText('já está no custo por km')).toBeTruthy();
  });

  it('agrupa as jornadas por dia, com o lucro do dia no topo do card', async () => {
    mockData.shifts = [shiftOn(3, MOCK_FIRST_DAY, 6), shiftOn(2, MOCK_FIRST_DAY, null)];
    await renderScreen();

    const headers = await screen.findAllByRole('header', { name: /lucro do dia/ });
    expect(headers).toHaveLength(1);
    expect(headers[0]?.props.accessibilityLabel).toMatch(/2 jornadas · 200,0 km, lucro do dia R\$\s500,00$/);
    expect(screen.getByText('Lucro do dia')).toBeTruthy();
    expect(screen.getByText(/^Jornada · 0?6/)).toBeTruthy();
  });

  it('o dia escolhido filtra a lista', async () => {
    mockData.shifts = [shiftOn(1, MOCK_FIRST_DAY, 6)];
    mockData.expenses = [{ id: 2, date: MOCK_SECOND_DAY, category: 'other', cents: 1500 }];
    await renderScreen();
    expect(await screen.findByText('Outra despesa')).toBeTruthy();

    const dayProfit = MOCK_SECOND_DAY === MOCK_FIRST_DAY ? '235,00' : '250,00';
    await fireEvent.press(screen.getAllByLabelText(new RegExp(`lucro de R\\$\\s${dayProfit}`))[0]!);

    expect(screen.getByText('Lucro do dia')).toBeTruthy();
    if (MOCK_SECOND_DAY !== MOCK_FIRST_DAY) expect(screen.queryByText('Outra despesa')).toBeNull();
  });

  it('Lista e Resumo trocam a visão. Resumo traz o antigo Relatórios', async () => {
    await renderScreen();
    expect(screen.getByRole('radio', { name: 'Lista', checked: true })).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Resumo' }));

    expect(screen.getByText('Resumo do período')).toBeTruthy();
    expect(screen.queryByText('Adicionar')).toBeNull();
  });
});
