import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';
import { APP_NAME } from '@config/app';
import { Formatter, useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { AppText, Button, Card, ListRow, Screen } from '@shared/ui/primitives';
import { PLACEHOLDER } from '@shared/utils/format';
import { UsageStats, useUsageStats } from './useUsageStats';

const version = () => Constants.expoConfig?.version ?? '—';
const displayDate = (date: string | null, format: Formatter) => (date ? format.date(date) : PLACEHOLDER);

export default function MySummaryScreen() {
  const stats = useUsageStats();

  return (
    <Screen>
      <AsyncBoundary state={stats}>{(data) => <MySummaryContent data={data} />}</AsyncBoundary>
    </Screen>
  );
}

function MySummaryContent({ data }: { data: UsageStats }) {
  const { t } = useTranslation('settings');
  const format = useFormat();
  const share = () =>
    Share.share({
      message: t('summary.shareMessage', {
        appName: APP_NAME,
        version: version(),
        total: data.total,
        days: data.days,
        first: displayDate(data.first, format),
        last: displayDate(data.last, format),
      }),
    });

  return (
    <>
      <Card title={t('summary.cardTitle')}>
        <ListRow title={t('summary.shifts')} value={String(data.total)} />
        <ListRow title={t('summary.days')} value={String(data.days)} />
        <ListRow title={t('summary.first')} value={displayDate(data.first, format)} />
        <ListRow title={t('summary.last')} value={displayDate(data.last, format)} />
        <ListRow title={t('summary.version')} value={version()} />
      </Card>
      <AppText tone="muted">{t('summary.disclaimer')}</AppText>
      <Button label={t('summary.shareButton')} onPress={share} />
    </>
  );
}
