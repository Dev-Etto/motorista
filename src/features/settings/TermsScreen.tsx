import { useTranslation } from 'react-i18next';
import { APP_NAME } from '@config/app';
import { AppText } from '@shared/ui/primitives';
import { InfoScreen } from './InfoScreen';

const SECTION_IDS = ['about', 'estimates', 'decisions', 'traffic', 'platforms', 'data', 'warranty', 'license', 'changes'] as const;

export default function TermsScreen() {
  const { t } = useTranslation('settings');
  const sections = SECTION_IDS.map((id) => ({ title: t(`terms.${id}.title`), body: t(`terms.${id}.body`, { appName: APP_NAME }) }));

  return (
    <InfoScreen
      sections={sections}
      footer={
        <AppText variant="caption" tone="muted" center>
          {t('terms.updatedAt')}
        </AppText>
      }
    />
  );
}
