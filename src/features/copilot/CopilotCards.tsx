import { useRouter } from 'expo-router';
import { OfferRow } from '@/features/offers';
import { AppText, Button, ButtonRow, Card, Collapsible, Notice, Segmented, ToggleRow } from '@/shared/ui/primitives';
import { CardLayout, CardSize, OfferHistoryEntry, PrimaryMetric } from '@modules/copilot';
import { PLATFORM_PACKAGES } from '@modules/copilot/platforms';
import { CopilotDiagnosticsState } from './useCopilotDiagnostics';
import { CopilotPreferencesState } from './useCopilotPreferences';
import { CopilotStatusState } from './useCopilotStatus';
import { CopilotTestsState } from './useCopilotTests';

const METRICS: { value: PrimaryMetric; label: string }[] = [
  { value: 'perKm', label: 'R$/km' },
  { value: 'profit', label: 'Lucro' },
];
const LAYOUTS: { value: CardLayout; label: string }[] = [
  { value: 'complete', label: 'Completo' },
  { value: 'summary', label: 'Resumido' },
];
const SIZES: { value: CardSize; label: string }[] = [
  { value: 'compact', label: 'Compacto' },
  { value: 'large', label: 'Grande' },
  { value: 'extra', label: 'Extra' },
];
const DURATIONS: { value: string; label: string }[] = [
  { value: '8', label: '8 s' },
  { value: '12', label: '12 s' },
  { value: '15', label: '15 s' },
];
const APPS = [
  { packageName: PLATFORM_PACKAGES.uber, label: 'Uber' },
  { packageName: PLATFORM_PACKAGES.ninetyNine, label: '99' },
  { packageName: PLATFORM_PACKAGES.inDrive, label: 'inDrive' },
];

export function CopilotStatusCard({ copilot, preferences }: { copilot: CopilotStatusState; preferences: CopilotPreferencesState }) {
  const status = copilot.current;

  return (
    <Card title="Copiloto">
      <ToggleRow label="Ler ofertas" hint="Avalia cada oferta reconhecida." value={status.enabled} onChange={copilot.setEnabled} />
      <ToggleRow
        label="Ler a imagem da tela"
        hint="Reforço na Uber e na 99, para quando o texto da oferta não está disponível. A imagem é lida no celular e descartada na hora."
        value={preferences.current.imageReading}
        onChange={(imageReading) => preferences.update({ imageReading })}
      />
      <Notice
        tone="accent"
        message="As plataformas podem identificar apps que usam acessibilidade ou sobreposição, e as regras delas podem prever punições na conta. Usar o Copiloto é decisão sua, e a leitura pode não funcionar em todos os aparelhos."
      />
      <AppText bold tone={status.accessibilityGranted ? 'positive' : 'warning'}>
        {status.accessibilityGranted ? 'Acessibilidade ativa' : 'Acessibilidade desativada'}
      </AppText>
      {status.accessibilityGranted ? null : <Button label="Ativar acessibilidade" onPress={copilot.openAccessibility} />}
      {status.shortcutEnabled ? (
        <>
          <Notice
            tone="accent"
            message="O ícone na lateral é um atalho do Android, e o Copiloto funciona sem ele. Para tirá-lo, abra Copiloto de ofertas na próxima tela e desligue a opção de atalho."
          />
          <Button label="Remover o ícone da lateral" variant="secondary" onPress={copilot.openShortcutSettings} />
        </>
      ) : null}
      {status.enabled && status.batteryRestricted ? (
        <>
          <Notice
            tone="accent"
            message="O Android pode pausar o Copiloto e a medição de km para economizar bateria. Se as ofertas pararem de aparecer, escolha Motorista na próxima tela e marque Não otimizar."
          />
          <Button label="Abrir ajustes de bateria" variant="secondary" onPress={copilot.openBatterySettings} />
        </>
      ) : null}
      {status.failedReads > 0 ? (
        <Notice
          message={`${status.failedReads === 1 ? '1 leitura ficou incompleta e não foi mostrada' : `${status.failedReads} leituras ficaram incompletas e não foram mostradas`}, para você só ver números confiáveis.`}
        />
      ) : null}
    </Card>
  );
}

interface ChannelsCardProps {
  copilot: CopilotStatusState;
  preferences: CopilotPreferencesState;
  tests: CopilotTestsState;
  message: string | null;
}

