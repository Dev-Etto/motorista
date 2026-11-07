import { EarningsEstimate } from '@/domain/offer/offerLog';
import { AppText, Card, ListRow } from '@/shared/ui/primitives';
import { formatBRL } from '@/shared/utils/money';

const describeTrips = (trips: number) => (trips === 1 ? '1 corrida aceita' : `${trips} corridas aceitas`);

export function EstimateCard({ estimate }: { estimate: EarningsEstimate }) {
  return (
    <Card title="Faturamento estimado">
      <AppText variant="display" bold>
        {formatBRL(estimate.totalCents)}
      </AppText>
      <AppText variant="caption" tone="muted">
        É uma sugestão, feita com as corridas que o app viu você aceitar. O valor real pode mudar com cancelamentos, gorjetas e taxas. Se precisar, corrija ao
        registrar a jornada.
      </AppText>
      {estimate.byPlatform.map((platform) => (
        <ListRow key={platform.source} title={platform.source} subtitle={describeTrips(platform.trips)} value={formatBRL(platform.cents)} />
      ))}
    </Card>
  );
}
