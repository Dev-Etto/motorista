import type { Href } from 'expo-router';
import { AppIconName } from '@shared/ui/AppIcon';

export type MoreSectionId = 'work' | 'app' | 'help';

export type AboutSectionId = 'yours' | 'legal';

export type MoreItemId =
  | 'workProfile'
  | 'vehicle'
  | 'goal'
  | 'platforms'
  | 'reminders'
  | 'copilot'
  | 'permissions'
  | 'region'
  | 'backup'
  | 'summary'
  | 'privacy'
  | 'help'
  | 'report'
  | 'terms'
  | 'about'
  | 'appearance';

export interface MoreMenuItem {
  id: MoreItemId;
  icon: AppIconName;
  href: Href;
}

export const MORE_SECTIONS: { id: MoreSectionId; items: MoreMenuItem[] }[] = [
  {
    id: 'work',
    items: [
      { id: 'workProfile', icon: 'person', href: '/work-profile' },
      { id: 'vehicle', icon: 'vehicle', href: '/vehicles' },
      { id: 'goal', icon: 'goal', href: '/goal' },
      { id: 'platforms', icon: 'apps', href: '/platforms' },
      { id: 'copilot', icon: 'copilot', href: '/copilot' },
    ],
  },
  {
    id: 'app',
    items: [
      { id: 'appearance', icon: 'layers', href: '/appearance' },
      { id: 'region', icon: 'globe', href: '/region' },
      { id: 'reminders', icon: 'bell', href: '/reminders' },
      { id: 'backup', icon: 'backup', href: '/backup' },
      { id: 'permissions', icon: 'key', href: '/permissions' },
    ],
  },
  {
    id: 'help',
    items: [
      { id: 'help', icon: 'help', href: '/help' },
      { id: 'about', icon: 'document', href: '/about' },
    ],
  },
];

export const ABOUT_SECTIONS: { id: AboutSectionId; items: MoreMenuItem[] }[] = [
  {
    id: 'yours',
    items: [
      { id: 'summary', icon: 'reports', href: '/summary' },
      { id: 'report', icon: 'flag', href: '/report' },
    ],
  },
  {
    id: 'legal',
    items: [
      { id: 'privacy', icon: 'shield', href: '/privacy' },
      { id: 'terms', icon: 'document', href: '/terms' },
    ],
  },
];
