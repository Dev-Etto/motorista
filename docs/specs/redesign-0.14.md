# Spec: redesign 0.14.0

Nova marca, barra de navegação flutuante e padronização das telas, a partir do estudo de design aprovado. Cada fase é entregue num PR próprio, com os critérios abaixo e os testes que os confirmam.

- **Jest:** `src/**/__tests__`.
- **Kotlin:** `modules/copilot/android/src/test`.
- **Manual:** o que só o aparelho confirma.

## Fase 1. Marca e componentes base

A logo atual é um M com tracejado de estrada. A nova, "m de rota", é um m minúsculo de traço único e cantos arredondados, com o ponto de destino no alto. O estado vazio deixa o ícone encostado à esquerda, e a bandeira do app muda de largura conforme o nome.

### F1.1 Logo

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F1.1.1 | `assets/brand` guarda o símbolo em SVG: ícone, frente e fundo do ícone adaptativo, monocromático e splash | Manual |
| F1.1.2 | O ícone do app, o ícone adaptativo com a versão monocromática, o splash e o favicon usam o novo símbolo. O símbolo do adaptativo fica dentro da área segura de 66% | Manual |
| F1.1.3 | O ícone da notificação usa a versão pequena do símbolo, com traço mais grosso e sem o recorte do meio | Manual |

### F1.2 Bandeira do app

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F1.2.1 | `PlatformBadge` tem tamanho fixo de 78x32, com o nome centralizado em 15 px. Uber, 99 e inDrive ficam com a mesma largura em todas as telas | Jest |
| F1.2.2 | Um nome que não cabe diminui até caber, sem cortar | Jest |

### F1.3 Estado vazio

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F1.3.1 | `EmptyState` centraliza o ícone, a ilustração, o título e a mensagem | Jest |

## Fase 2. Barra flutuante

A barra tem cinco abas presas à borda, e Relatórios repete o que Jornadas já mostra. A jornada em andamento só aparece no Início e na notificação.

### F2.1 Abas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F2.1.1 | As abas são Início, Jornadas, Ofertas e Mais, numa cápsula solta da borda, acima da área de gestos | Jest |
| F2.1.2 | A aba ativa mostra ícone e nome numa pílula. As outras mostram só o ícone, com o nome lido pelo leitor de tela. Cada aba tem papel `tab`, estado selecionado e 48 de toque | Jest |
| F2.1.3 | O contador de ofertas novas continua na aba Ofertas | Jest |
| F2.1.4 | O conteúdo das abas termina acima da barra, sem ficar escondido atrás dela | Manual |

### F2.2 Botão da jornada

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F2.2.1 | Ao lado da cápsula, um botão redondo mostra o estado da jornada. Sem jornada, é preto com o ícone de iniciar | Jest |
| F2.2.2 | Sem jornada, tocar no botão inicia a jornada, como "Iniciar jornada" no Início | Jest |
| F2.2.3 | Com a jornada iniciada, o botão é verde e mostra o tempo. Pausada, é amarelo, com o tempo parado e sem ícone | Jest |
| F2.2.4 | Com jornada, tocar no botão abre a folha da jornada, com pausar, retomar, encerrar e o aviso de jornada esquecida. O Início não tem card da jornada | Jest |
| F2.2.5 | O tempo é abreviado: sempre com a letra da unidade: na primeira hora em minutos e segundos, como `0M:08` e `45M:12`; depois em horas e minutos, como `1H:22` e `12H:30`, e passa para `24H+` depois de 24 h. Com 6 caracteres ou mais, a fonte diminui | Jest |
| F2.2.6 | O leitor de tela lê o estado e o tempo por extenso, como "Jornada em andamento, 2 horas e 14 minutos" | Jest |

### F2.3 Relatórios dentro de Jornadas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F2.3.1 | Jornadas tem duas visões, Lista e Resumo. Resumo é o antigo Relatórios, com período, gráfico, plataformas e exportação | Jest |
| F2.3.2 | A rota da aba Relatórios sai do app. O Resumo mostra cada plataforma só pela bandeira, com o nome lido pelo leitor de tela | Jest |

## Fase 3. Listas

A lista de jornadas mostra o lucro do dia solto ao lado do título. Nas ofertas, o status aceita ou não aceita é um texto a mais em cada linha.

### F3.1 Jornadas por dia

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F3.1.1 | A lista agrupa as jornadas por dia, do mais recente ao mais antigo, num card por dia | Jest |
| F3.1.2 | O topo do card mostra o dia, quantas jornadas e os km, e o lucro do dia com o rótulo "Lucro do dia" | Jest |
| F3.1.3 | Cada jornada mostra o horário ou a duração, o faturamento e o lucro dela | Jest |

