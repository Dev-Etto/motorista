import { useRouter } from 'expo-router';
import { Illustration } from '@/shared/ui/illustrations/Illustration';
import { AppText, Button, Card, Notice, Screen, StepDots } from '@/shared/ui/primitives';
import { useCopilot } from './useCopilot';

export default function CopilotSetupScreen() {
  const router = useRouter();
  const copilot = useCopilot();
  const { status } = copilot;

  const activate = async () => {
    copilot.updatePreferences({ voice: true, card: true });
    await copilot.setEnabled(true);
    copilot.test();
  };

  if (!status.accessibilityGranted) {
    return (
      <Screen>
        <Illustration name="copilot" height={120} />
        <StepDots total={2} current={0} />
        <AppText variant="title" bold center>Permitir a leitura das ofertas</AppText>
        <Card>
          <AppText>O Android chama essa permissão de acessibilidade. Com ela, o app lê valor, distância, tempo e avaliação das ofertas.</AppText>
          <AppText tone="muted">Nomes, endereços e conversas não são guardados, e nada sai do seu celular.</AppText>
        </Card>
        <Button label="Abrir acessibilidade" onPress={copilot.openAccessibility} />
        <Card title="Na tela que abrir">
          <AppText>1. Procure Copiloto de ofertas, em Apps baixados ou instalados.</AppText>
          <AppText>2. Ligue a primeira opção, Usar Copiloto de ofertas.</AppText>
          <AppText>3. Confirme em Permitir e volte para cá. Esta tela avança sozinha.</AppText>
        </Card>
        <Card title="O Android vai falar em controle total">
          <AppText>Esse aviso é padrão e aparece para qualquer app com essa permissão. O Copiloto usa a leitura da tela e mostra o cartão, sem tocar em nada por você.</AppText>
          <AppText tone="muted">A opção de atalho pode ficar desligada: ela só colocaria um ícone na lateral da tela.</AppText>
        </Card>
        <Card title="A opção apareceu bloqueada?">
          <AppText>É uma proteção do Android para apps instalados fora da loja, e é rápido liberar. Nos detalhes do app, toque nos três pontos e escolha permitir configurações restritas. O caminho pode mudar um pouco conforme o aparelho.</AppText>
          <Button label="Abrir detalhes do app" variant="secondary" onPress={copilot.openAppSettings} />
        </Card>
        <Button label="Fazer isso depois" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!status.enabled) {
    return (
      <Screen>
        <Illustration name="copilot" height={120} />
        <StepDots total={2} current={1} />
        <AppText variant="title" bold center>Tudo certo para testar</AppText>
        <AppText center>Vamos ligar a voz e o cartão, os canais mais indicados, e mostrar um exemplo.</AppText>
        <Button label="Ligar e testar" onPress={activate} />
        <Button label="Fazer isso depois" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Illustration name="welcome" height={120} />
      <AppText variant="title" bold center>Copiloto ativo</AppText>
      <AppText center>A cada oferta reconhecida, você ouve e vê de onde ela vem, a nota e seus números. Se alguma não aparecer, a Calibração ajuda a ajustar.</AppText>
      <Notice tone="accent" message="Dirigindo, a voz avisa por você. Toque no celular só com o carro parado." />
      <Button label="Testar de novo" variant="secondary" onPress={copilot.test} />
      {copilot.message ? <Notice tone="accent" message={copilot.message} /> : null}
      <Button label="Concluir" onPress={() => router.back()} />
    </Screen>
  );
}
