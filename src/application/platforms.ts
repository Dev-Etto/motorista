import { type PlatformEntry, type PlatformKey, platformRepository } from '@data/repositories/platformRepository';
import { copilot } from '@modules/copilot';
import { PLATFORM_PACKAGES } from '@modules/copilot/platforms';

export type { PlatformEntry };

type SupportedKey = keyof typeof PLATFORM_PACKAGES;

export const hasCopilot = (key: PlatformKey | null): key is SupportedKey => key !== null && key in PLATFORM_PACKAGES;

export function monitoredPackagesOf(platforms: PlatformEntry[]): string[] {
  return platforms.flatMap((platform) => (platform.active && hasCopilot(platform.key) ? [PLATFORM_PACKAGES[platform.key]] : []));
}

export async function syncMonitoredPlatforms(): Promise<void> {
  const platforms = await platformRepository.listAll();
  copilot.setPreferences({ ...copilot.getPreferences(), monitoredPackages: monitoredPackagesOf(platforms) });
}

export async function setPlatformActive(id: number, active: boolean): Promise<void> {
  await platformRepository.setActive(id, active);
  await syncMonitoredPlatforms();
}
