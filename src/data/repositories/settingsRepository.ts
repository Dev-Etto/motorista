import type { z } from 'zod';
import { getDb, type SqlExecutor } from '@data/database/connection';

export const SETTING_KEYS = {
  onboarded: 'onboarded',
  lastBackupAt: 'last_backup_at',
  offerTargets: 'offer_targets',
  offerLowTargets: 'offer_low_targets',
  offerMode: 'offer_mode',
  offerFollowGoal: 'offer_follow_goal',
  theme: 'theme_mode',
  tipsDismissed: 'tips_dismissed',
  nextStepsDismissed: 'next_steps_dismissed',
  dailyReminderId: 'daily_reminder_id',
  dailyReminderHour: 'daily_reminder_hour',
  gpsMeasureKm: 'gps_measure_km',
  language: 'language',
  formatLocale: 'format_locale',
  market: 'market',
  distanceUnit: 'distance_unit',
  volumeUnit: 'volume_unit',
  consumptionUnit: 'consumption_unit',
  firstWeekday: 'first_weekday',
  currentVehicle: 'current_vehicle',
  shiftVehicle: 'shift_vehicle',
  offersSeenAt: 'offers_seen_at',
  accessibilityConsentAt: 'accessibility_consent_at',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

const readJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export function createSettingsRepository(connection: () => SqlExecutor = getDb) {
  return {
    async get(key: SettingKey): Promise<string | null> {
      const row = await connection().getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
      return row?.value ?? null;
    },

    async set(key: SettingKey, value: string, executor: SqlExecutor = connection()): Promise<void> {
      await executor.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
    },

    async remove(key: SettingKey): Promise<void> {
      await connection().runAsync('DELETE FROM settings WHERE key = ?', key);
    },

    async getJson<T>(key: SettingKey, schema: z.ZodType<T>, fallback: T): Promise<T> {
      const raw = await this.get(key);
      if (raw === null) return fallback;

      const parsed = schema.safeParse(readJson(raw));
      return parsed.success ? parsed.data : fallback;
    },

    async getEnum<T extends string>(key: SettingKey, values: readonly T[], fallback: T): Promise<T> {
      const raw = await this.get(key);
      return values.find((value) => value === raw) ?? fallback;
    },

    async setJson(key: SettingKey, value: unknown): Promise<void> {
      await this.set(key, JSON.stringify(value));
    },
  };
}

export const settingsRepository = createSettingsRepository();
