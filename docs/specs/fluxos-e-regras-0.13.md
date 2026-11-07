# Spec: fluxos e regras 0.13.0

Revisão de regras de negócio, navegação, telas e acessibilidade, em fases. Cada fase é entregue num PR próprio, com os critérios abaixo e os testes que os confirmam.

- **Jest:** `src/**/__tests__`.
- **Kotlin:** `modules/copilot/android/src/test`.
- **Manual:** o que só o aparelho confirma.

## Fase 1. Regras que dão número errado

Hoje a jornada não sabe com qual veículo começou. Trocar o veículo no meio da jornada muda o custo do Copiloto na hora, e a jornada inteira é salva com o custo do veículo novo. Além disso, o backup é marcado como feito mesmo quando o compartilhamento é cancelado, a meta some na virada do mês e o combustível escolhido no cadastro não muda os valores sugeridos.

### Conceitos

| Conceito | O que é |
| --- | --- |
| Veículo da jornada | O veículo atual no momento em que a jornada foi iniciada. Fica em `shift_vehicle` enquanto o cronômetro estiver iniciado |
| Veículo em uso | O veículo da jornada, se houver jornada iniciada. Senão, o veículo atual |
| Meta vigente | A meta do mês ou, sem ela, a meta mais recente de um mês anterior |

### F1.1 Veículo da jornada

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F1.1.1 | Com o cronômetro iniciado e sem `shift_vehicle`, a primeira consulta ao veículo em uso grava o veículo atual como veículo da jornada. Isso cobre o início pelo app e pelo botão flutuante | Jest |
| F1.1.2 | Com o cronômetro parado, a consulta apaga `shift_vehicle` e devolve o veículo atual | Jest |
| F1.1.3 | O Copiloto e a calculadora usam o custo do veículo em uso | Jest |
| F1.1.4 | "Usar agora" com jornada iniciada noutro veículo pede confirmação: a jornada continua com o veículo dela, e o novo vale a partir da próxima. Confirmar troca o atual sem mudar o custo do Copiloto | Jest, Manual |
| F1.1.5 | O formulário de encerramento abre com o veículo da jornada marcado | Jest |
| F1.1.6 | Salvar a jornada com a medição ou descartar a medição apaga `shift_vehicle`, e o Copiloto volta ao custo do veículo atual | Jest |
| F1.1.7 | O veículo de uma jornada iniciada não pode ser arquivado. A tela explica o motivo | Jest |

### F1.2 Sugestão de custo por combustível

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F1.2.1 | `suggestedProfile(kind, ownership, fuel)` sugere preço e consumo do combustível escolhido, conforme a tabela abaixo | Jest |
| F1.2.2 | Num veículo novo, trocar o combustível troca só o preço e o consumo sugeridos. Os outros campos ficam como estão | Jest |
| F1.2.3 | Num veículo já salvo, trocar o combustível não mexe nos valores | Jest |

| Combustível | Preço | Carro | Moto |
| --- | --- | --- | --- |
| Gasolina | R$ 6,00/L | 11 km/L | 30 km/L |
| Etanol | R$ 4,20/L | 8 km/L | 21 km/L |
| Diesel | R$ 6,20/L | 13 km/L | 30 km/L |
| GNV | R$ 4,80/m³ | 13 km/m³ | 30 km/m³ |
| Elétrico | R$ 0,95/kWh | 6,5 km/kWh | 25 km/kWh |

### F1.3 Backup confirmado

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F1.3.1 | Depois de compartilhar o backup, o app pergunta se o arquivo foi salvo. Só "Salvei" grava `last_backup_at` e mostra "Backup salvo" | Jest |
| F1.3.2 | "Não salvei" não grava a data e mostra como tentar de novo | Jest |

### F1.4 Meta contínua

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F1.4.1 | `goalRepository.findInEffect(month)` devolve a meta do mês ou, sem ela, a mais recente de um mês anterior | Jest |
| F1.4.2 | Progresso, plano, Início e mínimos pela meta usam a meta vigente. A virada do mês não desliga "Calcular pela minha meta" | Jest |
| F1.4.3 | A tela da Meta avisa "Repetindo a meta de outubro" quando a meta vem de outro mês. Salvar grava a meta no mês atual | Jest, Manual |

