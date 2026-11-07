import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';
import { computeQuote } from '@domain/quote/quote';
import { useFormFields } from '@shared/hooks/useFormFields';
import { useSubmit } from '@shared/hooks/useSubmit';
import { Formatter, useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { confirmAction } from '@shared/ui/dialog';
import { IntegerField, MoneyField, NumberField, TextField } from '@shared/ui/fields';
import { AppText, Button, ButtonRow, Card, Collapsible, ListRow, Notice } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';
import { useSavedQuotes } from './useSavedQuotes';

const DEFAULT_PROFIT_PER_HOUR_CENTS = 3000;

const initialFields = (format: Formatter) => ({
  label: '',
  kmToPassenger: '',
  kmTrip: '',
  kmReturn: '',
  minutes: '',
  profitPerHour: format.moneyInput(DEFAULT_PROFIT_PER_HOUR_CENTS),
  toll: '',
  extras: '',
  minimum: '',
});

export function QuoteCalculator({ costPerKm }: { costPerKm: number }) {
  const { t } = useTranslation(['calculators', 'common']);
  const format = useFormat();
  const { bind, values } = useFormFields(initialFields(format));
  const { state: saved, save, remove: removeQuote } = useSavedQuotes();

  const quote = useMemo(
    () =>
      computeQuote({
        kmToPassenger: format.distanceOrZero(values.kmToPassenger),
        kmTrip: format.distanceOrZero(values.kmTrip),
        kmReturn: format.distanceOrZero(values.kmReturn),
        minutes: format.decimalOrZero(values.minutes),
        costPerKm,
        desiredProfitPerHourCents: format.centsOrZero(values.profitPerHour),
        tollCents: format.centsOrZero(values.toll),
        extrasCents: format.centsOrZero(values.extras),
        minimumCents: format.centsOrZero(values.minimum),
      }),
    [values, costPerKm, format],
  );
  const ready = quote.totalKm > 0;

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

  return (
    <>
      <Card title={t('quote.title')}>
        <AppText tone="muted">{t('quote.intro')}</AppText>
        <NumberField label={t('quote.toPassenger')} suffix={format.distanceUnit} {...bind('kmToPassenger')} />
        <NumberField label={t('quote.trip')} suffix={format.distanceUnit} {...bind('kmTrip')} />
        <IntegerField label={t('quote.time')} suffix="min" hint={t('quote.timeHint')} {...bind('minutes')} />
      </Card>
      <Collapsible title={t('quote.moreOptions')}>
        <NumberField label={t('quote.return')} suffix={format.distanceUnit} hint={t('quote.returnHint')} {...bind('kmReturn')} />
        <MoneyField label={t('quote.profitPerHour')} hint={t('quote.profitPerHourHint')} {...bind('profitPerHour')} />
        <MoneyField label={t('quote.toll')} {...bind('toll')} />
        <MoneyField label={t('quote.extras')} {...bind('extras')} />
        <MoneyField label={t('quote.minimum')} hint={t('quote.minimumHint')} {...bind('minimum')} />
      </Collapsible>
      {ready ? (
        <Card>
          <AppText variant="caption" tone="muted" center>
            {t('quote.price')}
          </AppText>
          <AppText variant="display" bold center>
            {format.money(quote.priceCents)}
          </AppText>
          <ListRow
            title={t('quote.vehicle')}
            subtitle={t('quote.vehicleDetail', { distance: format.distance(quote.totalKm), unit: format.distanceUnit })}
            value={format.money(quote.vehicleCostCents)}
          />
          <ListRow title={t('quote.timeValue')} value={format.money(quote.timeCents)} />
          {quote.tollCents + quote.extrasCents > 0 ? (
            <ListRow title={t('quote.tollAndExtras')} value={format.money(quote.tollCents + quote.extrasCents)} />
          ) : null}
          <ListRow title={t('quote.profit')} value={format.money(quote.estimatedProfitCents)} valueTone={profitTone(quote.estimatedProfitCents)} />
          <TextField label={t('quote.description')} placeholder={t('quote.descriptionPlaceholder')} {...bind('label')} />
          <ButtonRow>
            <Button label={t('quote.share')} onPress={share} />
            <Button label={t('common:actions.save')} variant="secondary" busy={saving.busy} onPress={saving.submit} />
          </ButtonRow>
          {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
        </Card>
      ) : null}
      <AsyncBoundary state={saved}>
        {(quotes) =>
          quotes.length === 0 ? null : (
            <Card title={t('quote.savedTitle')}>
              {quotes.map((item) => (
                <ListRow
                  key={item.id}
                  title={item.label ?? t('quote.noDescription')}
                  subtitle={t('quote.tapToRemove')}
                  value={format.money(item.priceCents)}
                  onPress={() => remove(item.id)}
                />
              ))}
            </Card>
          )
        }
      </AsyncBoundary>
    </>
  );
}
