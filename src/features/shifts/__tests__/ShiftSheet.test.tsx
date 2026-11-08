import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShiftSheet } from '@features/shifts/ShiftSheet';
import type { LiveTrackingState } from '@features/shifts/useLiveTracking';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const live = (overrides: Partial<LiveTrackingState> = {}) =>
  ({
    started: true,
    running: true,
    startedAt: new Date(2026, 10, 7, 6, 10).getTime(),
    elapsedMs: 2 * 3_600_000 + 14 * 60_000,
    km: 48.2,
    measureKm: true,
    pause: jest.fn(async () => undefined),
    start: jest.fn(async () => undefined),
    toggleMeasureKm: jest.fn(async () => undefined),
    ...overrides,
  }) as unknown as LiveTrackingState;

const renderSheet = (state: LiveTrackingState, onClose = jest.fn()) =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ShiftSheet live={state} visible onClose={onClose} />
    </SafeAreaProvider>,
  );

describe('controle da jornada', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mostra desde quando, o cronômetro e os km medidos', async () => {
    await renderSheet(live());

    expect(screen.getByText('Em andamento desde 06:10')).toBeTruthy();
    expect(screen.getByText('02:14:00')).toBeTruthy();
    expect(screen.getByText(/48,2 km medidos por GPS/)).toBeTruthy();
  });

  it('esquecida, avisa na folha', async () => {
    await renderSheet(live({ elapsedMs: 15 * 3_600_000 }));

    expect(screen.getByText(/ligado há bastante tempo/)).toBeTruthy();
  });

  it('pausa a jornada rodando', async () => {
    const state = live();
    await renderSheet(state);

    await fireEvent.press(screen.getByRole('button', { name: 'Pausar' }));

    expect(state.pause).toHaveBeenCalled();
  });

  it('encerrar fecha a gaveta e abre o encerramento', async () => {
    const onClose = jest.fn();
    await renderSheet(live(), onClose);

    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar' }));

    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/shift/new', params: { finish: '1' } });
  });

  it('pausada, Retomar é a ação principal e Encerrar fica secundária', async () => {
    await renderSheet(live({ running: false }));

    expect(screen.getByRole('button', { name: 'Retomar' })).toHaveStyle({ backgroundColor: '#171717' });
    expect(screen.getByRole('button', { name: 'Encerrar' })).toHaveStyle({ backgroundColor: '#E8E8E8' });
  });

  it('lança abastecimento sem sair da jornada', async () => {
    await renderSheet(live());

    await fireEvent.press(screen.getByRole('button', { name: 'Lançar abastecimento' }));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/expense/new', params: { category: 'fuel' } });
  });
});
