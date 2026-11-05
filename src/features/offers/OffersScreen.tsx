import { OutcomeFilter } from '@/domain/offer/offerLog';
import { Button, Card, EmptyState, Notice, Screen, Segmented, ToggleRow } from '@/shared/ui/primitives';
import { confirmAction } from '@/shared/utils/confirm';
import { EstimateCard } from './EstimateCard';
import { OfferRow } from './OfferRow';
import { OutcomeSummaryCard } from './OutcomeSummaryCard';
import { ALL_SOURCES, OfferPeriod, useOffers } from './useOffers';

const PERIOD_OPTIONS: { value: OfferPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'week', label: '7 dias' },
];
const OUTCOME_OPTIONS: { value: OutcomeFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'accepted', label: 'Aceitas' },
  { value: 'notAccepted', label: 'Não aceitas' },
];

export default function OffersScreen() {
  const offers = useOffers();
  const sourceOptions = offers.sources.map((source) => ({ value: source, label: source === ALL_SOURCES ? 'Todos' : source }));

  const confirmClear = () => {
    confirmAction({
      title: 'Limpar as ofertas?',
      message: 'O histórico e a estimativa de faturamento serão apagados. As jornadas salvas não mudam.',
      actionLabel: 'Limpar',
      onConfirm: offers.clear,
    });
  };

  return (
    <Screen>
      <Card>
        <Segmented value={offers.period} options={PERIOD_OPTIONS} onChange={offers.setPeriod} />
        {sourceOptions.length > 2 ? <Segmented value={offers.source} options={sourceOptions} onChange={offers.setSource} /> : null}
      </Card>
      {offers.estimating ? <EstimateCard estimate={offers.estimate} /> : null}
      {offers.estimating ? <OutcomeSummaryCard title="Aceitas e não aceitas" summary={offers.summary} /> : null}
      <Card title="Ofertas">
        <Segmented value={offers.outcome} options={OUTCOME_OPTIONS} onChange={offers.setOutcome} />
        {offers.offers.map((entry) => (
          <OfferRow key={entry.timestamp} entry={entry} onSetStatus={offers.estimating ? offers.setStatus : undefined} />
        ))}
        {offers.hasMore ? <Button label="Ver mais" variant="secondary" onPress={offers.showMore} /> : null}
      </Card>
      {offers.offers.length === 0 ? <EmptyState title="Nenhuma oferta aqui" message="Troque os filtros ou aguarde as próximas ofertas lidas pelo Copiloto." /> : null}
      <Notice tone="accent" message="Se o app errar, toque em Marcar como aceita ou não aceita. Seu faturamento só muda quando você confirma os valores na jornada." />
      <Card title="Ajustes">
        <ToggleRow label="Estimar faturamento pelos aceites" hint="Nota quando você toca em aceitar ou recusar nos apps de corrida. Nada sai do celular." value={offers.estimating} onChange={offers.toggleEstimating} />
        {offers.hasHistory ? <Button label="Limpar as ofertas" variant="danger" onPress={confirmClear} /> : null}
      </Card>
    </Screen>
  );
}
