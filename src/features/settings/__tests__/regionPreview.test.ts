import { FORMAT_LOCALE_CHOICES } from '@domain/regional/regional';
import { buildRegionPreview } from '@features/settings/regionPreview';
import { createFormatter, DEFAULT_FORMAT } from '@shared/i18n/format';
import ptCommon from '@shared/i18n/locales/pt-BR/common.json';

describe('prévia de idioma e região', () => {
  it('mostra dinheiro, distância, preço por km, data e consumo no perfil atual', () => {
    const preview = buildRegionPreview(createFormatter(DEFAULT_FORMAT), '2026-11-07', 'km/L');
    expect(preview).toEqual(['R$ 1.234,56', '12,5 km', 'R$ 2,50/km', '07/11/2026', '10,5 km/L']);
  });

  it('muda com o perfil', () => {
    const us = createFormatter({ ...DEFAULT_FORMAT, locale: 'en-US', currency: 'USD', distanceUnit: 'mi', consumptionUnit: 'mpg' });
    const preview = buildRegionPreview(us, '2026-11-07', 'mpg');

    expect(preview[0]).toBe('$1,234.56');
    expect(preview[1]).toContain('mi');
    expect(preview[3]).toBe('11/07/2026');
  });

  it('todo formato oferecido tem nome legível', () => {
    FORMAT_LOCALE_CHOICES.forEach((locale) => expect(ptCommon.formatLocaleName[locale]).toMatch(/\(.+\)/));
  });
});
