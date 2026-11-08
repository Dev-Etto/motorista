import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { APP_NAME, SUPPORT_EMAIL, TERMS_URL } from '@config/app';
import { AppText, Button } from '@shared/ui/primitives';
import { InfoScreen } from './InfoScreen';

const SECTION_IDS = ['about', 'estimates', 'decisions', 'traffic', 'platforms', 'data', 'warranty', 'subscription', 'license', 'provider', 'changes'] as const;

export default function TermsScreen() {
  const { t } = useTranslation('settings');
  const sections = SECTION_IDS.map((id) => ({ title: t(`terms.${id}.title`), body: t(`terms.${id}.body`, { appName: APP_NAME, email: SUPPORT_EMAIL }) }));

  return (
    <InfoScreen
      sections={sections}
      footer={
        <>
          <Button label={t('terms.fullTerms')} variant="secondary" onPress={() => Linking.openURL(TERMS_URL)} />
          <AppText variant="caption" tone="muted" center>
            {t('terms.updatedAt')}
          </AppText>
        </>
      }
    />
  );
}