### F3.2 Linha de oferta

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F3.2.1 | A bandeira do app fica à esquerda, o valor e os detalhes no meio e a nota à direita | Jest |
| F3.2.2 | O status vira um selo no canto de cima da bandeira, sem cobrir o nome: check verde para aceita, X cinza para não aceita e setas para contraproposta. Sem resposta não tem selo | Jest |
| F3.2.3 | O leitor de tela continua lendo o status por extenso | Jest |

### F3.3 Cartão do Copiloto

O cartão nativo já segue o design aprovado: o topo tem só a bandeira do app, em 84x36 para leitura rápida sobre o app de corrida, e a nota com a escala. O rótulo do veredito aparecia apenas na prancha de estudo. Esta fase não muda o cartão.

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F3.3.1 | O topo do cartão mostra a bandeira do app e a nota com a escala, como `3,0/5`, sem rótulo de veredito | Manual |

## Fase 4. Primeiro uso

### F4.1 Boas-vindas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F4.1.1 | A logo aparece grande e centralizada, com espaço até o título | Jest |
| F4.1.2 | Título e subtítulo ficam juntos, perto do botão "Começar" | Manual |

### F4.2 Passos

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F4.2.1 | Cada passo mostra o progresso no topo e "Pular" no canto. Pular a introdução leva ao veículo, pular o veículo conclui, pular o resultado leva às permissões e pular as permissões leva ao fim | Jest |
| F4.2.2 | O cadastro rápido do veículo oferece gasolina, etanol, GNV e elétrico. No elétrico, o consumo usa kWh | Jest |

## Fase 5. Mais e encerramento

Mais tem cinco grupos e mistura ajustes do dia a dia com termos e versão. O formulário de nova jornada é uma página longa, com tempo, ganhos, despesas e resultado juntos.

### F5.1 Mais

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F5.1.1 | Mais tem três grupos: Trabalho (veículos, meta, plataformas e Copiloto), App (aparência, idioma, lembretes, backup e permissões) e Ajuda e sobre | Jest |
| F5.1.2 | A tela Sobre reúne a logo e a versão, Meu resumo, Relatar um problema, Privacidade, Termos, Apoiar o projeto, atualização e código | Jest |
| F5.1.3 | Cada item aponta para uma rota existente | Jest |

### F5.2 Nova jornada em etapas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F5.2.1 | A nova jornada tem três etapas: Tempo e km, Ganhos, e Despesas e resultado, com o progresso e os botões Voltar e Continuar | Jest |
| F5.2.2 | Continuar valida a etapa atual. O erro de um campo dela segura o avanço e aparece no campo. Erros de outras etapas não seguram | Jest |
| F5.2.3 | Salvar com erro volta para a etapa do erro | Jest |
| F5.2.4 | Editar uma jornada salva continua numa tela só | Jest |

## Fase 6. Telas no novo design

As fases anteriores trouxeram a marca, a barra e os componentes, mas várias telas ainda tinham o layout antigo. Esta fase leva cada tela ao design aprovado.

### F6.1 Barra e jornada

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F6.1.1 | Ofertas usa o ícone de velocímetro, e Mais o de pessoa | Manual |
| F6.1.2 | Com jornada, o botão da barra abre uma gaveta com desde quando, o cronômetro, os km medidos, Pausar ou Retomar, Encerrar, Lançar abastecimento, Lançar outra despesa e Medir km por GPS | Jest |

### F6.2 Início

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F6.2.1 | O topo mostra o dia por extenso e o veículo atual, que leva a Veículos | Jest |
| F6.2.2 | "Sobrou hoje" mostra o lucro, a meta do dia ("62% da meta de hoje · faltam R$ 113,60") e Faturou, Por km e Por hora | Jest |
| F6.2.3 | Pendências e a última oferta do dia, com "há 4 min" e "Ver ofertas" | Jest |
| F6.2.4 | Semana, mês, dica e o card "por que o lucro é menor" saem do Início. Ficam no Resumo e na Ajuda | Manual |

### F6.3 Ofertas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F6.3.1 | O topo diz se o Copiloto está lendo ou pausado e leva aos ajustes | Jest |
| F6.3.2 | Lidas hoje, Aceitas e Estimado em três números | Jest |
| F6.3.3 | As ofertas de hoje, com "Todas as ofertas", e os atalhos Avaliar oferta e Orçamento | Jest |
| F6.3.4 | Cada oferta mostra a hora em que chegou | Manual |

