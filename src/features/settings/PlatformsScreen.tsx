import { useState } from 'react';
import { platformRepository } from '@/data/repositories/platformRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { TextField } from '@/shared/ui/fields';
import { PlatformBadge } from '@/shared/ui/PlatformBadge';
import { AppText, Button, Card, ListRow, Screen } from '@/shared/ui/primitives';
import { confirmAction } from '@/shared/utils/confirm';

export default function PlatformsScreen() {
  const { data, reload } = useAsyncData(() => platformRepository.list());
  const [name, setName] = useState('');

  const add = async () => {
    if (!name.trim()) return;
    await platformRepository.add(name);
    setName('');
    await reload();
  };

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
        <Button label="Adicionar" onPress={add} />
      </Card>
      <Card title="Suas plataformas">
        {(data ?? []).map((platform) => (
          <ListRow key={platform.id} leading={<PlatformBadge name={platform.name} />} value="Remover" valueTone="muted" onPress={() => remove(platform.id, platform.name)} />
        ))}
      </Card>
    </Screen>
  );
}
