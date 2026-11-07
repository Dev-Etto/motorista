import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ShiftsScreen from '@features/shifts/ShiftsScreen';
import { showDialog } from '@shared/ui/dialog';
import { addDays, monthBounds, today } from '@shared/utils/dates';

const mockPush = jest.fn();
const MOCK_FIRST_DAY = monthBounds(today()).start;
const MOCK_SECOND_DAY = addDays(MOCK_FIRST_DAY, 1);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));
jest.mock('@shared/ui/dialog', () => ({ showDialog: jest.fn() }));
jest.mock('@features/shifts/shiftQueries', () => ({
  loadMonth: jest.fn(async () => ({
    shifts: [],
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
  beforeEach(() => jest.clearAllMocks());

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
});
