import { z } from 'zod';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { applyDataCollection } from '@shared/platform/firebase';

export const privacyChoicesSchema = z.object({
  usageStats: z.boolean(),
  crashReports: z.boolean(),
  decidedAt: z.string().nullable(),
});

export type PrivacyChoices = z.infer<typeof privacyChoicesSchema>;

export const DEFAULT_PRIVACY_CHOICES: PrivacyChoices = { usageStats: false, crashReports: true, decidedAt: null };

let cached: PrivacyChoices | null = null;

export async function loadPrivacyChoices(): Promise<PrivacyChoices> {
  cached = await settingsRepository.getJson(SETTING_KEYS.privacyChoices, privacyChoicesSchema, DEFAULT_PRIVACY_CHOICES);
  await applyDataCollection(cached);
  return cached;
}

export async function savePrivacyChoices(choices: Pick<PrivacyChoices, 'usageStats' | 'crashReports'>, now: Date = new Date()): Promise<PrivacyChoices> {
  const next = { ...choices, decidedAt: now.toISOString() };
  await settingsRepository.setJson(SETTING_KEYS.privacyChoices, next);
  cached = next;
  await applyDataCollection(next);
  return next;
}

export async function currentPrivacyChoices(): Promise<PrivacyChoices> {
  return cached ?? loadPrivacyChoices();
}

export function resetPrivacyChoicesCache(): void {
  cached = null;
}
