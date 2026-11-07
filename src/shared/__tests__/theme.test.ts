import { palette } from '@shared/theme/theme';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light = 0, dark = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const MIN_TEXT_CONTRAST = 4.5;
const TEXT_TONES = ['text', 'textMuted', 'accent', 'positive', 'warning', 'negative'] as const;
const BACKGROUNDS = ['background', 'surface', 'surfaceAlt'] as const;

describe.each(['light', 'dark'] as const)('contraste no tema %s', (scheme) => {
  const colors = palette[scheme];

  it.each(TEXT_TONES)('%s é legível em todos os fundos', (tone) => {
    for (const background of BACKGROUNDS) {
      expect(contrast(colors[tone], colors[background])).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });

  it('botão principal é legível', () => {
    expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});
