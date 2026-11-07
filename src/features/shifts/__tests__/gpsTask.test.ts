import { gpsSessionRepository } from '@data/repositories/gpsSessionRepository';
import { applyLocations } from '@features/shifts/gpsTask';

jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('@modules/copilot', () => ({ copilot: { getTimer: () => ({ running: true }) } }));
jest.mock('@data/repositories/gpsSessionRepository', () => ({ gpsSessionRepository: { get: jest.fn(), recordProgress: jest.fn() } }));

const sessions = jest.mocked(gpsSessionRepository);
const location = (latitude: number, timestamp: number) => ({ coords: { latitude, longitude: -46.6, accuracy: 5 }, timestamp }) as never;

describe('lote de posições do GPS', () => {
  it('grava o progresso no ciclo em que a sessão foi lida', async () => {
    sessions.get.mockResolvedValue({ meters: 100, lastPoint: null, running: true, cycle: 7 });

    await applyLocations([location(-23.5, 0), location(-23.501, 10000)]);

    expect(sessions.recordProgress).toHaveBeenCalledWith(7, expect.any(Number), expect.objectContaining({ lat: -23.501 }));
  });

  it('não grava nada com a medição parada', async () => {
    sessions.recordProgress.mockClear();
    sessions.get.mockResolvedValue({ meters: 100, lastPoint: null, running: false, cycle: 7 });

    await applyLocations([location(-23.5, 0)]);

    expect(sessions.recordProgress).not.toHaveBeenCalled();
  });
});
