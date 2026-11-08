import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { copilot } from '@modules/copilot';

export async function hasAccessibilityConsent(): Promise<boolean> {
  return (await settingsRepository.get(SETTING_KEYS.accessibilityConsentAt)) !== null;
}

export async function acceptAccessibilityDisclosure(now: Date = new Date()): Promise<void> {
  await settingsRepository.set(SETTING_KEYS.accessibilityConsentAt, now.toISOString());
}

export async function openAccessibilityWithConsent(showDisclosure: () => void): Promise<void> {
  if (!(await hasAccessibilityConsent())) return showDisclosure();
  copilot.openAccessibilitySettings();
}
