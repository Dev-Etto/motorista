import { migrate } from '@data/database/connection';
import { applyRequestedSeed } from '@data/database/devSeed';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { setAnalyticsTransport } from '@shared/platform/analytics';
import { firebaseAnalyticsTransport, firestoreProblemReportTransport } from '@shared/platform/firebase';
import { setProblemReportTransport } from '@shared/platform/problemReports';
import { syncCopilotTargets } from './offerSettings';
import { syncMonitoredPlatforms } from './platforms';
import { loadPrivacyChoices } from './privacyChoices';
import { regionalStore } from './regional';

export async function prepareApp(restoreTheme: () => Promise<void>): Promise<{ onboarded: boolean }> {
  await migrate();
  if (__DEV__) await applyRequestedSeed();
  setAnalyticsTransport(firebaseAnalyticsTransport);
  setProblemReportTransport(firestoreProblemReportTransport);
  await Promise.allSettled([regionalStore.load(), syncCopilotTargets(), syncMonitoredPlatforms(), restoreTheme(), loadPrivacyChoices()]);
  return { onboarded: Boolean(await settingsRepository.get(SETTING_KEYS.onboarded)) };
}
