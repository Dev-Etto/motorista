import { AppText, Card, Screen } from '@/shared/ui/primitives';

const SECTIONS = [
  { title: 'Seus dados', body: 'Tudo fica no seu celular. O app não tem conta, servidor nem permissão de internet.' },
  { title: 'Permissões', body: 'Localização, notificações, sobreposição de tela e acessibilidade são opcionais e só são usadas nas funções que você ligar.' },
  { title: 'Copiloto', body: 'Lê apenas valor, distância e tempo das ofertas. Guarda só esses números e o resultado, sem nome de passageiro, endereço, conversas ou imagens. Não toca na tela.' },
  { title: 'Backup', body: 'Só sai do aparelho quando você compartilha o arquivo. Ele contém dados financeiros e não é criptografado.' },
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