### F1.5 Tela da Meta

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F1.5.1 | Cada erro aparece embaixo do próprio campo: lucro desejado, horas por dia, dias de trabalho e meta de hoje | Jest |
| F1.5.2 | "Concluir" salva quando o lucro desejado está preenchido e volta só se salvar. Sem lucro preenchido, só volta | Jest |

## Fase 2. Navegação

O Copiloto, principal diferencial do app, fica dentro de Mais, e a calculadora ocupa uma aba. Iniciar, pausar e encerrar a jornada passa por um formulário longo.

### F2.1 Abas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F2.1.1 | As abas são Início, Jornadas, Ofertas, Relatórios e Mais | Jest |
| F2.1.2 | A barra de abas é própria: cada aba tem papel `tab`, estado selecionado e altura mínima de 48. O indicador da aba ativa tem 64x32, e a barra tem uma linha fina no topo | Jest, Manual |
| F2.1.3 | A aba Ofertas mostra um contador das ofertas lidas desde a última visita, até "9+". O leitor de tela diz "3 ofertas novas". Abrir a aba zera o contador | Jest |

### F2.2 Aba Ofertas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F2.2.1 | Sem a acessibilidade concedida, o topo explica o Copiloto e leva à configuração guiada. Com ela, mostra o interruptor de leitura e o atalho para os ajustes | Jest |
| F2.2.2 | Mostra as 5 ofertas mais recentes e "Ver todas as ofertas". Sem ofertas, explica onde elas aparecem | Jest |
| F2.2.3 | Mostra o resumo dos mínimos por corrida | Manual |
| F2.2.4 | Ferramentas: "Avaliar uma oferta" e "Orçamento de corrida particular" abrem a calculadora no modo certo | Jest |

### F2.3 Barra da jornada

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F2.3.1 | Com a jornada iniciada, uma barra acima das abas mostra o estado, o tempo e os km medidos | Jest |
| F2.3.2 | A barra pausa e retoma a jornada, junto com o GPS, sem abrir o formulário | Jest |
| F2.3.3 | "Encerrar" abre o encerramento, e tocar no resto da barra abre a medição | Jest |
| F2.3.4 | Sem jornada iniciada, a barra não aparece | Jest |

### F2.4 Mais

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F2.4.1 | Mais deixa de ter "Ofertas", que virou aba. Os ajustes do Copiloto continuam em Mais | Jest |
| F2.4.2 | A calculadora vira uma tela do stack, com título, aberta pela aba Ofertas | Manual |

## Fase 3. Início e Jornadas

O Início repete o cronômetro que agora está na barra da jornada. Para começar o dia, o motorista entra num formulário. Sem dados, mostra zeros em verde e dois cards iguais para semana e mês. Em Jornadas, tocar num lançamento avulso abre a exclusão, e a jornada esquecida não tem saída guiada.

### F3.1 Início

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F3.1.1 | Sem jornada iniciada, a ação principal é "Iniciar jornada": liga o cronômetro e, se a medição por GPS estiver ligada, o GPS, sem abrir o formulário. "Registrar jornada passada" abre o formulário | Jest |
| F3.1.2 | Com jornada iniciada, o Início e Jornadas não repetem o cronômetro. O andamento fica na barra da jornada | Jest |
| F3.1.3 | Lucro zero aparece em tom neutro, não em verde | Jest |
| F3.1.4 | Semana e mês ficam num card só, com lucro, faturamento e tempo de cada período | Manual |
| F3.1.5 | Sem acessibilidade concedida, o próximo passo depois do veículo é "Configurar o Copiloto", que leva à configuração guiada | Jest |

### F3.2 Jornadas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F3.2.1 | Um botão "Adicionar" oferece Jornada, Abastecimento e Outra despesa | Jest |
| F3.2.2 | Tocar num lançamento avulso abre a edição dele. Excluir fica na edição, com confirmação | Jest |
| F3.2.3 | Com um dia selecionado no calendário, os lançamentos avulsos também são filtrados | Jest |

### F3.3 Encerramento

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F3.3.1 | Com a jornada aberta há 14 h ou mais, a barra da jornada avisa, e o card de medição pergunta "Que horas você parou?", com a hora sugerida pelo início mais as horas por dia da meta, ou 8 h. "Usar no registro" usa as horas até esse horário e pede para conferir os km | Jest |
| F3.3.2 | A notificação de jornada esquecida abre o encerramento da jornada | Manual |
| F3.3.3 | Salvar uma jornada nova abre o detalhe dela | Jest |
