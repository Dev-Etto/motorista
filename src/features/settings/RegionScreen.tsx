import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CONSUMPTION_UNITS, DISTANCE_UNITS, FIRST_WEEKDAY_CHOICES, isSameMarket, type Market, VOLUME_UNITS } from '@domain/regional/regional';
import { useFormat } from '@shared/i18n/format';
import { confirmAction } from '@shared/ui/dialog';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Card, ListRow, Screen, Segmented } from '@shared/ui/primitives';
import { today, weekdayFromIso } from '@shared/utils/dates';
import { useFormatLocaleName } from './formatLocaleName';
import { buildRegionPreview, CONSUMPTION_KEYS } from './regionPreview';
import { useRegionSettings } from './useRegionSettings';

export default function RegionScreen() {
  const router = useRouter();
  const { t } = useTranslation(['settings', 'common']);
  const format = useFormat();
  const region = useRegionSettings();
  const localeName = useFormatLocaleName();
  const { profile } = region;
  const preview = buildRegionPreview(format, today(), t(`region.units.${CONSUMPTION_KEYS[profile.consumptionUnit]}`));
  const languageName = t(`common:languageName.${region.followsDeviceLanguage ? region.automatic.language : profile.language}`);
  const formatName = localeName(region.followsDeviceFormat ? region.automatic.formatLocale : profile.formatLocale);

  const chooseMarket = async (market: Market) => {
    if (isSameMarket(market, profile.market)) return;
    if (!(await region.hasSavedData())) return region.chooseMarket(market);

    confirmAction({
      title: t('region.market.confirmTitle'),
      message: t('region.market.confirmMessage', { currency: region.currencyOf(market) }),
      actionLabel: t('region.market.confirmAction'),
      onConfirm: () => region.chooseMarket(market),
    });
  };

  return (
    <Screen>
      <Card title={t('region.previewTitle')}>
        <AppText variant="subtitle" bold>
          {preview.join(' · ')}
        </AppText>
      </Card>
      <Card title={t('region.languageAndFormat')}>
        <ListRow
          title={t('region.language.title')}
          subtitle={region.followsDeviceLanguage ? t('region.language.automatic', { language: languageName }) : languageName}
          chevron
          onPress={() => router.push('/region-language')}
        />
        <ListRow
          title={t('region.format.title')}
          subtitle={region.followsDeviceFormat ? t('region.format.automatic', { format: formatName }) : formatName}
          chevron
          onPress={() => router.push('/region-format')}
        />
        <AppText variant="caption" tone="muted">
          {t('region.format.firstWeekday')}
        </AppText>
        <Segmented
          value={String(profile.firstWeekday)}
          options={FIRST_WEEKDAY_CHOICES.map((weekday) => ({ value: String(weekday), label: format.weekday(weekdayFromIso(weekday)) }))}
          onChange={(weekday) => void region.chooseFirstWeekday(Number(weekday))}
        />
      </Card>
      <Card title={t('region.market.title')}>
        {region.markets.map((market) => (
          <ListRow
            key={market}
            title={t(`common:marketName.${market}`)}
            subtitle={region.markets.length === 1 ? t('region.market.soon') : undefined}
            value={region.currencyOf(market)}
            selected={region.markets.length === 1 ? undefined : profile.market === market}
            onPress={region.markets.length === 1 ? undefined : () => void chooseMarket(market)}
          />
        ))}
        <LearnMore title={t('region.market.learnMore')}>
          <AppText variant="caption">{t('region.market.hint')}</AppText>
        </LearnMore>
      </Card>
      <Card title={t('region.units.title')}>
        <AppText variant="caption" tone="muted">
          {t('region.units.distance')}
        </AppText>
        <Segmented
          value={profile.distanceUnit}
          options={DISTANCE_UNITS.map((unit) => ({ value: unit, label: t(`region.units.${unit}`) }))}
          onChange={(unit) => void region.chooseDistance(unit)}
        />
        <AppText variant="caption" tone="muted">
          {t('region.units.volume')}
        </AppText>
        <Segmented
          value={profile.volumeUnit}
          options={VOLUME_UNITS.map((unit) => ({ value: unit, label: t(`region.units.${unit}`) }))}
          onChange={(unit) => void region.chooseVolume(unit)}
        />
        <AppText variant="caption" tone="muted">
          {t('region.units.consumption')}
        </AppText>
        <Segmented
          value={profile.consumptionUnit}
          options={CONSUMPTION_UNITS.map((unit) => ({ value: unit, label: t(`region.units.${CONSUMPTION_KEYS[unit]}`) }))}
          onChange={(unit) => void region.chooseConsumption(unit)}
        />
      </Card>
    </Screen>
  );
}
