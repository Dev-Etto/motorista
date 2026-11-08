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
| F2.2.3 | Com a jornada iniciada, o botão é verde e mostra o tempo. Pausada, é amarelo, com o tempo parado e o ícone de pausa | Jest |
| F2.2.4 | Com jornada, tocar no botão abre o Início, onde ficam pausar, retomar e encerrar | Jest |
| F2.2.5 | O tempo é abreviado: `<1min`, `45min`, `2h`, `2h14` e `12h30`, e passa para `24h+` depois de 24 h. Com 5 caracteres ou mais, a fonte diminui | Jest |
| F2.2.6 | O leitor de tela lê o estado e o tempo por extenso, como "Jornada em andamento, 2 horas e 14 minutos" | Jest |

### F2.3 Relatórios dentro de Jornadas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F2.3.1 | Jornadas tem duas visões, Lista e Resumo. Resumo é o antigo Relatórios, com período, gráfico, plataformas e exportação | Jest |
| F2.3.2 | Os atalhos que abriam Relatórios abrem Jornadas no Resumo | Jest |

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

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F3.3.1 | O topo do cartão mostra a bandeira do app maior e a nota com a escala, como `3,0/5`. O rótulo do veredito sai do topo, porque a cor já diz se a corrida é boa, média ou ruim | Kotlin, Manual |
| F3.3.2 | O veredito continua na descrição lida pelo leitor de tela | Kotlin |

## Fase 4. Primeiro uso

### F4.1 Boas-vindas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F4.1.1 | A logo aparece grande e centralizada, com espaço até o título | Jest |
| F4.1.2 | Título e subtítulo ficam juntos, perto do botão "Começar" | Manual |

### F4.2 Passos

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| F4.2.1 | Cada passo mostra o progresso no topo e "Pular" no canto | Jest |
| F4.2.2 | O cadastro do veículo oferece gasolina, etanol, diesel, GNV e elétrico. No elétrico, preço e consumo usam kWh | Jest |
