import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const ICON_PATHS = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  shifts: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 9.6 3.5 2-1 1.7L11 13.5V7h2z',
  calculator: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 3v3h8V6zm0 6v2h2v-2zm3.5 0v2h2v-2zm3.5 0v2h2v-2zm-7 4v2h2v-2zm3.5 0v2h2v-2zm3.5 0v2h2v-2z',
  reports: 'M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z',
  more: 'M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
} as const;

export type TabIconName = keyof typeof ICON_PATHS;

export function TabIcon({ name, color, size = 24 }: { name: TabIconName; color: ColorValue; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={ICON_PATHS[name]} fill={color} />
    </Svg>
  );
}
