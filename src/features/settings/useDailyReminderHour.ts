import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';

export const useDailyReminderHour = () => useAsyncData(() => settingsRepository.get(SETTING_KEYS.dailyReminderHour));
