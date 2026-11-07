import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';

export const markOnboarded = () => settingsRepository.set(SETTING_KEYS.onboarded, '1');
