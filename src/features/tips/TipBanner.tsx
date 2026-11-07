import { useEffect, useState } from 'react';
import { z } from 'zod';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { AppText, Button, Card } from '@/shared/ui/primitives';

async function isDismissed(id: string) {
  const dismissed = await settingsRepository.getJson(SETTING_KEYS.tipsDismissed, z.array(z.string()), []);
  return dismissed.includes(id);
}

async function dismiss(id: string) {
  const dismissed = await settingsRepository.getJson(SETTING_KEYS.tipsDismissed, z.array(z.string()), []);
  await settingsRepository.setJson(SETTING_KEYS.tipsDismissed, [...dismissed, id]);
}

export function TipBanner({ id, message }: { id: string; message: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void isDismissed(id).then((dismissed) => setVisible(!dismissed));
  }, [id]);

  if (!visible) return null;

  const close = async () => {
    setVisible(false);
    await dismiss(id);
  };

  return (
    <Card>
      <AppText variant="caption" tone="accent" bold>Dica</AppText>
      <AppText>{message}</AppText>
      <Button label="Entendi" variant="secondary" onPress={close} />
    </Card>
  );
}
