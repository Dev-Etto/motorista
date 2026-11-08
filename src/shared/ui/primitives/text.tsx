import { Text, TextProps } from 'react-native';
import { fonts, fontSize, ThemeColors, useTheme } from '@shared/theme/theme';

export type Tone = 'default' | 'muted' | 'positive' | 'warning' | 'negative' | 'accent' | 'inverse' | 'inverseMuted';
export type Variant = 'caption' | 'body' | 'subtitle' | 'title' | 'display';

const TABULAR: ['tabular-nums'] = ['tabular-nums'];

export const TONE_COLORS: Record<Tone, keyof ThemeColors> = {
  default: 'text',
  muted: 'textMuted',
  positive: 'positive',
  warning: 'warning',
  negative: 'negative',
  accent: 'accent',
  inverse: 'onPrimary',
  inverseMuted: 'onPrimaryMuted',
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  bold?: boolean;
  center?: boolean;
}

export function AppText({ variant = 'body', tone = 'default', bold, center, style, ...props }: AppTextProps) {
  const colors = useTheme();
  const textStyle = {
    color: colors[TONE_COLORS[tone]],
    fontSize: fontSize[variant],
    fontFamily: bold ? fonts.bold : fonts.regular,
    fontVariant: TABULAR,
    textAlign: center ? 'center' : 'auto',
  } as const;
  return <Text style={[textStyle, style]} {...props} />;
}
