import { track } from '@application/analytics';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';

export async function markOnboarded(): Promise<void> {
  await settingsRepository.set(SETTING_KEYS.onboarded, '1');
  void track('onboarding_complete');
}
