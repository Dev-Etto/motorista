import { platformShare } from '@features/reports/platformShare';

describe('fatia de cada plataforma', () => {
  const platforms = [{ cents: 102000 }, { cents: 48600 }, { cents: 25200 }];

  it('é a parte do total, arredondada', () => {
    expect(platforms.map((platform) => platformShare(platform.cents, platforms))).toEqual([58, 28, 14]);
  });

  it('sem ganhos, é zero', () => {
    expect(platformShare(0, [{ cents: 0 }])).toBe(0);
  });
});
