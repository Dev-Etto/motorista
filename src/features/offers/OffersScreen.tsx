import { OutcomeFilter } from '@/domain/offer/offerLog';
import { confirmAction } from '@/shared/platform/confirm';
import { DateField } from '@/shared/ui/DateField';
import { FilterChips } from '@/shared/ui/FilterChips';
import { Button, Card, EmptyState, Notice, Screen, ToggleRow } from '@/shared/ui/primitives';
import { EstimateCard } from './EstimateCard';
import { PERIOD_OPTIONS } from './offerPeriod';
import { OfferRow } from './OfferRow';
import { OutcomeSummaryCard } from './OutcomeSummaryCard';
import { ALL_SOURCES, useOffers } from './useOffers';

const OUTCOME_OPTIONS: { value: OutcomeFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'accepted', label: 'Aceitas' },
  { value: 'notAccepted', label: 'Não aceitas' },
];

export default function OffersScreen() {
  const offers = useOffers();
  const sourceOptions = [{ value: ALL_SOURCES, label: 'Todos' }, ...offers.sources.map((source) => ({ value: source, label: source }))];

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
        <FilterChips label="Período" value={offers.period} options={PERIOD_OPTIONS} onChange={offers.setPeriod} />
        {offers.period === 'custom' ? (
          <>
            <DateField label="De" value={offers.custom.start} onChange={(start) => start && offers.setCustom({ ...offers.custom, start })} />
            <DateField label="Até" value={offers.custom.end} onChange={(end) => end && offers.setCustom({ ...offers.custom, end })} />
          </>
        ) : null}
        {offers.sources.length > 1 ? <FilterChips label="App" value={offers.source} options={sourceOptions} onChange={offers.setSource} /> : null}
      </Card>
      {offers.estimating ? <EstimateCard estimate={offers.estimate} /> : null}
      {offers.estimating ? <OutcomeSummaryCard title="Aceitas e não aceitas" summary={offers.summary} /> : null}
      <Card title="Ofertas">
        <FilterChips label="Resultado" value={offers.outcome} options={OUTCOME_OPTIONS} onChange={offers.setOutcome} />
        {offers.offers.map((entry) => (
          <OfferRow key={entry.timestamp} entry={entry} />
        ))}
        {offers.hasMore ? <Button label="Ver mais" variant="secondary" onPress={offers.showMore} /> : null}
      </Card>
      {offers.offers.length === 0 ? (
        <EmptyState title="Nenhuma oferta aqui" message="Troque os filtros ou aguarde as próximas ofertas lidas pelo Copiloto." />
      ) : null}
      <Notice
        tone="accent"
        message="O app registra sozinho o que você aceita. Se o valor sugerido estiver diferente do que recebeu, é só corrigir ao registrar a jornada."
      />
      <Card title="Ajustes">
        <ToggleRow
          label="Estimar faturamento pelos aceites"
          hint="Nota quando você toca em aceitar ou recusar nos apps de corrida. Nada sai do celular."
          value={offers.estimating}
          onChange={offers.toggleEstimating}
        />
        <Button label="Limpar as ofertas" variant="danger" onPress={confirmClear} />
      </Card>
    </Screen>
  );
}
