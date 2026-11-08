import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Share } from 'react-native';
import { ISSUES_URL } from '@config/app';
import { copilot } from '@modules/copilot';
import { TextField } from '@shared/ui/fields';
import { AppText, Button, Card, Notice, Screen } from '@shared/ui/primitives';
import { buildProblemReport } from './problemReport';

function deviceName(unknownDevice: string) {
  if (Platform.OS !== 'android') return unknownDevice;
  return [Platform.constants.Brand, Platform.constants.Model].filter(Boolean).join(' ') || unknownDevice;
}

export default function ReportScreen() {
  const { t } = useTranslation('settings');
  const [description, setDescription] = useState('');
  const [snapshot] = useState(() => ({ status: copilot.getStatus(), readings: copilot.getDiagnostics() }));
  const { status, readings } = snapshot;
  const report = buildProblemReport(
    {
      description,
      version: Constants.expoConfig?.version ?? '',
      android: String(Platform.Version),
      device: deviceName(t('report.unknownDevice')),
      accessibilityGranted: status.accessibilityGranted,
      failedReads: status.failedReads,
      readings,
    },
    t,
  );

  return (
    <Screen>
      <Card title={t('report.cardTitle')}>
        <TextField
          label={t('report.descriptionLabel')}
          placeholder={t('report.descriptionPlaceholder')}
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <Button label={t('report.sendButton')} onPress={() => Share.share({ message: report })} />
        <AppText variant="caption" tone="muted">
          {t('report.sendHint')}
        </AppText>
      </Card>
      <Card title={t('report.previewTitle')}>
        <AppText variant="caption" tone="muted" selectable>
          {report}
        </AppText>
      </Card>
      <Notice tone="accent" message={t('report.maskedNotice')} />
      <Button label={t('report.githubButton')} variant="secondary" onPress={() => Linking.openURL(ISSUES_URL)} />
    </Screen>
  );
}
