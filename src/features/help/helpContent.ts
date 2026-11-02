export const HELP_SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: 'Como calculamos seu custo por km',
    paragraphs: [
      'Somamos combustível, óleo, pneus e manutenção por km, e dividimos os custos fixos do mês pelos km que você prevê rodar.',
      'Quanto mais valores reais você informar em Veículo e custos, mais preciso fica o resultado.',
    ],
  },
  {
    title: 'Como calculamos seu lucro',
    paragraphs: [
      'Lucro é o faturamento menos o custo do veículo pelos km rodados e as despesas da jornada, como pedágio e alimentação.',
      'Abastecimentos e manutenção não saem do lucro de novo, porque já estão no custo por km. Eles servem para comparar o previsto com o pago.',
    ],
  },
  {
    title: 'Como entender a nota da oferta',
    paragraphs: [
      'A nota vai de 0 a 10 e compara a oferta com seu custo e suas metas de R$/km e R$/hora.',
      '▲ 7 ou mais, em verde: atinge as duas metas. Quanto mais acima delas, maior a nota.',
      '■ De 4 a 6,9, em amarelo: cobre seu custo, mas fica abaixo de alguma meta.',
      '▼ Até 3,9, em vermelho: não cobre seu custo por km.',
      'No cartão, ▲ ao lado do valor por km ou por hora indica que ele atingiu a sua meta, e ▼ indica que ficou abaixo.',
      '★ é a avaliação do passageiro, quando o app de corrida a mostra. Ela não entra na nota.',
      'Sem custos cadastrados, a oferta aparece sem nota. A decisão é sempre sua.',
    ],
  },
  {
    title: 'Como registrar uma jornada',
    paragraphs: [
      'Toque em Nova jornada com o carro parado. Informe ganhos, km e horas, e use o cronômetro ou o GPS se preferir.',
      'Sem km, o resultado fica parcial até você completar.',
    ],
  },
  {
    title: 'Como configurar o Copiloto',
    paragraphs: [
      'Em Mais, abra Copiloto de ofertas e use a configuração guiada. Depois, toque em Testar.',
      'Dirigindo, a voz avisa por você. Toque no celular só com o carro parado.',
    ],
  },
  {
    title: 'Se o Copiloto não aparecer',
    paragraphs: [
      'Confira se a acessibilidade continua ativa. Alguns aparelhos pausam serviços para economizar bateria: nesse caso, retire o app da otimização de bateria.',
      'Se alguma oferta não for reconhecida, a Calibração mostra o que o Copiloto está lendo, com as palavras mascaradas.',
    ],
  },
  {
    title: 'O ícone na lateral da tela',
    paragraphs: [
      'É o atalho de acessibilidade do Android, e o Copiloto funciona sem ele. Ele só aparece se a opção de atalho estiver ligada.',
      'Para remover, arraste o ícone até Remover. Ou abra Configurações do Android, Acessibilidade, Copiloto de ofertas, e desligue o atalho.',
    ],
  },
  {
    title: 'Mover o cartão',
    paragraphs: ['Com o carro parado, arraste o cartão para onde preferir. A posição fica guardada, e você pode voltar ao topo na tela do Copiloto.'],
  },
  {
    title: 'Backup e troca de celular',
    paragraphs: [
      'Seus dados ficam só no celular. Faça backups de vez em quando e guarde o arquivo fora dele, como no Drive.',
      'No aparelho novo, instale o app, abra Backup e use Restaurar.',
    ],
  },
  {
    title: 'Como instalar uma atualização',
    paragraphs: [
      'Em Mais, toque em Verificar atualização, baixe a nova versão e instale por cima da atual. Seus dados continuam no app.',
      'Faça um backup antes, por segurança.',
    ],
  },
];
