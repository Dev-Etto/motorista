import { InfoScreen, InfoSection } from './InfoScreen';

const SECTIONS: InfoSection[] = [
  {
    title: 'Seus dados',
    body: 'Tudo fica no seu celular. O app não tem conta, servidor nem permissão de internet. Os links do projeto abrem no seu navegador.',
  },
  {
    title: 'Permissões',
    body: 'Localização, notificações, sobreposição de tela e acessibilidade são opcionais e só são usadas nas funções que você ligar. Se você ligar a leitura da imagem da tela no Copiloto, o app pode usá-la na Uber e na 99 para achar a oferta. A imagem é lida no celular e descartada na hora, sem ser salva ou enviada.',
  },
  {
    title: 'Copiloto',
    body: 'Lê valor, distância, tempo e avaliação das ofertas. Guarda só os números, o resultado e se você tocou em aceitar ou recusar, sem a avaliação, nomes, endereços, conversas ou imagens. Não toca na tela. As ofertas ficam guardadas por até 12 meses, e a estimativa de faturamento pode ser desligada em Ofertas e faturamento. A notificação da oferta não aparece na tela de bloqueio.',
  },
  {
    title: 'Backup',
    body: 'Só sai do aparelho quando você compartilha o arquivo. Ele traz seus dados financeiros e não tem senha, então guarde em um lugar só seu.',
  },
  { title: 'Estimativas', body: 'Os resultados são estimativas feitas com os dados que você informa. Não são aconselhamento financeiro nem fiscal.' },
];

export default function PrivacyScreen() {
  return <InfoScreen sections={SECTIONS} />;
}
