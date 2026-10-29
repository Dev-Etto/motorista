import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    background: '#F4F6F5',
    surface: '#FFFFFF',
    surfaceAlt: '#E8EEEC',
    text: '#14211F',
    textMuted: '#58686A',
    border: '#D6DEDC',
    primary: '#0B3C49',
    onPrimary: '#FFFFFF',
    accent: '#99540F',
    positive: '#1F7A4D',
    warning: '#855A08',
    negative: '#B3362B',
  },
  dark: {
    background: '#0C1416',
    surface: '#152124',
    surfaceAlt: '#1F2E32',
    text: '#EEF3F2',
    textMuted: '#A3B3B4',
    border: '#2B3B3F',
    primary: '#6FC3D2',
    onPrimary: '#072228',
    accent: '#F0A24B',
    positive: '#57C78D',
    warning: '#E5B556',
    negative: '#EF7F73',
  },
};

export type ThemeColors = (typeof palette)['light'];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const fontSize = { caption: 13, body: 16, subtitle: 18, title: 22, display: 34 };
export const MIN_TOUCH_TARGET = 48;

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palette.dark : palette.light;
}
