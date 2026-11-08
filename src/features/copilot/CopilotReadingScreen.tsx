import { useTranslation } from 'react-i18next';
import { AppText, Screen } from '@shared/ui/primitives';
import { CopilotCalibrationCard } from './CopilotCards';
import { useCopilotDiagnostics } from './useCopilotDiagnostics';

export default function CopilotReadingScreen() {
  const { t } = useTranslation('copilot');
  const diagnostics = useCopilotDiagnostics();

  return (
    <Screen>
      <AppText tone="muted">{t('calibration.intro')}</AppText>
      <CopilotCalibrationCard diagnostics={diagnostics} />
    </Screen>
  );
}
