import { loadNextStep } from '@application/nextStep';
import { goalRepository } from '@data/repositories/goalRepository';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { copilot } from '@modules/copilot';

jest.mock('@modules/copilot', () => ({ copilot: { getStatus: jest.fn(), getTimer: jest.fn(() => ({ started: false })) } }));
jest.mock('@data/repositories/vehicleRepository', () => ({ vehicleRepository: { getCostsAt: jest.fn() } }));
jest.mock('@data/repositories/shiftRepository', () => ({ shiftRepository: { usageStats: jest.fn() } }));
jest.mock('@data/repositories/goalRepository', () => ({ goalRepository: { findInEffect: jest.fn() } }));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: {},
  settingsRepository: { get: jest.fn().mockResolvedValue(null), getJson: jest.fn(async (_key: string, _schema: unknown, fallback: unknown) => fallback) },
}));

describe('próximo passo', () => {
  beforeEach(() => {
    jest.mocked(shiftRepository.usageStats).mockResolvedValue({ total: 0 } as never);
    jest.mocked(goalRepository.findInEffect).mockResolvedValue(null);
  });

  it('sem acessibilidade, o Copiloto vem logo depois do veículo', async () => {
    jest.mocked(vehicleRepository.getCostsAt).mockResolvedValue({ costs: { fullPerKm: 80 } } as never);
    jest.mocked(copilot.getStatus).mockReturnValue({ accessibilityGranted: false } as never);

    expect(await loadNextStep()).toEqual({ id: 'copilot', href: '/copilot-setup' });
  });

  it('com o Copiloto pronto, segue para a primeira jornada', async () => {
    jest.mocked(vehicleRepository.getCostsAt).mockResolvedValue({ costs: { fullPerKm: 80 } } as never);
    jest.mocked(copilot.getStatus).mockReturnValue({ accessibilityGranted: true } as never);

    expect((await loadNextStep())?.id).toBe('first-shift');
  });
});
