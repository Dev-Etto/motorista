import { useTranslation } from 'react-i18next';
import { CONSUMPTION_UNITS, ConsumptionUnit, isSameMarket, type Market, DISTANCE_UNITS, FIRST_WEEKDAY_CHOICES, VOLUME_UNITS } from '@domain/regional/regional';
import { enablePseudoLanguage, PSEUDO_LANGUAGE, setLanguage } from '@shared/i18n';
import { createFormatter, useFormat } from '@shared/i18n/format';
import { confirmAction } from '@shared/ui/dialog';
import { AppText, Card, ListRow, Screen, Segmented } from '@shared/ui/primitives';
import { today, weekdayFromIso } from '@shared/utils/dates';
import { useRegionSettings } from './useRegionSettings';

const EXAMPLE_CENTS = 123456;
const EXAMPLE_KM = 12.5;
const EXAMPLE_PER_KM_CENTS = 250;
const EXAMPLE_NUMBER = 1234.5;
const CONSUMPTION_KEYS: Record<ConsumptionUnit, 'kmPerLiter' | 'litersPer100km' | 'mpg'> = {
  'km/L': 'kmPerLiter',
  'L/100km': 'litersPer100km',
  mpg: 'mpg',
};

async function showPseudoLanguage() {
  enablePseudoLanguage();
  await setLanguage(PSEUDO_LANGUAGE);
}

export default function RegionScreen() {
  const { t } = useTranslation(['settings', 'common']);
  const format = useFormat();
  const region = useRegionSettings();
  const { profile } = region;
  const date = today();

  const formatExample = (locale: string) => {
    const sample = createFormatter({ ...format.profile, locale });
    return `${sample.date(date)} · ${sample.number(EXAMPLE_NUMBER)}`;
  };

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
      <Card title={t('region.language.title')}>
        <ListRow
          title={t('region.language.automatic', { language: t(`common:languageName.${region.automatic.language}`) })}
          subtitle={t('region.language.automaticHint')}
          selected={region.followsDeviceLanguage}
          onPress={() => void region.chooseLanguage(null)}
        />
        {region.languages.map((language) => (
          <ListRow
            key={language}
            title={t(`common:languageName.${language}`)}
            selected={!region.followsDeviceLanguage && profile.language === language}
            onPress={() => void region.chooseLanguage(language)}
          />
        ))}
        {__DEV__ ? <ListRow title={PSEUDO_LANGUAGE} onPress={() => void showPseudoLanguage()} /> : null}
      </Card>
      <Card title={t('region.format.title')}>
        <AppText variant="caption" tone="muted">
          {t('region.format.hint')}
        </AppText>
        <ListRow
          title={t('region.format.automatic')}
          subtitle={formatExample(region.automatic.formatLocale)}
          selected={region.followsDeviceFormat}
          onPress={() => void region.chooseFormat(null)}
        />
        {region.formatLocales.map((locale) => (
          <ListRow
            key={locale}
            title={formatExample(locale)}
            subtitle={locale}
            selected={!region.followsDeviceFormat && profile.formatLocale === locale}
            onPress={() => void region.chooseFormat(locale)}
          />
        ))}
      </Card>
      <Card title={t('region.market.title')}>
        <AppText variant="caption" tone="muted">
          {t('region.market.hint')}
        </AppText>
        {region.markets.map((market) => (
          <ListRow
            key={market}
            title={t(`common:marketName.${market}`)}
            subtitle={t('region.market.currency', {
              currency: createFormatter({ ...format.profile, currency: region.currencyOf(market) }).money(EXAMPLE_CENTS),
            })}
            selected={profile.market === market}
            onPress={() => void chooseMarket(market)}
          />
        ))}
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
        <AppText variant="caption" tone="muted">
          {t('region.units.firstWeekday')}
        </AppText>
        <Segmented
          value={String(profile.firstWeekday)}
          options={FIRST_WEEKDAY_CHOICES.map((weekday) => ({ value: String(weekday), label: format.weekday(weekdayFromIso(weekday)) }))}
          onChange={(weekday) => void region.chooseFirstWeekday(Number(weekday))}
        />
        <AppText variant="caption">
          {t('region.units.example', { distance: format.distance(EXAMPLE_KM), money: format.perDistance(EXAMPLE_PER_KM_CENTS) })}
        </AppText>
      </Card>
    </Screen>
  );
}
