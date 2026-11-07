import { fireEvent, render, screen } from '@testing-library/react-native';
import { LiveTrackingCard } from '@features/shifts/LiveTrackingCard';
import { LiveTrackingState } from '@features/shifts/useLiveTracking';
import { MS_PER_HOUR } from '@shared/utils/time';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));
jest.mock('@application/goalProgress', () => ({ plannedHoursPerDay: jest.fn().mockResolvedValue(10) }));

const START = new Date(2026, 10, 6, 8, 0).getTime();

const live = (overrides: Partial<LiveTrackingState> = {}) =>
  ({
    started: true,
    running: true,
    startedAt: START,
    elapsedMs: 20 * MS_PER_HOUR,
    km: 120,
    measureKm: true,
    gpsError: null,
    applied: false,
    pending: true,
    start: jest.fn(),
    pause: jest.fn(),
    apply: jest.fn(),
    discard: jest.fn(),
    toggleMeasureKm: jest.fn(),
    ...overrides,
  }) as LiveTrackingState;

describe('jornada esquecida no card de medição', () => {
  it('pergunta a hora em que parou e registra até ela', async () => {
    const state = live();
    await render(<LiveTrackingCard live={state} />);

    const field = await screen.findByDisplayValue('18:00');
    await fireEvent.changeText(field, '1930');
    await fireEvent.press(screen.getByText('Usar no registro'));

    expect(state.apply).toHaveBeenCalledWith(new Date(2026, 10, 6, 19, 30).getTime());
  });

  it('jornada normal usa o tempo medido', async () => {
    const state = live({ elapsedMs: 2 * MS_PER_HOUR });
    await render(<LiveTrackingCard live={state} />);

    expect(screen.queryByText('Que horas você parou?')).toBeNull();
    await fireEvent.press(screen.getByText('Usar no registro'));
    expect(state.apply).toHaveBeenCalledWith();
  });

  it('depois de usar, pede para conferir os km', async () => {
    await render(<LiveTrackingCard live={live({ applied: true })} />);

    expect(screen.getByText(/Confira os km/)).toBeTruthy();
  });
});
