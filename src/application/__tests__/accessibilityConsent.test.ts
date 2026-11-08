import { acceptAccessibilityDisclosure, hasAccessibilityConsent, openAccessibilityWithConsent } from '@application/accessibilityConsent';
import { settingsRepository } from '@data/repositories/settingsRepository';
import { copilot } from '@modules/copilot';

jest.mock('@modules/copilot', () => ({ copilot: { openAccessibilitySettings: jest.fn() } }));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { accessibilityConsentAt: 'accessibility_consent_at' },
  settingsRepository: { get: jest.fn(), set: jest.fn() },
}));

describe('aceite da divulgação da acessibilidade', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sem aceite, mostra a divulgação e não abre as configurações', async () => {
    jest.mocked(settingsRepository.get).mockResolvedValue(null);
    const showDisclosure = jest.fn();

    await openAccessibilityWithConsent(showDisclosure);

    expect(await hasAccessibilityConsent()).toBe(false);
    expect(showDisclosure).toHaveBeenCalled();
    expect(copilot.openAccessibilitySettings).not.toHaveBeenCalled();
  });

  it('com aceite, abre as configurações direto', async () => {
    jest.mocked(settingsRepository.get).mockResolvedValue('2026-11-08T19:00:00.000Z');
    const showDisclosure = jest.fn();

    await openAccessibilityWithConsent(showDisclosure);

    expect(showDisclosure).not.toHaveBeenCalled();
    expect(copilot.openAccessibilitySettings).toHaveBeenCalled();
  });

  it('guarda a data do aceite', async () => {
    await acceptAccessibilityDisclosure(new Date('2026-11-08T19:00:00.000Z'));

    expect(settingsRepository.set).toHaveBeenCalledWith('accessibility_consent_at', '2026-11-08T19:00:00.000Z');
  });
});
