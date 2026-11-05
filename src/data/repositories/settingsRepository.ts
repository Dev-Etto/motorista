import { getDb } from '@/data/database/connection';

export const settingsRepository = {
  async get(key: string): Promise<string | null> {
    const row = await getDb().getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
    return row?.value ?? null;
  },

  async set(key: string, value: string): Promise<void> {
    await getDb().runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key,
      value,
    );
  },

  async remove(key: string): Promise<void> {
    await getDb().runAsync('DELETE FROM settings WHERE key = ?', key);
  },

  async getJson<T>(key: string, fallback: T): Promise<T> {
    const raw = await this.get(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  },

  async setJson(key: string, value: unknown): Promise<void> {
    await this.set(key, JSON.stringify(value));
  },
};

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
} as const;
