import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubmit } from '@shared/hooks/useSubmit';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { confirmAction } from '@shared/ui/dialog';
import { TextField } from '@shared/ui/fields';
import { PlatformBadge } from '@shared/ui/PlatformBadge';
import { AppText, Button, Card, ListRow, Notice, Screen } from '@shared/ui/primitives';
import { usePlatforms } from './usePlatforms';

export default function PlatformsScreen() {
  const { t } = useTranslation(['settings', 'common']);
  const { state: platforms, add, deactivate } = usePlatforms();
  const [name, setName] = useState('');

  const adding = useSubmit(async () => {
    if (!name.trim()) return;
    await add(name);
    setName('');
  });

  const remove = (id: number, platformName: string) => {
    confirmAction({
      title: t('platforms.removeConfirm.title', { name: platformName }),
      message: t('platforms.removeConfirm.message'),
      actionLabel: t('common:actions.remove'),
      onConfirm: async () => {
        await deactivate(id);
      },
    });
  };

  return (
    <Screen>
      <AppText tone="muted">{t('platforms.intro')}</AppText>
      <Card title={t('platforms.newTitle')}>
        <TextField label={t('platforms.nameLabel')} placeholder={t('platforms.namePlaceholder')} value={name} onChangeText={setName} />
        {adding.error ? <Notice tone="negative" message={adding.error} /> : null}
        <Button label={t('common:actions.add')} busy={adding.busy} onPress={adding.submit} />
      </Card>
      <AsyncBoundary state={platforms}>
        {(list) => (
          <>
            {list.length === 1 ? <Notice tone="accent" message={t('platforms.keepOne')} /> : null}
            <Card title={t('platforms.listTitle')}>
              {list.map((platform) => (
                <ListRow
                  key={platform.id}
                  leading={<PlatformBadge name={platform.name} />}
                  value={list.length === 1 ? undefined : t('common:actions.remove')}
                  valueTone="muted"
                  onPress={list.length === 1 ? undefined : () => remove(platform.id, platform.name)}
                />
              ))}
            </Card>
          </>
        )}
      </AsyncBoundary>
    </Screen>
  );
}
