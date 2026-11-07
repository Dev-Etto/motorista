import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createFormatter, useFormat } from '@shared/i18n/format';
import { Card, ListRow, Screen } from '@shared/ui/primitives';
import { today } from '@shared/utils/dates';
import { useFormatLocaleName } from './formatLocaleName';
import { useRegionSettings } from './useRegionSettings';

const EXAMPLE_NUMBER = 1234.5;

export default function RegionFormatScreen() {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const format = useFormat();
  const region = useRegionSettings();
  const localeName = useFormatLocaleName();
  const date = today();

  const exampleOf = (locale: string) => {
    const sample = createFormatter({ ...format.profile, locale });
    return `${sample.date(date)} · ${sample.number(EXAMPLE_NUMBER)}`;
  };

  const choose = async (locale: string | null) => {
    await region.chooseFormat(locale);
    router.back();
  };

  return (
    <Screen>
      <Card>
        <ListRow
          title={t('region.format.automatic', { format: localeName(region.automatic.formatLocale) })}
          subtitle={t('region.format.automaticHint')}
          selected={region.followsDeviceFormat}
          onPress={() => void choose(null)}
        />
        {region.formatLocales.map((locale) => (
          <ListRow
            key={locale}
            title={localeName(locale)}
            subtitle={exampleOf(locale)}
            selected={!region.followsDeviceFormat && region.profile.formatLocale === locale}
            onPress={() => void choose(locale)}
          />
        ))}
      </Card>
    </Screen>
  );
}
