import { AppIconName } from '@shared/ui/AppIcon';

export const OFFERS_TAB = 'offer-hub';

export const TABS = [
  { name: 'index', titleKey: 'tabs.home', icon: 'home' },
  { name: 'shifts', titleKey: 'tabs.shifts', icon: 'shifts' },
  { name: OFFERS_TAB, titleKey: 'tabs.offers', icon: 'copilot' },
  { name: 'reports', titleKey: 'tabs.reports', icon: 'reports' },
  { name: 'more', titleKey: 'tabs.more', icon: 'more' },
] as const satisfies readonly { name: string; titleKey: string; icon: AppIconName }[];

export const iconOfTab = (name: string): AppIconName => TABS.find((tab) => tab.name === name)?.icon ?? 'more';
