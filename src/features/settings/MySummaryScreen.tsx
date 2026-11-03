import Constants from 'expo-constants';
import { Share } from 'react-native';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { AppText, Button, Card, ListRow, Screen } from '@/shared/ui/primitives';
import { formatDate } from '@/shared/utils/dates';

const version = () => Constants.expoConfig?.version ?? '—';
const displayDate = (date: string | null) => (date ? formatDate(date) : '—');

export default function MySummaryScreen() {
  const { data } = useAsyncData(() => shiftRepository.usageStats());
  if (!data) return <Screen>{null}</Screen>;

  const share = () =>
    Share.share({
      message: `Resumo do app Motorista\nVersão: ${version()}\nJornadas: ${data.total}\nDias com jornada: ${data.days}\nPrimeira: ${displayDate(data.first)}\nÚltima: ${displayDate(data.last)}`,
    });

  return (
    <Screen>
      <Card title="Uso do app">
        <ListRow title="Jornadas registradas" value={String(data.total)} />
        <ListRow title="Dias com jornada" value={String(data.days)} />
        <ListRow title="Primeira jornada" value={displayDate(data.first)} />
        <ListRow title="Última jornada" value={displayDate(data.last)} />
        <ListRow title="Versão" value={version()} />
      </Card>
      <AppText tone="muted">Só estes números são compartilhados, sem valores, locais ou dados pessoais. O envio só acontece se você quiser.</AppText>
      <Button label="Compartilhar resumo" onPress={share} />
    </Screen>
  );
}
