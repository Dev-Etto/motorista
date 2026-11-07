import { act, renderHook, waitFor } from '@testing-library/react-native';
import { settingsRepository } from '@/data/repositories/settingsRepository';
import { useLiveTracking } from '../useLiveTracking';

const mockGps = { running: false, km: 0, error: null, start: jest.fn(), pause: jest.fn().mockResolvedValue(0), reset: jest.fn() };
const mockTimer = { running: true, started: true, startedAt: 0, elapsedMs: 0, minutes: 0, start: jest.fn(), pause: jest.fn(), reset: jest.fn() };

jest.mock('../useGpsTracking', () => ({ useGpsTracking: () => mockGps }));
jest.mock('../useShiftTimer', () => ({ useShiftTimer: () => mockTimer }));
jest.mock('@/data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { gpsMeasureKm: 'gps_measure_km' },
  settingsRepository: { getJson: jest.fn(), setJson: jest.fn() },
}));

const settings = jest.mocked(settingsRepository);

describe('medir km por GPS', () => {
  beforeEach(() => jest.clearAllMocks());

  it('salva a escolha de não medir', async () => {
    settings.getJson.mockResolvedValue(true);
    const { result } = await renderHook(() => useLiveTracking(jest.fn()));

    await act(async () => result.current.toggleMeasureKm(false));

    expect(settings.setJson).toHaveBeenCalledWith('gps_measure_km', false);
  });

  it('respeita a escolha salva ao retomar', async () => {
    settings.getJson.mockResolvedValue(false);
    const { result } = await renderHook(() => useLiveTracking(jest.fn()));
    await waitFor(() => expect(settings.getJson).toHaveBeenCalled());
    await act(async () => {});

    await act(async () => result.current.start());

    expect(mockGps.start).not.toHaveBeenCalled();
  });
});
