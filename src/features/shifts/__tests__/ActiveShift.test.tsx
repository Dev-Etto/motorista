import { fireEvent, render, screen } from '@testing-library/react-native';
import { ShiftControls } from '@features/shifts/ActiveShift';
import { MS_PER_HOUR } from '@shared/utils/time';

const mockPush = jest.fn();
const mockLive = {
  started: false,
  running: false,
  elapsedMs: 0,
  km: 0,
  start: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
};

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@features/shifts/useLiveTracking', () => ({ useLiveTracking: () => mockLive }));

describe('jornada no Início', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockLive, { started: false, running: false, elapsedMs: 0, km: 0 });
  });

  it('sem jornada, o card não aparece. Iniciar fica no botão da barra', async () => {
    mockLive.started = false;
    await render(<ShiftControls />);

    expect(screen.toJSON()).toBeNull();
  });

  it('com jornada iniciada, mostra o andamento, pausa e encerra', async () => {
    Object.assign(mockLive, { started: true, running: true, elapsedMs: MS_PER_HOUR, km: 12 });
    await render(<ShiftControls />);

    expect(screen.queryByText('Iniciar jornada')).toBeNull();
    expect(screen.getByText('Jornada em andamento')).toBeTruthy();
    expect(screen.getByText(/01:00:00 · 12/)).toBeTruthy();

    await fireEvent.press(screen.getByText('Pausar'));
    expect(mockLive.pause).toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Encerrar'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/shift/new', params: { finish: '1' } });
  });

  it('pausada, retoma', async () => {
    Object.assign(mockLive, { started: true, running: false, elapsedMs: MS_PER_HOUR });
    await render(<ShiftControls />);

    await fireEvent.press(screen.getByText('Retomar'));
    expect(mockLive.start).toHaveBeenCalled();
  });

  it('esquecida, avisa no card', async () => {
    Object.assign(mockLive, { started: true, running: true, elapsedMs: 15 * MS_PER_HOUR });
    await render(<ShiftControls />);

    expect(screen.getByText(/ligado há bastante tempo/)).toBeTruthy();
  });
});
