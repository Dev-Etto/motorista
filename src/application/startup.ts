import { migrate } from '@data/database/connection';
import { applyRequestedSeed } from '@data/database/devSeed';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { syncCopilotTargets } from './offerSettings';
import { regionalStore } from './regional';

export async function prepareApp(restoreTheme: () => Promise<void>): Promise<{ onboarded: boolean }> {
  await migrate();
  if (__DEV__) await applyRequestedSeed();
  await Promise.allSettled([regionalStore.load(), syncCopilotTargets(), restoreTheme()]);
  return { onboarded: Boolean(await settingsRepository.get(SETTING_KEYS.onboarded)) };
}
