import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Share } from 'react-native';
import { copilot } from '@modules/copilot';
import { TextField } from '@shared/ui/fields';
import { AppText, Button, Card, Notice, Screen, ToggleRow } from '@shared/ui/primitives';
import { buildProblemReport } from './problemReport';
import { useProblemReport } from './useProblemReport';

function deviceName(unknownDevice: string) {
  if (Platform.OS !== 'android') return unknownDevice;
  return [Platform.constants.Brand, Platform.constants.Model].filter(Boolean).join(' ') || unknownDevice;
}

export default function ReportScreen() {
  const { t, i18n } = useTranslation('settings');
  const [description, setDescription] = useState('');
  const [includeReadings, setIncludeReadings] = useState(false);
  const [snapshot] = useState(() => ({ status: copilot.getStatus(), readings: copilot.getDiagnostics() }));
  const { status, send } = useProblemReport();
  const input = {
    description: description.trim(),
    version: Constants.expoConfig?.version ?? '',
    android: String(Platform.Version),
    device: deviceName(t('report.unknownDevice')),
    accessibilityGranted: snapshot.status.accessibilityGranted,
    failedReads: snapshot.status.failedReads,
    readings: includeReadings ? snapshot.readings : [],
  };
  const report = buildProblemReport(input, t);
  const sent = status === 'sent';

  return (
    <Screen>
      <Card title={t('report.cardTitle')}>
        <TextField
          label={t('report.descriptionLabel')}
          placeholder={t('report.descriptionPlaceholder')}
          multiline
          maxLength={4000}
          value={description}
          onChangeText={setDescription}
        />
        <ToggleRow
          label={t('report.readingsLabel')}
          hint={t('report.readingsHint', { count: snapshot.readings.length })}
          value={includeReadings}
          onChange={setIncludeReadings}
        />
        <Button
          label={sent ? t('report.sentButton') : t('report.sendButton')}
          busy={status === 'sending'}
          disabled={sent || input.description === ''}
          onPress={() => send({ ...input, language: i18n.language })}
        />
        <AppText variant="caption" tone="muted">
          {t('report.sendHint')}
        </AppText>
      </Card>
      {sent ? <Notice tone="positive" message={t('report.sentNotice')} /> : null}
      {status === 'failed' ? <Notice tone="negative" message={t('report.failedNotice')} /> : null}
      <Card title={t('report.previewTitle')}>
        <AppText variant="caption" tone="muted" selectable>
          {report}
        </AppText>
      </Card>
      <Notice tone="accent" message={t('report.maskedNotice')} />
      <Button label={t('report.shareButton')} variant="secondary" onPress={() => Share.share({ message: report })} />
    </Screen>
  );
}
