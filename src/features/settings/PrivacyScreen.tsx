import { useTranslation } from 'react-i18next';
import { InfoScreen } from './InfoScreen';

const SECTION_IDS = ['data', 'permissions', 'copilot', 'backup', 'estimates'] as const;

export default function PrivacyScreen() {
  const { t } = useTranslation('settings');
  const sections = SECTION_IDS.map((id) => ({ title: t(`privacy.${id}.title`), body: t(`privacy.${id}.body`) }));

  return <InfoScreen sections={sections} />;
}
