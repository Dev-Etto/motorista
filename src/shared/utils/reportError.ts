export function reportError(error: unknown): void {
  if (__DEV__) console.warn(error);
}
