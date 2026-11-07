import type { Href } from 'expo-router';
import { AppIconName } from '@shared/ui/AppIcon';

export type MoreSectionId = 'work' | 'copilot' | 'data' | 'help';

export type MoreItemId =
  | 'vehicle'
  | 'goal'
  | 'offers'
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
  | 'terms';

export interface MoreMenuItem {
  id: MoreItemId;
  icon: AppIconName;
  href: Href;
}

export const MORE_SECTIONS: { id: MoreSectionId; items: MoreMenuItem[] }[] = [
  {
    id: 'work',
    items: [
      { id: 'vehicle', icon: 'vehicle', href: '/vehicles' },
      { id: 'goal', icon: 'goal', href: '/goal' },
      { id: 'offers', icon: 'layers', href: '/offers' },
      { id: 'platforms', icon: 'apps', href: '/platforms' },
      { id: 'reminders', icon: 'bell', href: '/reminders' },
    ],
  },
  {
    id: 'copilot',
    items: [
      { id: 'copilot', icon: 'copilot', href: '/copilot' },
      { id: 'permissions', icon: 'key', href: '/permissions' },
    ],
  },
  {
    id: 'data',
    items: [
      { id: 'region', icon: 'globe', href: '/region' },
      { id: 'backup', icon: 'backup', href: '/backup' },
      { id: 'summary', icon: 'reports', href: '/summary' },
      { id: 'privacy', icon: 'shield', href: '/privacy' },
    ],
  },
  {
    id: 'help',
    items: [
      { id: 'help', icon: 'help', href: '/help' },
      { id: 'report', icon: 'flag', href: '/report' },
      { id: 'terms', icon: 'document', href: '/terms' },
    ],
  },
];
