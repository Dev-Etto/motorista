import { describeAgo } from '@features/dashboard/lastOffer';
import { i18n } from '@shared/i18n';

const t = i18n.getFixedT('pt-BR', 'dashboard');
const NOW = 1_000_000_000;
const MINUTE = 60_000;

describe('há quanto tempo veio a última oferta', () => {
  it.each([
    [NOW - 20_000, 'agora'],
    [NOW - 4 * MINUTE, 'há 4 min'],
    [NOW - 130 * MINUTE, 'há 2 h'],
  ])('%i vira %s', (timestamp, text) => {
    expect(describeAgo(timestamp, NOW, t)).toBe(text);
  });
});
