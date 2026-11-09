import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ShiftFormScreen from '@features/shifts/ShiftFormScreen';

const mockParams: { id?: string } = {};
const mockState: { problem: string | null } = { problem: null };
const mockForm = {
  validate: jest.fn(() => mockState.problem),
  showProblem: jest.fn(),
  save: jest.fn(async () => null),
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@shared/hooks/useUnsavedChangesGuard', () => ({ useUnsavedChangesGuard: () => (navigate: () => void) => navigate() }));
jest.mock('@features/tips', () => ({ TipBanner: () => null }));
jest.mock('@features/offers', () => ({ useAcceptedEarnings: () => ({ trips: 0, matched: [], unmatched: [], tripsOf: () => 0 }) }));
jest.mock('@features/shifts/LiveTrackingCard', () => ({ LiveTrackingCard: () => null }));
jest.mock('@features/shifts/ShiftResultCard', () => ({ ShiftResultCard: () => null }));
jest.mock('@features/shifts/useLiveTracking', () => ({
  useLiveTracking: () => ({ started: false, pending: false, startedAt: 0, elapsedMs: 0, apply: jest.fn(), discard: jest.fn() }),
}));
jest.mock('@features/shifts/useShiftForm', () => ({
  JOURNEY_EXPENSES: ['toll', 'food'],
  useShiftForm: () => ({
    ...mockForm,
    platforms: [{ id: 1, name: 'Uber' }],
    vehicles: [],
    vehicleId: 1,
    date: '2026-11-07',
    setDate: jest.fn(),
    bind: () => ({ value: '', onChangeText: jest.fn() }),
    kmField: { value: '', onChangeText: jest.fn() },
    kmMode: 'manual',
    setKmMode: jest.fn(),
    kmMeasured: false,
    earnings: {},
    setEarning: jest.fn(),
    expenses: {},
    setExpense: jest.fn(),
    dirty: false,
    preview: { grossCents: 26800, vehicleCostCents: 8004, expensesCents: 3180 },
    minutes: 500,
    startHour: 6,
    error: null,
    fieldError: () => null,
  }),
}));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ShiftFormScreen />
    </SafeAreaProvider>,
  );

describe('nova jornada em etapas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.problem = null;
    delete mockParams.id;
  });

  it('passa por tempo e km, ganhos e despesas e resultado', async () => {
    await renderScreen();
    expect(screen.getByRole('header', { name: 'Confira o tempo e os km' })).toBeTruthy();
    expect(screen.getByLabelText('Passo 1 de 3')).toBeTruthy();

    expect(screen.getByText('Etapa 1 de 3')).toBeTruthy();
    expect(screen.getByText('Parou por volta das 14:20')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('header', { name: 'Quanto você ganhou?' })).toBeTruthy();
    expect(screen.getByText('Faturou')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salvar jornada' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Revisar despesas' }));
    expect(screen.getByRole('header', { name: 'Gastou com algo hoje?' })).toBeTruthy();
    expect(screen.getByText(/R\$\s268,00 de ganhos − R\$\s80,04 do veículo − R\$\s31,80 de despesas/)).toBeTruthy();
    expect(screen.queryByLabelText('Pedágio')).toBeNull();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Pedágio' }));
    expect(screen.getByLabelText('Pedágio')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salvar jornada' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByRole('header', { name: 'Quanto você ganhou?' })).toBeTruthy();
  });

  it('erro da etapa atual segura o avanço e aparece no campo', async () => {
    mockState.problem = 'invalid-hours';
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(mockForm.showProblem).toHaveBeenCalledWith('invalid-hours');
    expect(screen.getByRole('header', { name: 'Confira o tempo e os km' })).toBeTruthy();
  });

  it('erro de outra etapa não segura o avanço', async () => {
    mockState.problem = 'no-earnings';
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(mockForm.showProblem).toHaveBeenCalledWith(null);
    expect(screen.getByRole('header', { name: 'Quanto você ganhou?' })).toBeTruthy();
  });

  it('salvar com erro volta para a etapa do erro', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Revisar despesas' }));
    mockState.problem = 'no-earnings';

    await fireEvent.press(screen.getByRole('button', { name: 'Salvar jornada' }));

    expect(await screen.findByRole('header', { name: 'Quanto você ganhou?' })).toBeTruthy();
  });

  it('a edição continua numa tela só', async () => {
    mockParams.id = '7';
    await renderScreen();

    expect(screen.queryByLabelText(/^Passo/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Salvar jornada' })).toBeTruthy();
  });
});
