import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { RELEASES_URL } from '@config/app';
import { Card, ListRow } from '@shared/ui/primitives';
import { PendingItem } from './pendingItems';

export function PendingCard({ items }: { items: PendingItem[] }) {
  const router = useRouter();
  const { t } = useTranslation('dashboard');
  if (items.length === 0) return null;

  const rowOf = (item: PendingItem) => {
    if (item.kind === 'reminder') {
      return (
        <ListRow
          key={`reminder-${item.id}`}
          icon="bell"
          title={t('pending.reminder', { title: item.title })}
          chevron
          onPress={() => router.push('/reminders')}
        />
      );
    }
    if (item.kind === 'backup') {
      return <ListRow key="backup" icon="backup" title={t('backup.action')} subtitle={t('pending.backup')} chevron onPress={() => router.push('/backup')} />;
    }
    return (
      <ListRow key="update" icon="update" title={t('update.action')} subtitle={t('pending.update')} chevron onPress={() => Linking.openURL(RELEASES_URL)} />
    );
  };

  return <Card title={t('pending.title')}>{items.map(rowOf)}</Card>;
}
