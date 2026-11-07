import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { gpsSessionRepository } from '@/data/repositories/gpsSessionRepository';
import { useGpsTracking } from '../useGpsTracking';

jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  hasStartedLocationUpdatesAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
}));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('@modules/copilot', () => ({ copilot: { getTimer: () => ({ running: true }) } }));
jest.mock('@/data/repositories/gpsSessionRepository', () => ({ gpsSessionRepository: { get: jest.fn(), start: jest.fn(), stop: jest.fn(), reset: jest.fn() } }));

const location = jest.mocked(Location);
const sessions = jest.mocked(gpsSessionRepository);

const allow = (granted: boolean, services: boolean, started: boolean) => {
  location.requestForegroundPermissionsAsync.mockResolvedValue({ granted } as never);
  location.getForegroundPermissionsAsync.mockResolvedValue({ granted } as never);
  location.hasServicesEnabledAsync.mockResolvedValue(services);
  location.hasStartedLocationUpdatesAsync.mockResolvedValue(started);
};

describe('useGpsTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessions.get.mockResolvedValue({ meters: 0, lastPoint: null, running: false, cycle: 0 });
    location.startLocationUpdatesAsync.mockResolvedValue();
  });

  it('avisa e não inicia com a localização do celular desligada', async () => {
    allow(true, false, false);
    const { result } = await renderHook(() => useGpsTracking());

    await act(async () => result.current.start());

    expect(location.startLocationUpdatesAsync).not.toHaveBeenCalled();
    expect(result.current.error).toContain('Ligue a localização');
    expect(result.current.running).toBe(false);
  });

  it('avisa e não inicia sem permissão', async () => {
    allow(false, true, false);
    const { result } = await renderHook(() => useGpsTracking());

    await act(async () => result.current.start());

    expect(location.startLocationUpdatesAsync).not.toHaveBeenCalled();
    expect(result.current.error).toContain('Permita a localização');
  });

  it('não marca como medindo quando o início falha', async () => {
    allow(true, true, false);
    location.startLocationUpdatesAsync.mockRejectedValue(new Error('falhou'));
    const { result } = await renderHook(() => useGpsTracking());

    await act(async () => result.current.start());

    expect(sessions.start).not.toHaveBeenCalled();
    expect(result.current.error).toContain('Não foi possível iniciar');
  });

  it('corrige uma medição salva como ativa quando a permissão foi retirada, mantendo os km', async () => {
    allow(false, true, true);
    sessions.get.mockResolvedValue({ meters: 700, lastPoint: null, running: true, cycle: 0 });
    const { result } = await renderHook(() => useGpsTracking());

    await waitFor(() => expect(result.current.error).toContain('Permita a localização'));

    expect(result.current.running).toBe(false);
    expect(result.current.km).toBe(0.7);
    expect(sessions.stop).toHaveBeenCalled();
  });

  it('avisa quando a medição deixou de receber posições', async () => {
    allow(true, true, false);
    sessions.get.mockResolvedValue({ meters: 100, lastPoint: null, running: true, cycle: 0 });
    const { result } = await renderHook(() => useGpsTracking());

    await waitFor(() => expect(result.current.error).toContain('A medição de km parou'));
    expect(result.current.running).toBe(false);
  });

  it('continua medindo quando está tudo certo', async () => {
    allow(true, true, true);
    sessions.get.mockResolvedValue({ meters: 100, lastPoint: null, running: true, cycle: 0 });
    const { result } = await renderHook(() => useGpsTracking());

    await waitFor(() => expect(result.current.running).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('mostra erro em vez de falhar quando o pedido de permissão quebra', async () => {
    location.requestForegroundPermissionsAsync.mockRejectedValue(new Error('sem serviço'));
    const { result } = await renderHook(() => useGpsTracking());

    await act(async () => result.current.start());

    expect(result.current.error).toContain('Não foi possível iniciar');
  });
});