export function CopilotChannelsCard({ copilot, preferences: settings, tests, message }: ChannelsCardProps) {
  const status = copilot.current;
  const preferences = settings.current;

  return (
    <Card title="Como receber a oferta">
      <ToggleRow
        label="Voz"
        hint="Recomendado ao dirigir: não exige olhar para a tela."
        value={preferences.voice}
        onChange={(voice) => settings.update({ voice })}
      />
      {preferences.voice && status.accessibilityGranted && !status.voiceAvailable ? (
        <>
          <Notice tone="accent" message="Instale uma voz em português no Android para ouvir as ofertas." />
          <Button label="Abrir configurações de voz" variant="secondary" onPress={copilot.openVoiceSettings} />
        </>
      ) : null}
      <ToggleRow
        label="Cartão na tela"
        hint="Com o carro parado, arraste para onde preferir. O app guarda a posição."
        value={preferences.card}
        onChange={(card) => settings.update({ card })}
      />
      <ToggleRow
        label="Botão flutuante"
        hint="Fica sobre os outros apps, com o cronômetro. A oferta abre dentro dele. Só esta opção desliga o botão de vez. A plataforma pode escondê-lo durante a oferta, então deixe a voz ligada."
        value={status.floatingRunning}
        onChange={settings.setFloating}
      />
      <ToggleRow
        label="Notificação"
        hint="Fica no painel do Android para consultar depois."
        value={preferences.notification}
        onChange={settings.setNotification}
      />
      <Button label="Ver exemplo da notificação" variant="secondary" onPress={tests.testNotification} />
      <ButtonRow>
        <Button label="Testar cartão" onPress={tests.test} />
        <Button label="Testar fora do app" variant="secondary" onPress={tests.testOutside} />
      </ButtonRow>
      {message ? <Notice tone="accent" message={message} /> : null}
    </Card>
  );
}

export function CopilotDisplayCard({ preferences: settings }: { preferences: CopilotPreferencesState }) {
  const preferences = settings.current;

  return (
    <Collapsible title="Aparência do cartão">
      <AppText variant="caption" tone="muted">
        Vale para o cartão na tela e para a oferta dentro do botão flutuante.
      </AppText>
      <AppText variant="caption" tone="muted">
        Formato
      </AppText>
      <Segmented value={preferences.cardLayout} options={LAYOUTS} onChange={(cardLayout) => settings.update({ cardLayout })} />
      <AppText variant="caption" tone="muted">
        Número principal (voz e formato resumido)
      </AppText>
      <Segmented value={preferences.primaryMetric} options={METRICS} onChange={(primaryMetric) => settings.update({ primaryMetric })} />
      <AppText variant="caption" tone="muted">
        Tamanho
      </AppText>
      <Segmented value={preferences.cardSize} options={SIZES} onChange={(cardSize) => settings.update({ cardSize })} />
      <AppText variant="caption" tone="muted">
        Tempo máximo na tela
      </AppText>
      <Segmented
        value={String(preferences.durationSeconds)}
        options={DURATIONS}
        onChange={(duration) => settings.update({ durationSeconds: Number(duration) })}
      />
      <Button label="Voltar o cartão para o topo" variant="secondary" onPress={settings.resetCardPosition} />
    </Collapsible>
  );
}

export function CopilotAppsCard({ preferences }: { preferences: CopilotPreferencesState }) {
  return (
    <Collapsible title="Apps monitorados">
      {APPS.map((app) => (
        <ToggleRow
          key={app.packageName}
          label={app.label}
          value={preferences.current.monitoredPackages.includes(app.packageName)}
          onChange={() => preferences.toggleMonitored(app.packageName)}
        />
      ))}
    </Collapsible>
  );
}

export function CopilotHistoryCard({ history }: { history: OfferHistoryEntry[] }) {
  const router = useRouter();
  if (history.length === 0) return null;

  return (
    <Collapsible title="Últimas ofertas">
      {history.map((entry) => (
        <OfferRow key={entry.timestamp} entry={entry} />
      ))}
      <Button label="Ver todas as ofertas" variant="secondary" onPress={() => router.push('/offers')} />
    </Collapsible>
  );
}

export function CopilotCalibrationCard({ diagnostics }: { diagnostics: CopilotDiagnosticsState }) {
  const router = useRouter();

  return (
    <Collapsible title="Calibração">
      <ToggleRow
        label="Ver o que o Copiloto lê"
        hint="Mostra o texto da tela com as palavras mascaradas. Fica só na memória."
        value={diagnostics.enabled}
        onChange={diagnostics.toggle}
      />
      {diagnostics.lines.map((line, index) => (
        <AppText key={index} variant="caption" tone="muted" selectable>
          {line}
        </AppText>
      ))}
      {diagnostics.lines.length > 0 ? <Button label="Enviar estas leituras" variant="secondary" onPress={() => router.push('/report')} /> : null}
    </Collapsible>
  );
}
