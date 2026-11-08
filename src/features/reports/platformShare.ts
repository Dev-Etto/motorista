const PERCENT = 100;

export function platformShare(cents: number, platforms: { cents: number }[]): number {
  const total = platforms.reduce((sum, platform) => sum + platform.cents, 0);
  return total > 0 ? Math.round((cents / total) * PERCENT) : 0;
}
