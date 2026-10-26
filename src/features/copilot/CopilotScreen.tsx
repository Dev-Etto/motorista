import { OfferHistoryEntry } from '@modules/copilot';
import { OfferColor } from '@/domain/offer/offer';
import { AppText, Button, ButtonRow, Card, EmptyState, ListRow, Notice, Screen, ToggleRow } from '@/shared/ui/primitives';
import { formatPerHour, formatPerKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { useCopilot } from './useCopilot';

const COLOR_TONES: Record<OfferColor, 'positive' | 'warning' | 'negative'> = {
  green: 'positive',
  yellow: 'warning',
  red: 'negative',
};

function HistoryRow({ entry }: { entry: OfferHistoryEntry }) {
  return (
    <ListRow
      title={`${formatBRL(entry.valueCents)} • ${entry.km.toFixed(1).replace('.', ',')} km • ${entry.minutes} min`}
      subtitle={`${formatPerKm(entry.perKmCents)} • ${formatPerHour(entry.perHourCents)}`}
      value={formatBRL(entry.profitCents)}
      valueTone={COLOR_TONES[entry.color]}
    />
  );
}

export default function CopilotScreen() {
  const copilot = useCopilot();
  const { status } = copilot;

  return (
    <Screen>
      <Notice
        tone="negative"
        message="Use por sua conta e risco: plataformas como a Uber têm regras contra ferramentas de automação, e usar apps de terceiros pode trazer punições à sua conta. O Copiloto só lê e informa: nunca toca na tela, nem aceita ou recusa corridas."
      />

      <Card title="Permissão de acessibilidade">
        <AppText tone={status.accessibilityGranted ? 'positive' : 'warning'} bold>
          {status.accessibilityGranted ? 'Ativa' : 'Desativada'}
        </AppText>
        <AppText variant="caption" tone="muted">
          Lê valor, distância e tempo nos apps de corrida. Nada sai do aparelho, e nomes, endereços e conversas não são guardados.
        </AppText>
        <Button label="Abrir acessibilidade" variant="secondary" onPress={copilot.openAccessibility} />
        <Notice
          tone="accent"
          message="Se o Android bloquear a opção: abra os detalhes do app, toque nos três pontos e escolha permitir configurações restritas."
        />
        <Button label="Abrir detalhes do app" variant="secondary" onPress={copilot.openAppSettings} />
      </Card>

      <Card title="Funções">
        <ToggleRow label="Ler ofertas" hint="Mostra o cartão quando uma oferta é reconhecida." value={status.enabled} onChange={copilot.setEnabled} />
        <ToggleRow label="Anunciar por voz" hint="Fala a cor e os valores por km e por hora." value={status.voiceEnabled} onChange={copilot.setVoiceEnabled} />
        <ToggleRow label="Botão flutuante" hint="Mostra o cronômetro da jornada sobre os outros apps." value={status.floatingRunning} onChange={copilot.setFloating} />
        <Button label="Testar cartão" variant="secondary" onPress={copilot.testCard} />
        {copilot.message ? <Notice tone="accent" message={copilot.message} /> : null}
      </Card>

      {copilot.history.length === 0 ? (
        <EmptyState title="Nenhuma oferta lida" message="As últimas 100 ofertas reconhecidas aparecem aqui, só com os números." />
      ) : (
        <Card title="Últimas ofertas">
          {copilot.history.map((entry) => (
            <HistoryRow key={entry.timestamp} entry={entry} />
          ))}
          <ButtonRow>
            <Button label="Limpar histórico" variant="danger" onPress={copilot.clearHistory} />
          </ButtonRow>
        </Card>
      )}

      <Card title="Calibração">
        <ToggleRow
          label="Ver o que o Copiloto lê"
          hint="Mostra o texto da tela com as palavras mascaradas. Fica só na memória."
          value={copilot.diagnosticsOn}
          onChange={copilot.toggleDiagnostics}
        />
        {copilot.diagnostics.map((line, index) => (
          <AppText key={index} variant="caption" tone="muted">{line}</AppText>
        ))}
      </Card>
    </Screen>
  );
}
