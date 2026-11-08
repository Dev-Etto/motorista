import { Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { computeQuote } from '@domain/quote/quote';
import { useFormFields } from '@shared/hooks/useFormFields';
import { useSubmit } from '@shared/hooks/useSubmit';
import { Formatter, useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, spacing } from '@shared/theme/theme';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { confirmAction, showDialog } from '@shared/ui/dialog';
import { IntegerField, MoneyField, NumberField, TextField } from '@shared/ui/fields';
import { AppText, Button, ButtonRow, Card, Collapsible, HeroCard, ListRow, Notice, ToggleRow } from '@shared/ui/primitives';
import { useMinimumPerHour } from './useMinimumPerHour';
import { useSavedQuotes } from './useSavedQuotes';

const DEFAULT_PROFIT_PER_HOUR_CENTS = 3000;
const RETURN_ON = 'yes';

const initialFields = (format: Formatter) => ({
  label: '',
  kmToPassenger: '',
  kmTrip: '',
  countReturn: '',
  minutes: '',
  profitPerHour: format.moneyInput(DEFAULT_PROFIT_PER_HOUR_CENTS),
  toll: '',
  extras: '',
  minimum: '',
});

function returnFlagOf(fields: Record<string, string>, format: Formatter) {
  if (fields.countReturn !== undefined) return fields.countReturn;
  return format.distanceOrZero(fields.kmReturn ?? '') > 0 ? RETURN_ON : '';
}

function SavedLink({ count, open, onPress }: { count: number; open: boolean; onPress: () => void }) {
  const { t } = useTranslation('calculators');
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onPress} style={styles.headerLink}>
      <AppText bold>{t('quote.savedCount', { count })}</AppText>
    </Pressable>
  );
}

