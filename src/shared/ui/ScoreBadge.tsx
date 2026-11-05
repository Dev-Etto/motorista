import { StyleSheet, Text, View } from 'react-native';
import { fonts, ThemeColors, useTheme } from '@/shared/theme/theme';
import { formatNumber } from '@/shared/utils/money';

type ScoreColor = 'green' | 'yellow' | 'red' | 'neutral';

const SCORE_RATIO = 0.56;
const SCALE_RATIO = 0.32;
const PADDING_RATIO = 0.3;
const CORNER_RATIO = 0.3;
const SCALE_OPACITY = 0.78;
const MAX_FONT_SCALE = 1.1;

const SCORE_TOKENS: Record<ScoreColor, { fill: keyof ThemeColors; ink: keyof ThemeColors }> = {
  green: { fill: 'scoreGood', ink: 'onScoreGood' },
  yellow: { fill: 'scoreMid', ink: 'onScoreMid' },
  red: { fill: 'scoreBad', ink: 'onScoreBad' },
  neutral: { fill: 'scoreNone', ink: 'onScoreNone' },
};

export function ScoreBadge({ score, color, height = 32 }: { score: number | null | undefined; color: ScoreColor; height?: number }) {
  const colors = useTheme();
  const tokens = SCORE_TOKENS[color];
  const ink = colors[tokens.ink];
  const hasScore = score !== null && score !== undefined;

  return (
    <View
      accessible
      accessibilityLabel={hasScore ? `Nota ${formatNumber(score)} de 5` : 'Sem nota'}
      style={[styles.badge, { height, borderRadius: height * CORNER_RATIO, paddingHorizontal: height * PADDING_RATIO, backgroundColor: colors[tokens.fill] }]}
    >
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.text, { color: ink, fontSize: height * SCORE_RATIO }]}>
        {hasScore ? formatNumber(score) : '—'}
        {hasScore ? <Text style={{ fontSize: height * SCALE_RATIO, opacity: SCALE_OPACITY }}>/5</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
});
