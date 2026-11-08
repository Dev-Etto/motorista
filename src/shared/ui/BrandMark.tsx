import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@shared/theme/theme';

const VIEW_BOX = 120;
const CORNER = 28;
const STROKE = 12;

export function BrandMark({ size, accessibilityLabel }: { size: number; accessibilityLabel: string }) {
  const colors = useTheme();
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Rect width={VIEW_BOX} height={VIEW_BOX} rx={CORNER} fill={colors.primary} />
      <Path
        d="M28 88V56a14 14 0 0 1 28 0v12M56 56a14 14 0 0 1 28 0v32"
        fill="none"
        stroke={colors.onPrimary}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M56 82v6" stroke={colors.onPrimary} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx={92} cy={30} r={7} fill={colors.onPrimary} />
    </Svg>
  );
}