export function QuoteCalculator({ costPerKm }: { costPerKm: number }) {
  const { t } = useTranslation(['calculators', 'common']);
  const format = useFormat();
  const { bind, values, setValues } = useFormFields(initialFields(format));
  const minimumPerHour = useMinimumPerHour();
  const profitPerHourTouched = useRef(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!minimumPerHour || profitPerHourTouched.current) return;
    setValues((current) => ({ ...current, profitPerHour: format.moneyInput(minimumPerHour) }));
  }, [minimumPerHour, format, setValues]);
  const { state: saved, save, remove: removeQuote } = useSavedQuotes();
  const savedCount = saved.data?.length ?? 0;
  const countReturn = values.countReturn === RETURN_ON;

  const quote = useMemo(() => {
    const kmTrip = format.distanceOrZero(values.kmTrip);
    return computeQuote({
      kmToPassenger: format.distanceOrZero(values.kmToPassenger),
      kmTrip,
      kmReturn: countReturn ? kmTrip : 0,
      minutes: format.decimalOrZero(values.minutes),
      costPerKm,
      desiredProfitPerHourCents: format.centsOrZero(values.profitPerHour),
      tollCents: format.centsOrZero(values.toll),
      extrasCents: format.centsOrZero(values.extras),
      minimumCents: format.centsOrZero(values.minimum),
    });
  }, [values, countReturn, costPerKm, format]);
  const ready = quote.totalKm > 0;
  const profitPerHourCents = format.centsOrZero(values.profitPerHour);
  const extrasCents = quote.tollCents + quote.extrasCents;

  const saving = useSubmit(async () => {
    await save(values.label.trim() || null, quote.priceCents, values);
  });

  const shareMessage = () => {
    const price = format.money(quote.priceCents);
    const trip = values.label.trim();
    if (!trip) return t('quote.shareMessage', { price });
    return t('quote.shareMessageWithTrip', { trip, price });
  };

  const share = () => Share.share({ message: shareMessage() });

  const profitPerHourBinding = bind('profitPerHour');
  const profitPerHourField = {
    value: profitPerHourBinding.value,
    onChangeText: (text: string) => {
      profitPerHourTouched.current = true;
      profitPerHourBinding.onChangeText(text);
    },
  };

  const open = (fields: Record<string, string>) => {
    profitPerHourTouched.current = true;
    setShowSaved(false);
    setValues((current) => ({ ...current, ...fields, countReturn: returnFlagOf(fields, format) }));
  };

  const chooseSaved = (item: { id: number; label: string | null; fields: Record<string, string> }) => {
    showDialog({
      title: item.label ?? t('quote.noDescription'),
      actions: [
        { label: t('quote.open'), onPress: () => open(item.fields) },
        { label: t('common:actions.remove'), tone: 'danger', onPress: () => remove(item.id) },
        { label: t('common:actions.cancel'), tone: 'secondary' },
      ],
    });
  };

  const remove = (id: number) => {
    confirmAction({
      title: t('quote.removeTitle'),
      message: t('common:irreversible'),
      actionLabel: t('common:actions.remove'),
      onConfirm: async () => {
        await removeQuote(id);
      },
    });
  };

  const priceDetail = () => {
    const covers = t('quote.covers', { distance: format.distance(quote.totalKm, 0), perHour: format.perHour(profitPerHourCents) });
    if (minimumPerHour && profitPerHourCents === minimumPerHour) return `${covers}${t('quote.yourMinimum')}`;
    return covers;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (savedCount > 0 ? <SavedLink count={savedCount} open={showSaved} onPress={() => setShowSaved((current) => !current)} /> : null),
        }}
      />
      {showSaved ? (
        <AsyncBoundary state={saved}>
          {(quotes) => (
            <Card title={t('quote.savedTitle')}>
              {quotes.map((item) => (
                <ListRow
                  key={item.id}
                  title={item.label ?? t('quote.noDescription')}
                  subtitle={t('quote.tapToOpen')}
                  value={format.money(item.priceCents)}
                  onPress={() => chooseSaved(item)}
                />
              ))}
            </Card>
          )}
        </AsyncBoundary>
      ) : null}
      <Card>
        <TextField label={t('quote.description')} placeholder={t('quote.descriptionPlaceholder')} {...bind('label')} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <NumberField label={t('quote.toPassenger')} suffix={format.distanceUnit} {...bind('kmToPassenger')} />
          </View>
          <View style={styles.flex}>
            <NumberField label={t('quote.trip')} suffix={format.distanceUnit} {...bind('kmTrip')} />
          </View>
          <View style={styles.flex}>
            <IntegerField label={t('quote.time')} suffix={t('common:unit.minutes')} {...bind('minutes')} />
          </View>
        </View>
        <ToggleRow
          label={t('quote.countReturn')}
          value={countReturn}
          onChange={(next) => setValues((current) => ({ ...current, countReturn: next ? RETURN_ON : '' }))}
        />
      </Card>
      <Collapsible title={t('quote.moreOptions')}>
        <MoneyField label={t('quote.toll')} {...bind('toll')} />
        <MoneyField label={t('quote.extras')} {...bind('extras')} />
        <MoneyField label={t('quote.minimum')} hint={t('quote.minimumHint')} {...bind('minimum')} />
        <MoneyField label={t('quote.profitPerHour')} hint={t('quote.profitPerHourHint')} {...profitPerHourField} />
      </Collapsible>
      {ready ? (
        <>
          <HeroCard>
            <AppText tone="inverseMuted">{t('quote.price')}</AppText>
            <AppText variant="display" bold tone="inverse">
              {format.money(quote.priceCents)}
            </AppText>
            <AppText variant="caption" tone="inverseMuted">
              {priceDetail()}
            </AppText>
            {extrasCents > 0 ? (
              <AppText variant="caption" tone="inverseMuted">
                {t('quote.includesExtras', { value: format.money(extrasCents) })}
              </AppText>
            ) : null}
          </HeroCard>
          <ButtonRow>
            <Button label={t('common:actions.save')} variant="secondary" busy={saving.busy} onPress={saving.submit} />
            <Button label={t('quote.share')} onPress={share} />
          </ButtonRow>
          {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  headerLink: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: spacing.md },
});
