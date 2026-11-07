import { fireEvent, render, screen } from '@testing-library/react-native';
import { StartShiftActions } from '@features/shifts/ActiveShift';

const mockPush = jest.fn();
const mockLive = { started: false, start: jest.fn().mockResolvedValue(undefined) };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@features/shifts/useLiveTracking', () => ({ useLiveTracking: () => mockLive }));

describe('ações da jornada no Início', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLive.started = false;
  });

  it('iniciar liga a medição sem abrir o formulário', async () => {
    await render(<StartShiftActions />);

    await fireEvent.press(screen.getByText('Iniciar jornada'));

    expect(mockLive.start).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('registrar uma jornada passada abre o formulário', async () => {
    await render(<StartShiftActions />);

    await fireEvent.press(screen.getByText('Registrar jornada passada'));

    expect(mockPush).toHaveBeenCalledWith('/shift/new');
  });

  it('com jornada iniciada, não repete o cronômetro', async () => {
    mockLive.started = true;
    await render(<StartShiftActions />);

    expect(screen.queryByText('Iniciar jornada')).toBeNull();
  });
});
