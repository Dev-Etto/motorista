import { z } from 'zod';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';

const dismissedSchema = z.array(z.string());

const readDismissed = () => settingsRepository.getJson(SETTING_KEYS.tipsDismissed, dismissedSchema, []);

export async function isTipDismissed(id: string): Promise<boolean> {
  return (await readDismissed()).includes(id);
}

export async function dismissTip(id: string): Promise<void> {
  await settingsRepository.setJson(SETTING_KEYS.tipsDismissed, [...(await readDismissed()), id]);
}
