import { useState } from 'react';
import { useSubmit } from '@/shared/hooks/useSubmit';
import { confirmAction } from '@/shared/platform/confirm';
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary';
import { TextField } from '@/shared/ui/fields';
import { PlatformBadge } from '@/shared/ui/PlatformBadge';
import { AppText, Button, Card, ListRow, Notice, Screen } from '@/shared/ui/primitives';
import { usePlatforms } from './usePlatforms';

export default function PlatformsScreen() {
  const { state: platforms, add, deactivate } = usePlatforms();
  const [name, setName] = useState('');

  const adding = useSubmit(async () => {
    if (!name.trim()) return;
    await add(name);
    setName('');
  });

  const remove = (id: number, platformName: string) => {
    confirmAction({
      title: `Remover ${platformName}?`,
      message: 'Jornadas antigas continuam com este nome.',
      actionLabel: 'Remover',
      onConfirm: async () => {
        await deactivate(id);
      },
    });
  };

  return (
    <Screen>
      <AppText tone="muted">Estas plataformas aparecem no registro da jornada e nos relatórios.</AppText>
      <Card title="Nova plataforma">
        <TextField label="Nome" placeholder="iFood, Lalamove…" value={name} onChangeText={setName} />
        {adding.error ? <Notice tone="negative" message={adding.error} /> : null}
        <Button label="Adicionar" busy={adding.busy} onPress={adding.submit} />
      </Card>
      <AsyncBoundary state={platforms}>
        {(list) => (
          <>
            {list.length === 1 ? <Notice tone="accent" message="Mantenha pelo menos uma plataforma para registrar seus ganhos." /> : null}
            <Card title="Suas plataformas">
              {list.map((platform) => (
                <ListRow
                  key={platform.id}
                  leading={<PlatformBadge name={platform.name} />}
                  value={list.length === 1 ? undefined : 'Remover'}
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
