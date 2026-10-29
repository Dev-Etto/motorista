import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '@/shared/theme/theme';

const VIEW_WIDTH = 240;
const VIEW_HEIGHT = 140;
const STROKE = 3;

interface SceneColors {
  line: string;
  accent: string;
}

const lineProps = { fill: 'none', strokeWidth: STROKE, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Road({ line, y = 120 }: { line: string; y?: number }) {
  return <Path d={`M20 ${y}H220`} stroke={line} {...lineProps} />;
}

function CarOutline({ line, x, y }: { line: string; x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`} {...lineProps} stroke={line}>
      <Path d="M6 32V20l10-14h34l14 14 10 3v9" />
      <Path d="M2 32h7M28 32h20M70 32h7" />
      <Circle cx={18} cy={33} r={8} />
      <Circle cx={58} cy={33} r={8} />
      <Path d="M20 8v12M6 20h58" />
    </G>
  );
}

function Welcome({ line, accent }: SceneColors) {
  return (
    <>
      <Circle cx={172} cy={42} r={16} stroke={accent} {...lineProps} />
      <Path d="M172 35v14M167 39.5c0-3 10-3 10 0s-10 2-10 5 10 3 10 0" stroke={accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      <CarOutline line={line} x={80} y={78} />
      <Road line={line} />
    </>
  );
}

function Register({ line, accent }: SceneColors) {
  return (
    <>
      <Path d="M62 20h76v110H62zM84 14h32v14H84z" stroke={line} {...lineProps} />
      <Path d="M76 52l6 6 10-11M76 82l6 6 10-11" stroke={accent} {...lineProps} />
      <Path d="M102 54h24M102 84h24M76 110h50" stroke={line} {...lineProps} />
      <Circle cx={180} cy={56} r={24} stroke={line} {...lineProps} />
      <Path d="M180 42v14l9 6" stroke={accent} {...lineProps} />
    </>
  );
}

function Offers({ line, accent }: SceneColors) {
  return (
    <>
      <Path d="M86 8h68a8 8 0 0 1 8 8v108a8 8 0 0 1-8 8H86a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z" stroke={line} {...lineProps} />
      <Path d="M92 38h56a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H92a6 6 0 0 1-6-6V44a6 6 0 0 1 6-6z" stroke={accent} {...lineProps} />
      <Path d="M96 52h22M140 58l-6-9-6 9zM96 70h12M114 70h12M132 70h10" stroke={accent} {...lineProps} />
      <Path d="M112 118h16" stroke={line} {...lineProps} />
    </>
  );
}

function Result({ line, accent }: SceneColors) {
  return (
    <>
      <Path d="M50 116a70 70 0 0 1 140 0" stroke={line} {...lineProps} />
      <Path d="M120 116l34-38" stroke={accent} {...lineProps} />
      <Circle cx={120} cy={116} r={6} stroke={accent} {...lineProps} />
      <Path d="M66 94l10 5M82 66l7 8M120 46v11M158 66l-7 8M174 94l-10 5" stroke={line} {...lineProps} />
    </>
  );
}

function Copilot({ line, accent }: SceneColors) {
  return (
    <>
      <Path d="M44 62v18h14l22 18V44L58 62z" stroke={line} {...lineProps} />
      <Path d="M94 56a18 18 0 0 1 0 30M106 44a34 34 0 0 1 0 54" stroke={accent} {...lineProps} />
      <Path d="M174 26l28 12v22c0 22-12 36-28 44-16-8-28-22-28-44V38z" stroke={line} {...lineProps} />
      <Path d="M162 64l9 9 17-18" stroke={accent} {...lineProps} />
    </>
  );
}

function Empty({ line, accent }: SceneColors) {
  return (
    <>
      <Path d="M120 22v36" stroke={accent} {...lineProps} />
      <Circle cx={120} cy={70} r={3} stroke={accent} {...lineProps} />
      <Path d="M40 124h22M92 124h22M144 124h22M196 124h6" stroke={line} {...lineProps} />
    </>
  );
}

const SCENES = {
  welcome: Welcome,
  register: Register,
  offers: Offers,
  result: Result,
  copilot: Copilot,
  empty: Empty,
} as const;

export type IllustrationName = keyof typeof SCENES;

export function Illustration({ name, height = 150 }: { name: IllustrationName; height?: number }) {
  const colors = useTheme();
  const Scene = SCENES[name];

  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Scene line={colors.text} accent={colors.accent} />
      </Svg>
    </View>
  );
}
