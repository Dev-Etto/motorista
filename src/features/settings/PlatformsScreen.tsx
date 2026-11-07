import { useState } from 'react';
import { platformRepository } from '@/data/repositories/platformRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { useSubmit } from '@/shared/hooks/useSubmit';
import { TextField } from '@/shared/ui/fields';
import { PlatformBadge } from '@/shared/ui/PlatformBadge';
import { AppText, Button, Card, ListRow, Notice, Screen } from '@/shared/ui/primitives';
import { confirmAction } from '@/shared/utils/confirm';

export default function PlatformsScreen() {
  const { data, reload } = useAsyncData(() => platformRepository.list());
  const [name, setName] = useState('');

  const adding = useSubmit(async () => {
    if (!name.trim()) return;
    await platformRepository.add(name);
    setName('');
    await reload();
  });

  const remove = (id: number, platformName: string) => {
    confirmAction({
      title: `Remover ${platformName}?`,
      message: 'Jornadas antigas continuam com este nome.',
      actionLabel: 'Remover',
      onConfirm: async () => {
        await platformRepository.deactivate(id);
        await reload();
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
      {(data ?? []).length === 1 ? <Notice tone="accent" message="Mantenha pelo menos uma plataforma para registrar seus ganhos." /> : null}
      <Card title="Suas plataformas">
        {(data ?? []).map((platform) => (
          <ListRow key={platform.id} leading={<PlatformBadge name={platform.name} />} value={data?.length === 1 ? undefined : 'Remover'} valueTone="muted" onPress={data?.length === 1 ? undefined : () => remove(platform.id, platform.name)} />
        ))}
      </Card>
    </Screen>
  );
}
