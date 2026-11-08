import { settingsRepository } from '@data/repositories/settingsRepository';
import { TABS } from '@features/navigation/tabs';
import { badgeText, countUnseenOffers, markOffersSeen } from '@features/navigation/unseenOffers';
import { copilot } from '@modules/copilot';
import { dayRange, today } from '@shared/utils/dates';

jest.mock('@modules/copilot', () => ({ copilot: { getOffers: jest.fn().mockResolvedValue([{}, {}, {}]) } }));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { offersSeenAt: 'offers_seen_at' },
  settingsRepository: { get: jest.fn(), set: jest.fn() },
}));

describe('ofertas novas na aba', () => {
  beforeEach(() => jest.clearAllMocks());

  it('as abas são Início, Jornadas, Ofertas, Relatórios e Mais', () => {
    expect(TABS.map((tab) => tab.titleKey)).toEqual(['tabs.home', 'tabs.shifts', 'tabs.offers', 'tabs.more']);
  });

  it('o contador vai até 9+', () => {
    expect(badgeText(3)).toBe('3');
    expect(badgeText(9)).toBe('9');
    expect(badgeText(12)).toBe('9+');
  });

  it('sem visita, conta desde o começo do dia', async () => {
    jest.mocked(settingsRepository.get).mockResolvedValue(null);

    expect(await countUnseenOffers(5_000)).toBe(3);
    expect(copilot.getOffers).toHaveBeenCalledWith(dayRange(today()).from, 5_000);
  });

  it('depois da visita, conta só as ofertas novas', async () => {
    const seenAt = dayRange(today()).from + 1_000;
    jest.mocked(settingsRepository.get).mockResolvedValue(String(seenAt));

    await countUnseenOffers(seenAt + 10);
    expect(copilot.getOffers).toHaveBeenCalledWith(seenAt, seenAt + 10);
  });

  it('abrir a aba marca as ofertas como vistas', async () => {
    await markOffersSeen(42);
    expect(settingsRepository.set).toHaveBeenCalledWith('offers_seen_at', '42');
  });
});
