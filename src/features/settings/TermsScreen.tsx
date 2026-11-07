import { AppText } from '@/shared/ui/primitives';
import { InfoScreen, InfoSection } from './InfoScreen';

const SECTIONS: InfoSection[] = [
  { title: 'O que é o app', body: 'O Motorista ajuda você a entender custos, lucro e ofertas. É gratuito, não pede conta e funciona sem internet.' },
  {
    title: 'Estimativas',
    body: 'Os resultados são estimativas feitas com os dados que você informa e com o que o app consegue ler na tela. Eles podem ter erros, não garantem ganhos e não são aconselhamento financeiro, fiscal ou jurídico.',
  },
  { title: 'Suas decisões', body: 'O app só informa. Ele não aceita nem recusa corridas, e toda decisão é sua.' },
  { title: 'No trânsito', body: 'Configure e consulte o app só com o carro parado. Dirigindo, use a voz. Você é responsável por cumprir as leis de trânsito.' },
  {
    title: 'Plataformas',
    body: 'O Motorista é independente e não tem vínculo com Uber, 99, inDrive ou outras plataformas. Cada uma tem regras próprias sobre apps de apoio, e cabe a você conhecê-las antes de usar o Copiloto. As plataformas podem identificar apps que usam acessibilidade ou sobreposição, e o uso pode ter consequências na sua conta.',
  },
  {
    title: 'Seus dados',
    body: 'Seus dados ficam no seu celular, sem cópia em nossos servidores. Se você perder o aparelho ou desinstalar o app, eles se perdem. Por isso, faça backups e guarde o arquivo em um lugar só seu.',
  },
  {
    title: 'Sem garantia',
    body: 'O app é oferecido como está, sem garantia de funcionamento contínuo ou de compatibilidade com as plataformas. Na medida permitida pela lei, os responsáveis pelo projeto não respondem por perdas decorrentes do uso.',
  },
  {
    title: 'Licença',
    body: 'Você pode usar o app no seu trabalho de motorista. É proibido vender o app ou versões derivadas, cobrar por ele ou exibir anúncios nele. O texto completo está no arquivo LICENSE do repositório do projeto.',
  },
  {
    title: 'Mudanças',
    body: 'Estes termos podem mudar em novas versões do app. Dúvidas e problemas podem ser enviados pela opção Relatar um problema, em Mais.',
  },
];

export default function TermsScreen() {
  return (
    <InfoScreen
      sections={SECTIONS}
      footer={
        <AppText variant="caption" tone="muted" center>
          Atualizados em 5 de novembro de 2026.
        </AppText>
      }
    />
  );
}
