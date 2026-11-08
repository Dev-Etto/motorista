import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const ICON_PATHS = {
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  shifts: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  calculator: 'M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01',
  reports: 'M5 20v-8M12 20V4M19 20v-5',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  vehicle: 'M5 16v-4l2-5h10l2 5v4M3 16h18v3H3zM7 12h10',
  motorcycle: 'M5 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 16l4-6h5l5 6M14 10l-2-4h3M9 10H6',
  goal: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  copilot: 'M4 10v4h3l5 4V6l-5 4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  apps: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  bell: 'M6 16v-6a6 6 0 0 1 12 0v6l2 2H4zM10 21h4',
  backup: 'M12 19v-8M8.5 14.5 12 11l3.5 3.5M6 17a4 4 0 0 1 .5-8A6 6 0 0 1 18 9a4 4 0 0 1 0 8',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.8.4-1.2 1-1.2 1.8M12 16.5h.01',
  shield: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM9 12l2 2 4-4',
  update: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  key: 'M14 4a6 6 0 1 1-4.6 9.8L4 19v2h3v-2h2v-2h2l.8-1A6 6 0 0 1 14 4zM16 8h.01',
  location: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  layers: 'M12 4l9 5-9 5-9-5zM4 14l8 4.5L20 14',
  calendar: 'M5 5h14v15H5zM5 10h14M9 3v4M15 3v4',
  check: 'M5 12.5l4.5 4.5L19 7',
  chevron: 'M9 6l6 6-6 6',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  document: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  flag: 'M6 21V4h12l-3 4 3 4H6',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9M12 3c-2.5 2.7-3.8 5.7-3.8 9s1.3 6.3 3.8 9',
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M9 6v12M15 6v12',
  heart: 'M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z',
} as const;

export type AppIconName = keyof typeof ICON_PATHS;

export function AppIcon({ name, color, size = 24 }: { name: AppIconName; color: ColorValue; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={ICON_PATHS[name]} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
