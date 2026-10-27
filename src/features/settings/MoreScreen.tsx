import Constants from 'expo-constants';
import { Href, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { RELEASES_URL } from '@/config/app';
import { Card, ListRow, Screen } from '@/shared/ui/primitives';

const MENU: { title: string; subtitle: string; href: Href }[] = [
  { title: 'Veículo e custos', subtitle: 'Seu custo por km', href: '/vehicle' },
  { title: 'Meta do mês', subtitle: 'Quanto você quer lucrar', href: '/goal' },
  { title: 'Copiloto de ofertas', subtitle: 'Leitura, cartão, voz e botão flutuante', href: '/copilot' },
  { title: 'Plataformas', subtitle: 'Apps em que você trabalha', href: '/platforms' },
  { title: 'Lembretes', subtitle: 'Óleo, pneus e revisões', href: '/reminders' },
  { title: 'Backup', subtitle: 'Salvar e restaurar seus dados', href: '/backup' },
  { title: 'Privacidade', subtitle: 'O que acontece com seus dados', href: '/privacy' },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Card>
        {MENU.map((item) => (
          <ListRow key={item.title} title={item.title} subtitle={item.subtitle} onPress={() => router.push(item.href)} />
        ))}
        <ListRow
          title="Verificar atualização"
          subtitle={`Versão ${Constants.expoConfig?.version ?? ''}. Abre a página de versões no navegador.`}
          onPress={() => Linking.openURL(RELEASES_URL)}
        />
      </Card>
    </Screen>
  );
}
