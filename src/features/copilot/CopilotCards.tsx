import { CardLayout, CardSize, copilot as nativeCopilot, OfferHistoryEntry, PrimaryMetric } from '@modules/copilot';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '@/shared/theme/theme';
import { PlatformBadge } from '@/shared/ui/PlatformBadge';
import { ScoreBadge } from '@/shared/ui/ScoreBadge';
import { AppText, Button, ButtonRow, Card, Collapsible, Notice, Segmented, ToggleRow } from '@/shared/ui/primitives';
import { formatPerHour, formatPerKm } from '@/shared/utils/format';
import { formatBRL, formatNumber } from '@/shared/utils/money';
import { CopilotState } from './useCopilot';

const REASON_SEPARATOR = ' · ';

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
  { packageName: 'com.ubercab.driver', label: 'Uber' },
  { packageName: 'com.app99.driver', label: '99' },
  { packageName: 'sinet.startup.inDriver', label: 'inDrive' },
];

export function CopilotStatusCard({ copilot }: { copilot: CopilotState }) {
  const { status } = copilot;

  return (
    <Card title="Copiloto">
      <ToggleRow label="Ler ofertas" hint="Avalia cada oferta reconhecida." value={status.enabled} onChange={copilot.setEnabled} />
      <AppText bold tone={status.accessibilityGranted ? 'positive' : 'warning'}>
        {status.accessibilityGranted ? 'Acessibilidade ativa' : 'Acessibilidade desativada'}
      </AppText>
      {status.accessibilityGranted ? null : <Button label="Ativar acessibilidade" onPress={copilot.openAccessibility} />}
      {status.shortcutEnabled ? (
        <>
          <Notice tone="accent" message="O ícone na lateral é um atalho do Android, e o Copiloto funciona sem ele. Para tirá-lo, abra Copiloto de ofertas na próxima tela e desligue a opção de atalho." />
          <Button label="Remover o ícone da lateral" variant="secondary" onPress={copilot.openShortcutSettings} />
        </>
      ) : null}
      {status.enabled && status.batteryRestricted ? (
        <>
          <Notice tone="accent" message="O Android pode pausar o Copiloto e a medição de km para economizar bateria. Se as ofertas pararem de aparecer, escolha Motorista na próxima tela e marque Não otimizar." />
          <Button label="Abrir ajustes de bateria" variant="secondary" onPress={nativeCopilot.openBatterySettings} />
        </>
      ) : null}
      {status.failedReads > 0 ? <Notice message={`${status.failedReads === 1 ? '1 leitura ficou incompleta e não foi mostrada' : `${status.failedReads} leituras ficaram incompletas e não foram mostradas`}, para você só ver números confiáveis.`} /> : null}
    </Card>
  );
}

export function CopilotChannelsCard({ copilot }: { copilot: CopilotState }) {
  const { preferences, status } = copilot;

  return (
    <Card title="Como receber a oferta">
      <ToggleRow label="Voz" hint="Recomendado ao dirigir: não exige olhar para a tela." value={preferences.voice} onChange={(voice) => copilot.updatePreferences({ voice })} />
      {preferences.voice && status.accessibilityGranted && !status.voiceAvailable ? (
        <>
          <Notice tone="accent" message="Instale uma voz em português no Android para ouvir as ofertas." />
          <Button label="Abrir configurações de voz" variant="secondary" onPress={copilot.openVoiceSettings} />
        </>
      ) : null}
      <ToggleRow label="Cartão na tela" hint="Com o carro parado, arraste para onde preferir. O app guarda a posição." value={preferences.card} onChange={(card) => copilot.updatePreferences({ card })} />
      <ToggleRow label="Botão flutuante" hint="Fica sobre os outros apps, com o cronômetro. A oferta abre dentro dele." value={status.floatingRunning} onChange={copilot.setFloating} />
      <ToggleRow label="Notificação" hint="Fica no painel do Android para consultar depois." value={preferences.notification} onChange={copilot.setNotification} />
      <Button label="Ver exemplo da notificação" variant="secondary" onPress={copilot.testNotification} />
      <ButtonRow>
        <Button label="Testar cartão" onPress={copilot.test} />
        <Button label="Testar fora do app" variant="secondary" onPress={copilot.testOutside} />
      </ButtonRow>
      {copilot.message ? <Notice tone="accent" message={copilot.message} /> : null}
    </Card>
  );
}