### F6.4 Jornadas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F6.4.1 | A lista tem uma faixa com os 7 dias da semana, com um ponto verde ou vermelho nos dias trabalhados, e setas para a semana anterior e a próxima | Jest |
| F6.4.2 | Os lançamentos avulsos ficam no card do dia deles. Os que já estão no custo por km avisam isso e não descontam do lucro do dia | Jest |
| F6.4.3 | O Resumo mostra "Sobrou no mês" com o número de jornadas e o gráfico no mesmo card, a fatia de cada plataforma e "Mês fechado e exportar" recolhido | Jest |
| F6.4.4 | O detalhe mostra o que sobrou com horário e veículo, tempo, distância e por hora, "A conta" com os descontos e "Por plataforma" | Jest |
| F6.4.5 | As etapas do encerramento são perguntas ("Quanto você ganhou?"), com "Etapa 1 de 3" e o total faturado | Jest |
| F6.4.6 | O lançamento pede o valor primeiro. Data e veículo ficam numa linha recolhida, como "Hoje · Meu carro" | Jest |

### F6.5 Mais

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F6.5.1 | Aparência é uma tela com três quadros de prévia em grupo de rádios | Jest |
| F6.5.2 | Lembretes lista primeiro os pendentes, com "Atrasado" ou "Em breve" (até 1.000 km ou 7 dias). Novo lembrete fica recolhido | Jest |
| F6.5.3 | Backup mostra "Dados protegidos" ou "Faça um backup" no topo, com a data do último | Jest |
| F6.5.4 | Ajuda começa com uma corrida de exemplo calculada com o custo do veículo atual | Jest |
| F6.5.5 | O veículo mostra "Cada km custa" com a barra de combustível, desgaste e fixos | Jest |
| F6.5.6 | A Meta mostra o progresso primeiro e a edição recolhida. Sem meta, o formulário fica aberto | Manual |

### F6.6 Ofertas e Copiloto

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F6.6.1 | Avaliar oferta e Orçamento particular são telas separadas, cada uma com o próprio título e sem seletor de abas | Jest |
| F6.6.2 | O orçamento pede "Para quem ou para onde", Até buscar, Viagem e Tempo numa linha e "Contar a volta vazia". Pedágio, extras e valor mínimo ficam recolhidos | Jest |
| F6.6.3 | O preço aparece em "Cobre", num card escuro, com os km cobertos e o valor por hora. Os botões são Salvar e Enviar ao cliente, e "Salvos (n)" no topo mostra os salvos | Jest |
| F6.6.4 | Os ajustes do Copiloto mostram Ler ofertas com o estado da permissão, Ler pela imagem da tela, "Como avisar", "Cartão" com o resumo da aparência e Testar o cartão agora, Apps lidos e "Leitura não funcionou?" | Jest |
| F6.6.5 | A configuração do Copiloto tem a barra "Passo 1 de 2", "Deixe o Copiloto ler a tela", os passos numerados, o aviso de configuração restrita e Abrir configurações e Fazer depois no rodapé | Jest |
| F6.6.6 | O cartão da oferta tem no topo uma faixa na cor da nota, com o selo da plataforma e a nota escrita. Abaixo, o valor, a distância e o tempo, e Por km, Por hora e Sobra | Manual |
| F6.6.7 | O botão flutuante mostra o tempo abreviado como o botão da jornada (`45M:12`, `1H:22`, `24H+`) e um ponto verde com a jornada rodando ou amarelo com ela pausada | Kotlin e manual |
| F6.6.8 | Ao ser solto, o botão flutuante encosta na borda mais próxima, arredondado só do lado de dentro, com o ponto de status no próprio logo | Kotlin e manual |

### F6.7 Mais

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F6.7.1 | Plataformas tem "Apps de corrida", com o selo de cada app e "Ganhos e ofertas", e "Seus ganhos fora dos apps", com Particular e Outros | Jest |
| F6.7.2 | Idioma e região começa com uma prévia escura de Dinheiro, Data, Distância e Consumo. Idioma, Formato e País ficam numa lista, e Unidades tem Distância, Combustível e Semana começa | Jest |
| F6.7.3 | Permissões lista Ler a tela, Sobrepor apps, Localização, Notificações e Sem economia de bateria, cada uma com "Ativa" ou o botão para ligar. Sem notificações, um aviso explica o que se perde | Jest |
| F6.7.4 | Sobre mostra a logo, o nome e a versão, depois Meu resumo para compartilhar, Relatar um problema e Apoiar o projeto, depois Privacidade e Termos de uso, e fecha com "Seus dados ficam só no seu celular." | Jest |
