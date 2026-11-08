import { FORMAT_LOCALE_CHOICES } from '@domain/regional/regional';
import { buildRegionPreview } from '@features/settings/regionPreview';
import { createFormatter, DEFAULT_FORMAT } from '@shared/i18n/format';
import ptCommon from '@shared/i18n/locales/pt-BR/common.json';

describe('prévia de idioma e região', () => {
  it('mostra dinheiro, data, distância e consumo no perfil atual', () => {
    const preview = buildRegionPreview(createFormatter(DEFAULT_FORMAT), '2026-11-07', 'km/L');
    expect(preview).toEqual([
      { id: 'money', value: 'R$ 1.236,80' },
      { id: 'date', value: '07/11/2026' },
      { id: 'distance', value: '8,5 km' },
      { id: 'consumption', value: '11 km/L' },
    ]);
  });

  it('muda com o perfil', () => {
    const us = createFormatter({ ...DEFAULT_FORMAT, locale: 'en-US', currency: 'USD', distanceUnit: 'mi', consumptionUnit: 'mpg' });
    const preview = buildRegionPreview(us, '2026-11-07', 'mpg');

    expect(preview[0]?.value).toBe('$1,236.80');
    expect(preview[1]?.value).toBe('11/07/2026');
    expect(preview[2]?.value).toContain('mi');
  });

  it('todo formato oferecido tem nome legível', () => {
    FORMAT_LOCALE_CHOICES.forEach((locale) => expect(ptCommon.formatLocaleName[locale]).toMatch(/\(.+\)/));
  });
});
