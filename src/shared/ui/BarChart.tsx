import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { spacing, useTheme } from '@/shared/theme/theme';
import { AppText } from './primitives';

export interface BarDatum {
  label: string;
  value: number;
}

const CHART_HEIGHT = 140;
const HORIZONTAL_INSET = spacing.lg * 4;
const MAX_LABELS = 6;
const BAR_GAP = 0.25;
const MAX_BAR_WIDTH = 28;

interface BarChartProps {
  data: BarDatum[];
  accessibilityLabel: string;
}

export function BarChart({ data, accessibilityLabel }: BarChartProps) {
  const colors = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  if (data.length === 0) return null;

  const width = windowWidth - HORIZONTAL_INSET;
  const max = Math.max(0, ...data.map((datum) => datum.value));
  const min = Math.min(0, ...data.map((datum) => datum.value));
  const range = max - min || 1;
  const zeroY = (max / range) * CHART_HEIGHT;
  const slot = width / data.length;
  const barWidth = Math.min(slot * (1 - BAR_GAP), MAX_BAR_WIDTH);
  const labelStep = Math.max(1, Math.ceil(data.length / MAX_LABELS));
  const visibleLabels = data.filter((_, index) => index % labelStep === 0);

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.container}>
      <Svg width={width} height={CHART_HEIGHT}>
        <Line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke={colors.border} />
        {data.map((datum, index) => {
          const height = (Math.abs(datum.value) / range) * CHART_HEIGHT;
          return (
            <Rect
              key={`${datum.label}-${index}`}
              x={index * slot + (slot - barWidth) / 2}
              y={datum.value >= 0 ? zeroY - height : zeroY}
              width={barWidth}
              height={height}
              rx={2}
              fill={datum.value >= 0 ? colors.positive : colors.negative}
            />
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {visibleLabels.map((datum) => (
          <AppText key={datum.label} variant="caption" tone="muted">{datum.label}</AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
