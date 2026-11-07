import { z } from 'zod';

export const THEME_MODES = ['system', 'light', 'dark'] as const;

export const offerHistoryEntrySchema = z.object({
  timestamp: z.number(),
  source: z.string(),
  valueCents: z.number(),
  km: z.number(),
  minutes: z.number(),
  perKmCents: z.number(),
  perHourCents: z.number(),
  profitCents: z.number().optional(),
  score: z.number().optional(),
  reason: z.string().optional(),
  color: z.enum(['green', 'yellow', 'red', 'neutral']),
  status: z.enum(['accepted', 'declined', 'countered', 'unanswered']).optional(),
  counterCents: z.number().optional(),
});

export const copilotRegionalSchema = z.object({
  languageTag: z.string().min(2),
  formatLocale: z.string().min(2),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  distanceUnit: z.enum(['km', 'mi']),
});

export type CopilotRegional = z.infer<typeof copilotRegionalSchema>;

export const copilotPreferencesSchema = z.object({
  voice: z.boolean(),
  card: z.boolean(),
  notification: z.boolean(),
  primaryMetric: z.enum(['perKm', 'profit']),
  cardLayout: z.enum(['complete', 'summary']),
  cardSize: z.enum(['compact', 'large', 'extra']),
  theme: z.enum(THEME_MODES),
  durationSeconds: z.number().int(),
  monitoredPackages: z.array(z.string()),
  estimateEarnings: z.boolean(),
  imageReading: z.boolean(),
  floatingButton: z.boolean(),
});

export type OfferHistoryEntry = z.infer<typeof offerHistoryEntrySchema>;
export type CopilotPreferences = z.infer<typeof copilotPreferencesSchema>;
export type ThemeMode = CopilotPreferences['theme'];
export type PrimaryMetric = CopilotPreferences['primaryMetric'];
export type CardLayout = CopilotPreferences['cardLayout'];
export type CardSize = CopilotPreferences['cardSize'];

const readJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export function parseHistory(raw: string): OfferHistoryEntry[] {
  const parsed = z.array(z.unknown()).safeParse(readJson(raw));
  if (!parsed.success) return [];
  return parsed.data.flatMap((entry) => {
    const valid = offerHistoryEntrySchema.safeParse(entry);
    return valid.success ? [valid.data] : [];
  });
}

export function isHistoryText(raw: string): boolean {
  return Array.isArray(readJson(raw));
}

export function sanitizeHistoryText(raw: string): string {
  return JSON.stringify(parseHistory(raw));
}

export function isPreferencesText(raw: string): boolean {
  return z.record(z.string(), z.unknown()).safeParse(readJson(raw)).success;
}

export function parsePreferences(raw: string): CopilotPreferences {
  return copilotPreferencesSchema.parse(readJson(raw));
}
