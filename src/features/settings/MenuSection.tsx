import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { Card, ListRow } from '@shared/ui/primitives';
import type { MoreMenuItem } from './moreMenu';

export function MenuSection({ title, items, children }: { title: string; items: MoreMenuItem[]; children?: ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const format = useFormat();
  return (
    <Card title={title}>
      {children}
      {items.map((item) => (
        <ListRow
          key={item.id}
          icon={item.icon}
          title={t(`more.item.${item.id}.title`)}
          subtitle={t(`more.item.${item.id}.subtitle`, { unit: format.distanceUnit })}
          onPress={() => router.push(item.href)}
        />
      ))}
    </Card>
  );
}
