import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { CONSUMPTION_UNITS, DISTANCE_UNITS, FIRST_WEEKDAY_CHOICES, isSameMarket, type Market, VOLUME_UNITS } from '@domain/regional/regional';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { confirmAction, showDialog } from '@shared/ui/dialog';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Card, HeroCard, ListRow, Screen, Section, Segmented } from '@shared/ui/primitives';
import { today, weekdayFromIso } from '@shared/utils/dates';
import { useFormatLocaleName } from './formatLocaleName';
import { buildRegionPreview, CONSUMPTION_KEYS } from './regionPreview';
import { useRegionSettings } from './useRegionSettings';

const SHORT_WEEKDAY_LENGTH = 3;
const UNIT_CHOICES_WIDTH = 196;

function UnitRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.unitRow}>
      <AppText style={styles.flex}>{label}</AppText>
      <View style={styles.unitChoices}>{children}</View>
    </View>
  );
}

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
  const singleMarket = region.markets.length === 1;
  const marketLabel = t('region.market.value', {
    market: t(`common:marketName.${profile.market}`),
    currency: t(`common:marketCurrencyName.${profile.market}`),
  });

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

  const pickMarket = () => {
    showDialog({
      title: t('region.market.title'),
      actions: [
        ...region.markets.map((market) => ({ label: t(`common:marketName.${market}`), onPress: () => void chooseMarket(market) })),
        { label: t('common:actions.cancel'), tone: 'secondary' as const },
      ],
    });
  };

  return (
    <Screen>
      <HeroCard accessibilityLabel={preview.map((item) => `${t(`region.preview.${item.id}`)}: ${item.value}`).join(', ')}>
        <View style={styles.previewGrid}>
          {preview.map((item) => (
            <View key={item.id} style={styles.previewItem}>
              <AppText variant="caption" tone="inverseMuted">
                {t(`region.preview.${item.id}`)}
              </AppText>
              <AppText bold tone="inverse">
                {item.value}
              </AppText>
            </View>
          ))}
        </View>
      </HeroCard>
      <Card>
        <ListRow
          title={t('region.language.title')}
          value={region.followsDeviceLanguage ? t('region.language.automatic', { language: languageName }) : languageName}
          valueTone="muted"
          chevron
          onPress={() => router.push('/region-language')}
        />
        <ListRow
          title={t('region.format.title')}
          value={region.followsDeviceFormat ? t('region.format.automatic', { format: formatName }) : formatName}
          valueTone="muted"
          chevron
          onPress={() => router.push('/region-format')}
        />
        <ListRow
          title={t('region.market.short')}
          value={marketLabel}
          valueTone="muted"
          chevron={!singleMarket}
          onPress={singleMarket ? undefined : pickMarket}
        />
        <LearnMore title={t('region.market.learnMore')}>
          <AppText variant="caption">{t('region.market.hint')}</AppText>
          {singleMarket ? <AppText variant="caption">{t('region.market.soon')}</AppText> : null}
        </LearnMore>
      </Card>
      <Section title={t('region.units.title')}>
        <UnitRow label={t('region.units.distance')}>
          <Segmented
            label={t('region.units.distance')}
            value={profile.distanceUnit}
            options={DISTANCE_UNITS.map((unit) => ({ value: unit, label: unit }))}
            onChange={(unit) => void region.chooseDistance(unit)}
          />
        </UnitRow>
        <UnitRow label={t('region.units.volume')}>
          <Segmented
            label={t('region.units.volume')}
            value={profile.volumeUnit}
            options={VOLUME_UNITS.map((unit) => ({ value: unit, label: unit }))}
            onChange={(unit) => void region.chooseVolume(unit)}
          />
        </UnitRow>
        <UnitRow label={t('region.units.consumption')}>
          <Segmented
            label={t('region.units.consumption')}
            value={profile.consumptionUnit}
            options={CONSUMPTION_UNITS.map((unit) => ({ value: unit, label: unit }))}
            onChange={(unit) => void region.chooseConsumption(unit)}
          />
        </UnitRow>
        <UnitRow label={t('region.format.firstWeekday')}>
          <Segmented
            label={t('region.format.firstWeekday')}
            value={String(profile.firstWeekday)}
            options={FIRST_WEEKDAY_CHOICES.map((weekday) => ({
              value: String(weekday),
              label: format.weekday(weekdayFromIso(weekday)).slice(0, SHORT_WEEKDAY_LENGTH).toLocaleLowerCase(),
            }))}
            onChange={(weekday) => void region.chooseFirstWeekday(Number(weekday))}
          />
        </UnitRow>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  previewItem: { width: '50%', gap: 2 },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  unitChoices: { width: UNIT_CHOICES_WIDTH },
});
