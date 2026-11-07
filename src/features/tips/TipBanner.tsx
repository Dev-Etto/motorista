import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card } from '@shared/ui/primitives';
import { dismissTip, isTipDismissed } from './tipsDismissal';

export function TipBanner({ id, message }: { id: string; message: string }) {
  const { t } = useTranslation(['tips', 'common']);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void isTipDismissed(id).then((dismissed) => setVisible(!dismissed));
  }, [id]);

  if (!visible) return null;

  const close = async () => {
    setVisible(false);
    await dismissTip(id);
  };

  return (
    <Card>
      <AppText variant="caption" tone="accent" bold>
        {t('banner.label')}
      </AppText>
      <AppText>{message}</AppText>
      <Button label={t('common:actions.gotIt')} variant="secondary" onPress={close} />
    </Card>
  );
}