export function CopilotDisplayCard({ copilot }: { copilot: CopilotState }) {
  const { preferences } = copilot;

  return (
    <Collapsible title="Aparência do cartão">
      <AppText variant="caption" tone="muted">Vale para o cartão na tela e para a oferta dentro do botão flutuante.</AppText>
      <AppText variant="caption" tone="muted">Formato</AppText>
      <Segmented value={preferences.cardLayout} options={LAYOUTS} onChange={(cardLayout) => copilot.updatePreferences({ cardLayout })} />
      <AppText variant="caption" tone="muted">Número principal (voz e formato resumido)</AppText>
      <Segmented value={preferences.primaryMetric} options={METRICS} onChange={(primaryMetric) => copilot.updatePreferences({ primaryMetric })} />
      <AppText variant="caption" tone="muted">Tamanho</AppText>
      <Segmented value={preferences.cardSize} options={SIZES} onChange={(cardSize) => copilot.updatePreferences({ cardSize })} />
      <AppText variant="caption" tone="muted">Tempo máximo na tela</AppText>
      <Segmented
        value={String(preferences.durationSeconds)}
        options={DURATIONS}
        onChange={(duration) => copilot.updatePreferences({ durationSeconds: Number(duration) })}
      />
      <Button label="Voltar o cartão para o topo" variant="secondary" onPress={nativeCopilot.resetCardPosition} />
    </Collapsible>
  );
}

export function CopilotAppsCard({ copilot }: { copilot: CopilotState }) {
  return (
    <Collapsible title="Apps monitorados">
      {APPS.map((app) => (
        <ToggleRow
          key={app.packageName}
          label={app.label}
          value={copilot.preferences.monitoredPackages.includes(app.packageName)}
          onChange={() => copilot.toggleMonitored(app.packageName)}
        />
      ))}
    </Collapsible>
  );
}

function HistoryRow({ entry }: { entry: OfferHistoryEntry }) {
  const colors = useTheme();
  return (
    <View style={[styles.historyRow, { borderBottomColor: colors.border }]}>
      <View style={styles.historyHeader}>
        <View><PlatformBadge name={entry.source} /></View>
        <AppText variant="subtitle" bold style={styles.historyValue}>{formatBRL(entry.valueCents)}</AppText>
        <ScoreBadge score={entry.score} color={entry.color} />
      </View>
      <AppText>{entry.minutes > 0 ? `${formatNumber(entry.km)} km • ${entry.minutes} min` : `${formatNumber(entry.km)} km`}</AppText>
      <AppText variant="caption" tone="muted">{entry.minutes > 0 ? `${formatPerKm(entry.perKmCents)} • ${formatPerHour(entry.perHourCents)}` : formatPerKm(entry.perKmCents)}</AppText>
      {entry.reason ? <AppText variant="caption" tone="muted">{entry.reason.replace(REASON_SEPARATOR, '\n')}</AppText> : null}
    </View>
  );
}

export function CopilotHistoryCard({ copilot }: { copilot: CopilotState }) {
  if (copilot.history.length === 0) return null;

  return (
    <Collapsible title={`Últimas ofertas (${copilot.history.length})`}>
      {copilot.history.map((entry) => (
        <HistoryRow key={entry.timestamp} entry={entry} />
      ))}
      <Button label="Limpar histórico" variant="danger" onPress={copilot.clearHistory} />
    </Collapsible>
  );
}

export function CopilotCalibrationCard({ copilot }: { copilot: CopilotState }) {
  const router = useRouter();

  return (
    <Collapsible title="Calibração">
      <ToggleRow
        label="Ver o que o Copiloto lê"
        hint="Mostra o texto da tela com as palavras mascaradas. Fica só na memória."
        value={copilot.diagnosticsOn}
        onChange={copilot.toggleDiagnostics}
      />
      {copilot.diagnostics.map((line, index) => (
        <AppText key={index} variant="caption" tone="muted" selectable>{line}</AppText>
      ))}
      {copilot.diagnostics.length > 0 ? <Button label="Enviar estas leituras" variant="secondary" onPress={() => router.push('/report')} /> : null}
    </Collapsible>
  );
}

const styles = StyleSheet.create({
  historyRow: { gap: spacing.xs, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyValue: { flex: 1 },
});
