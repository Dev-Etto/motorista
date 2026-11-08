import { type AnalyticsParams, sendAnalyticsEvent } from '@shared/platform/analytics';
import { reportError } from '@shared/utils/reportError';
import { currentPrivacyChoices } from './privacyChoices';

export type AnalyticsEvent = 'onboarding_complete' | 'copilot_enabled';

export async function track(event: AnalyticsEvent, params: AnalyticsParams = {}): Promise<void> {
  try {
    const choices = await currentPrivacyChoices();
    if (!choices.usageStats) return;
    await sendAnalyticsEvent(event, params);
  } catch (error) {
    reportError(error);
  }
}
