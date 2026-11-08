import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    background: '#F2F2F2',
    surface: '#FFFFFF',
    surfaceAlt: '#E8E8E8',
    text: '#171717',
    textMuted: '#5E5E5E',
    border: '#E2E2E2',
    borderStrong: '#8A8A8A',
    primary: '#171717',
    onPrimary: '#FFFFFF',
    onPrimaryMuted: '#A8A8A8',
    accent: '#404040',
    positive: '#0B6E3E',
    warning: '#7A5000',
    negative: '#B3261E',
    scoreGood: '#0B6E3E',
    onScoreGood: '#FFFFFF',
    scoreMid: '#F5C518',
    onScoreMid: '#111111',
    scoreBad: '#B3261E',
    onScoreBad: '#FFFFFF',
    scoreNone: '#404040',
    onScoreNone: '#FFFFFF',
    shiftRunning: '#0B6E3E',
    onShiftRunning: '#FFFFFF',
    shiftPaused: '#F1B84B',
    onShiftPaused: '#171717',
    cardShadow: '0 1px 3px rgba(0, 0, 0, 0.10)',
    floatingShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
    backdrop: 'rgba(0, 0, 0, 0.45)',
  },
  dark: {
    background: '#0F0F0F',
    surface: '#1C1C1C',
    surfaceAlt: '#2A2A2A',
    text: '#F5F5F5',
    textMuted: '#A8A8A8',
    border: '#333333',
    borderStrong: '#6B6B6B',
    primary: '#F5F5F5',
    onPrimary: '#171717',
    onPrimaryMuted: '#5E5E5E',
    accent: '#D4D4D4',
    positive: '#4FD08D',
    warning: '#F1B84B',
    negative: '#FF8A80',
    scoreGood: '#4FD08D',
    onScoreGood: '#06281A',
    scoreMid: '#F5C518',
    onScoreMid: '#111111',
    scoreBad: '#FF8A80',
    onScoreBad: '#3B0906',
    scoreNone: '#A8A8A8',
    onScoreNone: '#171717',
    shiftRunning: '#4FD08D',
    onShiftRunning: '#06281A',
    shiftPaused: '#F1B84B',
    onShiftPaused: '#171717',
    cardShadow: 'none',
    floatingShadow: 'none',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
};

export type ThemeColors = (typeof palette)['light'];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 16, lg: 20, pill: 999 };
export const fonts = { regular: 'Manrope-Regular', semibold: 'Manrope-SemiBold', bold: 'Manrope-Bold' };
export const fontSize = { caption: 13, body: 16, subtitle: 18, title: 22, display: 34 };
export const MIN_TOUCH_TARGET = 48;

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palette.dark : palette.light;
}
