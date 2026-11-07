import { act, renderHook, waitFor } from '@testing-library/react-native';
import { syncCopilotTargets } from '@application/offerSettings';
import { releaseShiftVehicle, shiftVehicle } from '@application/vehicleInUse';
import { settingsRepository } from '@data/repositories/settingsRepository';
import { useLiveTracking } from '@features/shifts/useLiveTracking';

const mockGps = { running: false, km: 0, error: null, start: jest.fn(), pause: jest.fn().mockResolvedValue(0), reset: jest.fn() };
const mockTimer = { running: true, started: true, startedAt: 0, elapsedMs: 0, minutes: 0, start: jest.fn(), pause: jest.fn(), reset: jest.fn() };

jest.mock('@features/shifts/useGpsTracking', () => ({ useGpsTracking: () => mockGps }));
jest.mock('@features/shifts/useShiftTimer', () => ({ useShiftTimer: () => mockTimer }));
jest.mock('@application/offerSettings', () => ({ syncCopilotTargets: jest.fn() }));
jest.mock('@application/vehicleInUse', () => ({ shiftVehicle: jest.fn(), releaseShiftVehicle: jest.fn() }));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { gpsMeasureKm: 'gps_measure_km' },
  settingsRepository: { getJson: jest.fn(), setJson: jest.fn() },
}));

const settings = jest.mocked(settingsRepository);

describe('medir km por GPS', () => {
  beforeEach(() => jest.clearAllMocks());

  it('iniciar fixa o veículo da jornada', async () => {
    settings.getJson.mockResolvedValue(false);
    const { result } = await renderHook(() => useLiveTracking(jest.fn()));

    await act(async () => result.current.start());

    expect(mockTimer.start).toHaveBeenCalled();
    expect(shiftVehicle).toHaveBeenCalled();
  });

  it('descartar a medição libera o veículo e devolve o custo do atual ao Copiloto', async () => {
    settings.getJson.mockResolvedValue(false);
    const { result } = await renderHook(() => useLiveTracking(jest.fn()));

    await act(async () => result.current.discard());

    expect(releaseShiftVehicle).toHaveBeenCalled();
    expect(syncCopilotTargets).toHaveBeenCalled();
  });

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
