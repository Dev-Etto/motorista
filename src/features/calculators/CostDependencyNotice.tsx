import { useRouter } from 'expo-router';
import { Button, Card, AppText } from '@/shared/ui/primitives';

export function CostDependencyNotice({ costPerKm }: { costPerKm: number }) {
  const router = useRouter();
  if (costPerKm > 0) return null;

  return (
    <Card>
      <AppText bold>Primeiro, descubra seu custo por km</AppText>
      <AppText tone="muted">Sem ele, a calculadora não sabe quanto do valor vai para o carro.</AppText>
      <Button label="Calcular meu custo" onPress={() => router.push('/vehicle')} />
    </Card>
  );
}
