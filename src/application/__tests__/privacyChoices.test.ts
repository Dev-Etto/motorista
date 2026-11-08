import { track } from '@application/analytics';
import { DEFAULT_PRIVACY_CHOICES, loadPrivacyChoices, resetPrivacyChoicesCache, savePrivacyChoices } from '@application/privacyChoices';
import { settingsRepository } from '@data/repositories/settingsRepository';
import { sendAnalyticsEvent } from '@shared/platform/analytics';

jest.mock('@shared/platform/analytics', () => ({ sendAnalyticsEvent: jest.fn() }));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { privacyChoices: 'privacy_choices' },
  settingsRepository: { getJson: jest.fn(), setJson: jest.fn() },
}));

describe('escolhas de privacidade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPrivacyChoicesCache();
  });

  it('sem escolha feita, estatísticas ficam desligadas e nada é enviado', async () => {
    jest.mocked(settingsRepository.getJson).mockResolvedValue(DEFAULT_PRIVACY_CHOICES);

    expect(await loadPrivacyChoices()).toEqual({ usageStats: false, crashReports: true, decidedAt: null });
    await track('onboarding_complete');
    expect(sendAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('com estatísticas aceitas, o evento é enviado', async () => {
    await savePrivacyChoices({ usageStats: true, crashReports: true }, new Date('2026-11-08T19:00:00.000Z'));

    expect(settingsRepository.setJson).toHaveBeenCalledWith('privacy_choices', { usageStats: true, crashReports: true, decidedAt: '2026-11-08T19:00:00.000Z' });
    await track('copilot_enabled');
    expect(sendAnalyticsEvent).toHaveBeenCalledWith('copilot_enabled', {});
  });

  it('ao recusar depois, para de enviar', async () => {
    await savePrivacyChoices({ usageStats: true, crashReports: true });
    await savePrivacyChoices({ usageStats: false, crashReports: false });

    await track('copilot_enabled');
    expect(sendAnalyticsEvent).not.toHaveBeenCalled();
  });
});
