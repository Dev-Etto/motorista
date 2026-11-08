import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { deleteAllData } from '@application/deleteAllData';
import { confirmAction } from '@shared/ui/dialog';
import { Button } from '@shared/ui/primitives';
import { InfoScreen } from './InfoScreen';

const SECTION_IDS = ['data', 'permissions', 'copilot', 'backup', 'estimates'] as const;

export default function PrivacyScreen() {
  const { t } = useTranslation('settings');
  const router = useRouter();
  const sections = SECTION_IDS.map((id) => ({ title: t(`privacy.${id}.title`), body: t(`privacy.${id}.body`) }));

  const deleteAll = () =>
    confirmAction({
      title: t('deleteData.title'),
      message: t('deleteData.message'),
      actionLabel: t('deleteData.confirm'),
      onConfirm: deleteAllData,
    });

  return (
    <InfoScreen
      sections={sections}
      footer={
        <>
          <Button label={t('privacyChoices.open')} onPress={() => router.push('/privacy-choices')} />
          <Button label={t('deleteData.action')} variant="secondary" onPress={deleteAll} />
        </>
      }
    />
  );
}
