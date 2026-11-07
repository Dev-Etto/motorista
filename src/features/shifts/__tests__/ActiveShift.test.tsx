import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ActiveShiftCard, NewShiftButton } from '@features/shifts/ActiveShift';
import { copilot } from '@modules/copilot';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@modules/copilot', () => ({ copilot: { getTimer: jest.fn() } }));

const timer = jest.mocked(copilot.getTimer);
const state = (started: boolean, running: boolean, elapsedMs = 8000) => ({ started, running, elapsedMs, startedAt: started ? 1 : 0 });
const FOURTEEN_HOURS = 14 * 60 * 60 * 1000;

describe('jornada em andamento', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('encerrar leva ao formulário já pedindo o fechamento', async () => {
    timer.mockReturnValue(state(true, true));
    await render(<ActiveShiftCard />);

    await fireEvent.press(screen.getByText('Encerrar e registrar'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/shift/new', params: { finish: '1' } });
  });

  it('sem jornada, mostra só o botão de nova jornada', async () => {
    timer.mockReturnValue(state(false, false));
    await render(
      <>
        <ActiveShiftCard />
        <NewShiftButton />
      </>,
    );

    expect(screen.getByText('Nova jornada')).toBeTruthy();
    expect(screen.queryByText('Continuar jornada')).toBeNull();
  });

  it('com jornada, troca o botão pelo card e leva ao formulário', async () => {
    timer.mockReturnValue(state(true, true));
    await render(
      <>
        <ActiveShiftCard />
        <NewShiftButton />
      </>,
    );

    expect(screen.getByText('Jornada em andamento')).toBeTruthy();
    expect(screen.getByText('00:00:08')).toBeTruthy();
    expect(screen.queryByText('Nova jornada')).toBeNull();

    await fireEvent.press(screen.getByText('Continuar jornada'));
    expect(mockPush).toHaveBeenCalledWith('/shift/new');
  });

  it('percebe uma jornada iniciada pelo botão flutuante com a tela aberta', async () => {
    timer.mockReturnValue(state(false, false));
    await render(
      <>
        <ActiveShiftCard />
        <NewShiftButton />
      </>,
    );

    timer.mockReturnValue(state(true, true));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Continuar jornada')).toBeTruthy();
    expect(screen.queryByText('Nova jornada')).toBeNull();
  });

  it('indica jornada pausada', async () => {
    timer.mockReturnValue(state(true, false));
    await render(<ActiveShiftCard />);

    expect(screen.getByText('Jornada pausada')).toBeTruthy();
  });

  it('avisa quando o cronômetro parece esquecido', async () => {
    timer.mockReturnValue(state(true, true, FOURTEEN_HOURS));
    await render(<ActiveShiftCard />);

    expect(screen.getByText(/ligado há bastante tempo/)).toBeTruthy();
  });
});
