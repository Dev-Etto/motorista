import type { z } from 'zod';

const readJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export function isJsonOf<T>(schema: z.ZodType<T>) {
  return (raw: unknown) => typeof raw === 'string' && schema.safeParse(readJson(raw)).success;
}

export function parseJsonColumn<T>(raw: string, schema: z.ZodType<T>): T {
  return schema.parse(readJson(raw));
}

export function parseJsonColumnOr<T>(raw: string | null, schema: z.ZodType<T>, fallback: T): T {
  if (raw === null) return fallback;

  const parsed = schema.safeParse(readJson(raw));
  return parsed.success ? parsed.data : fallback;
}
