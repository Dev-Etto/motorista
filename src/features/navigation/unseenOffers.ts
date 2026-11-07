import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { copilot } from '@modules/copilot';
import { dayRange, today } from '@shared/utils/dates';

export const MAX_BADGE = 9;

export const badgeText = (count: number) => (count > MAX_BADGE ? `${MAX_BADGE}+` : String(count));

export async function countUnseenOffers(now = Date.now()): Promise<number> {
  const seenAt = Number((await settingsRepository.get(SETTING_KEYS.offersSeenAt)) ?? 0);
  const from = Math.max(seenAt, dayRange(today()).from);
  return (await copilot.getOffers(from, now)).length;
}

export async function markOffersSeen(now = Date.now()): Promise<void> {
  await settingsRepository.set(SETTING_KEYS.offersSeenAt, String(now));
}
