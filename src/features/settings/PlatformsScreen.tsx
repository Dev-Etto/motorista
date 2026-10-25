import { useState } from 'react';
import { platformRepository } from '@/data/repositories/platformRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { TextField } from '@/shared/ui/fields';
import { Button, Card, ListRow, Screen } from '@/shared/ui/primitives';

export default function PlatformsScreen() {
  const { data, reload } = useAsyncData(() => platformRepository.list());
  const [name, setName] = useState('');

  const add = async () => {
    if (!name.trim()) return;
    await platformRepository.add(name);
    setName('');
    await reload();
  };

  const remove = async (id: number) => {
    await platformRepository.deactivate(id);
    await reload();
  };

  return (
    <Screen>
      <Card title="Nova plataforma">
        <TextField label="Nome" value={name} onChangeText={setName} />
        <Button label="Adicionar" onPress={add} />
      </Card>
      <Card title="Suas plataformas">
        {(data ?? []).map((platform) => (
          <ListRow key={platform.id} title={platform.name} subtitle="Toque para remover" onPress={() => remove(platform.id)} />
        ))}
      </Card>
    </Screen>
  );
}
