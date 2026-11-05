import Constants from 'expo-constants';
import { Href, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { DONATION_URL, ISSUES_URL, REPOSITORY_URL } from '@/config/app';
import { Card, ListRow, Screen } from '@/shared/ui/primitives';
import { AppearanceCard } from './AppearanceCard';
import { MORE_MENU } from './moreMenu';

export default function MoreScreen() {
  const router = useRouter();

  return (
    <Screen>
      <AppearanceCard />
      <Card>
        {MORE_MENU.map((item) => (
          <ListRow key={item.title} icon={item.icon} title={item.title} subtitle={item.subtitle} onPress={() => router.push(item.href as Href)} />
        ))}
        <ListRow icon="flag" title="Relatar um problema" subtitle="Ou sugerir uma melhoria. Abre no navegador." onPress={() => Linking.openURL(ISSUES_URL)} />
        <ListRow icon="heart" title="Apoiar o projeto" subtitle="O app é gratuito. Ajude a mantê-lo." onPress={() => Linking.openURL(DONATION_URL)} />
        <ListRow
          icon="update"
          title={`Versão ${Constants.expoConfig?.version ?? ''}`}
          subtitle="Ver o código, as novidades e novas versões."
          onPress={() => Linking.openURL(REPOSITORY_URL)}
        />
      </Card>
    </Screen>
  );
}
