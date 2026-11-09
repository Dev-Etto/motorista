import { loadOfferSettings, saveModeTargets, syncCopilotTargets } from '@application/offerSettings';
import { vehicleInUse } from '@application/vehicleInUse';
import { settingsRepository } from '@data/repositories/settingsRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { copilot } from '@modules/copilot';

jest.mock('@application/goalProgress', () => ({ loadGoalProgress: jest.fn().mockResolvedValue(null) }));
jest.mock('@application/vehicleInUse', () => ({ vehicleInUse: jest.fn() }));
jest.mock('@modules/copilot', () => ({ copilot: { setTargets: jest.fn() } }));
jest.mock('@data/repositories/vehicleRepository', () => ({ vehicleRepository: { getCostsAt: jest.fn().mockResolvedValue({ costs: { fullPerKm: 29 } }) } }));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: {
    offerMode: 'offer_mode',
    offerTargets: 'offer_targets',
    offerLowTargets: 'offer_low_targets',
    offerTargetsMotorcycle: 'offer_targets_motorcycle',
    offerLowTargetsMotorcycle: 'offer_low_targets_motorcycle',
    offerFollowGoal: 'offer_follow_goal',
  },
  settingsRepository: {
    getEnum: jest.fn(async (_key: string, _values: unknown, fallback: unknown) => fallback),
    getJson: jest.fn(async (_key: string, _schema: unknown, fallback: unknown) => fallback),
    setJson: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('mínimos por tipo de veículo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('a moto começa em R$ 1,50/km e R$ 20/h e lê as chaves da moto', async () => {
    const settings = await loadOfferSettings('motorcycle');

    expect(settings.kind).toBe('motorcycle');
    expect(settings.normal).toEqual({ targetPerKmCents: 150, targetPerHourCents: 2000 });
    expect(settingsRepository.getJson).toHaveBeenCalledWith('offer_targets_motorcycle', expect.anything(), expect.anything());
  });

  it('o carro continua com as chaves e os valores de antes', async () => {
    const settings = await loadOfferSettings('car');

    expect(settings.normal).toEqual({ targetPerKmCents: 200, targetPerHourCents: 3000 });
    expect(settingsRepository.getJson).toHaveBeenCalledWith('offer_targets', expect.anything(), expect.anything());
  });

  it('salva no tipo de veículo escolhido', async () => {
    await saveModeTargets('motorcycle', 'low', { targetPerKmCents: 130, targetPerHourCents: 1600 });

    expect(settingsRepository.setJson).toHaveBeenCalledWith('offer_low_targets_motorcycle', { targetPerKmCents: 130, targetPerHourCents: 1600 });
  });

  it('o Copiloto recebe os mínimos do veículo da jornada', async () => {
    jest.mocked(vehicleInUse).mockResolvedValue({ id: 2, name: 'CG 160', kind: 'motorcycle', fuel: 'gasoline' } as never);

    await syncCopilotTargets();

    expect(vehicleRepository.getCostsAt).toHaveBeenCalledWith(expect.any(String), 2);
    expect(copilot.setTargets).toHaveBeenCalledWith(29, 150, 2000);
  });
});
