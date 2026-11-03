import { AppText, Card, Screen } from '@/shared/ui/primitives';

const SECTIONS = [
  { title: 'Seus dados', body: 'Tudo fica no seu celular. O app não tem conta, servidor nem permissão de internet.' },
  { title: 'Permissões', body: 'Localização, notificações, sobreposição de tela e acessibilidade são opcionais e só são usadas nas funções que você ligar.' },
  { title: 'Copiloto', body: 'Lê valor, distância, tempo e avaliação das ofertas. Guarda só os números e o resultado, sem a avaliação, nomes, endereços, conversas ou imagens. Não toca na tela. A notificação da oferta não aparece na tela de bloqueio.' },
  { title: 'Backup', body: 'Só sai do aparelho quando você compartilha o arquivo. Ele traz seus dados financeiros e não tem senha, então guarde em um lugar só seu.' },
  { title: 'Estimativas', body: 'Os resultados são estimativas feitas com os dados que você informa. Não são aconselhamento financeiro nem fiscal.' },
];

export default function PrivacyScreen() {
  return (
    <Screen>
      {SECTIONS.map((section) => (
        <Card key={section.title} title={section.title}>
          <AppText>{section.body}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
