import { copilot } from '@modules/copilot';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Platform, Share } from 'react-native';
import { ISSUES_URL } from '@/config/app';
import { TextField } from '@/shared/ui/fields';
import { AppText, Button, Card, Notice, Screen } from '@/shared/ui/primitives';
import { buildProblemReport } from './problemReport';

function deviceName() {
  const constants = Platform.constants as { Brand?: string; Model?: string };
  return [constants.Brand, constants.Model].filter(Boolean).join(' ') || 'não identificado';
}

export default function ReportScreen() {
  const [description, setDescription] = useState('');
  const status = copilot.getStatus();
  const report = buildProblemReport({
    description,
    version: Constants.expoConfig?.version ?? '',
    android: String(Platform.Version),
    device: deviceName(),
    accessibilityGranted: status.accessibilityGranted,
    failedReads: status.failedReads,
    readings: copilot.getDiagnostics(),
  });

  return (
    <Screen>
      <Card title="O que aconteceu?">
        <TextField label="Conte com suas palavras" placeholder="A oferta da Uber não apareceu" multiline value={description} onChangeText={setDescription} />
        <Button label="Enviar relato" onPress={() => Share.share({ message: report })} />
        <AppText variant="caption" tone="muted">Você escolhe para onde enviar, como o WhatsApp ou o e-mail. Nada sai do celular sem você enviar.</AppText>
      </Card>
      <Card title="O que será enviado">
        <AppText variant="caption" tone="muted" selectable>{report}</AppText>
      </Card>
      <Notice tone="accent" message="As palavras lidas pelo Copiloto vão mascaradas, mas os números ficam. Confira o texto acima antes de enviar." />
      <Button label="Abrir no GitHub" variant="secondary" onPress={() => Linking.openURL(ISSUES_URL)} />
    </Screen>
  );
}
