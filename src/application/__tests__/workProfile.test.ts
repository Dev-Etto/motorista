import { currentWorkProfile, loadWorkProfile, resetWorkProfileCache, saveWorkProfile, WORK_PROFILES } from '@application/workProfile';
import { settingsRepository } from '@data/repositories/settingsRepository';

jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { workProfile: 'work_profile' },
  settingsRepository: { getEnum: jest.fn(), set: jest.fn() },
}));

describe('perfil de trabalho', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetWorkProfileCache();
  });

  it('quem já usava o app sem perfil continua como motorista de corridas', async () => {
    jest.mocked(settingsRepository.getEnum).mockImplementation(async (_key, _values, fallback) => fallback);

    expect(await loadWorkProfile()).toBe('rides');
    expect(settingsRepository.getEnum).toHaveBeenCalledWith('work_profile', WORK_PROFILES, 'rides');
  });

  it('salva o perfil escolhido e passa a valer na hora', async () => {
    await saveWorkProfile('both');

    expect(currentWorkProfile()).toBe('both');
    expect(settingsRepository.set).toHaveBeenCalledWith('work_profile', 'both');
  });
});
