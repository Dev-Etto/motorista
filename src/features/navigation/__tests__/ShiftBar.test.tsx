import { fireEvent, render, screen } from '@testing-library/react-native';
import { ShiftBar } from '@features/navigation/ShiftBar';

const mockPush = jest.fn();
const mockLive = { started: true, running: true, elapsedMs: 3_600_000, km: 12, start: jest.fn(), pause: jest.fn() };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@features/shifts', () => ({ useLiveTracking: () => mockLive }));

describe('barra da jornada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockLive, { started: true, running: true });
  });

  it('não aparece sem jornada iniciada', async () => {
    mockLive.started = false;
    await render(<ShiftBar />);

    expect(screen.queryByText('Encerrar')).toBeNull();
  });

  it('mostra o estado, o tempo e os km', async () => {
    await render(<ShiftBar />);

    expect(screen.getByText('Jornada em andamento')).toBeTruthy();
    expect(screen.getByText(/01:00:00 · 12/)).toBeTruthy();
  });

  it('pausa sem abrir o formulário e retoma quando pausada', async () => {
    const view = await render(<ShiftBar />);
    await fireEvent.press(screen.getByText('Pausar'));
    expect(mockLive.pause).toHaveBeenCalled();

    mockLive.running = false;
    await view.rerender(<ShiftBar />);
    await fireEvent.press(screen.getByText('Retomar'));
    expect(mockLive.start).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('encerrar abre o encerramento e o resto abre a medição', async () => {
    await render(<ShiftBar />);

    await fireEvent.press(screen.getByText('Encerrar'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/shift/new', params: { finish: '1' } });

    await fireEvent.press(screen.getByText('Jornada em andamento'));
    expect(mockPush).toHaveBeenLastCalledWith('/shift/new');
  });
});
