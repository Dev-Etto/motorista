import { AppIconName } from '@shared/ui/AppIcon';

export const HOME_TAB = 'index';
export const OFFERS_TAB = 'offer-hub';

export const TABS = [
  { name: HOME_TAB, titleKey: 'tabs.home', icon: 'home' },
  { name: 'shifts', titleKey: 'tabs.shifts', icon: 'shifts' },
  { name: OFFERS_TAB, titleKey: 'tabs.offers', icon: 'copilot' },
  { name: 'more', titleKey: 'tabs.more', icon: 'more' },
] as const satisfies readonly { name: string; titleKey: string; icon: AppIconName }[];

export const iconOfTab = (name: string): AppIconName => TABS.find((tab) => tab.name === name)?.icon ?? 'more';
