# Arquitetura

Regras de código e organização do projeto. Como o código não tem comentários, as decisões ficam registradas aqui.

## Camadas

```text
src/
  app/          Rotas do Expo Router. Só reexportam telas
  features/     Telas, hooks e componentes de cada funcionalidade
  application/  Orquestração usada por mais de uma funcionalidade e a inicialização do app
  domain/       Regras de negócio puras, sem React, banco ou Expo
  data/         SQLite, migrações, repositórios e backup
  shared/       Tema, componentes, hooks, utilitários e efeitos de plataforma
  config/       Constantes do app
modules/
  copilot/      Módulo nativo em Kotlin: acessibilidade, cartão, voz e botão flutuante
```

**Sentido das dependências**

```text
app -> features -> application -> data -> domain -> shared/utils
                -> data
                -> domain
                -> shared
```

- `domain` não conhece `features`, `application`, `data` nem React.
- `shared` não conhece `features`, `application`, `data` nem `domain`.
- `shared/utils` e `domain` são funções puras. Efeitos do Expo ficam em `shared/platform`: notificações, localização, confirmação e compartilhamento.
- Um componente `.tsx` de `features` nunca importa `@data`: ele chama um hook ou serviço `.ts` da funcionalidade.
- Uma funcionalidade só importa outra pelo `index.ts` dela, que lista o que é público.
- Imports entre pastas usam o alias da camada: `@app`, `@application`, `@config`, `@data`, `@domain`, `@features`, `@shared` e `@modules`. Caminho relativo só vale na mesma pasta, como `./useReport`. `../` e o antigo `@/` são recusados.
- Essas regras são conferidas pelo `npm run lint`, em `eslint.config.js`.

## Princípios

| Princípio | Como aparece no projeto |
|---|---|
| Responsabilidade única | Um repositório por tabela principal, uma regra de insight por função, tela sem regra de negócio |
| Aberto/fechado | Um novo insight é uma nova regra na lista de `buildInsights`, sem alterar as outras |
| Substituição de Liskov | Todas as regras seguem o contrato `InsightRule`; campos especializados delegam a `TextField` |
| Segregação de interfaces | Hooks devolvem só o que a tela usa; componentes recebem props pequenas |
| Inversão de dependência | `domain` define os tipos de entrada e recebe dados prontos, sem acessar o banco |

## Padrões usados

| Padrão | Onde |
|---|---|
| Repository | `src/data/repositories` |
| Strategy | Regras em `src/domain/insights/rules.ts` e canais `OfferChannel` do Copiloto |
| Custom Hooks | `useAsyncData`, `useFormFields`, `useInterval`, `useMonthCursor` e hooks de cada funcionalidade |
| Facade | `modules/copilot/index.ts` esconde o módulo nativo |
| Composition | Telas montadas com componentes de `shared/ui` |
| Memento | Cópia do custo por km salva em cada jornada |

## Regras de código

- Sem comentários no código.
- Early return no lugar de `if` aninhado.
- Sem lógica repetida: o que aparecer em duas funcionalidades vai para `domain` ou `shared`.
- Números com significado viram constantes nomeadas.
- Telas usam componentes de `shared/ui`, nunca estilos de texto ou botão próprios.
- Componente de tela não acessa o banco diretamente, salvo pelo hook da funcionalidade.
- Dinheiro é guardado em centavos. Taxas por km podem ter fração de centavo. Contas, leitura e formatação de reais passam pela classe `Money`.
- Datas são guardadas como `AAAA-MM-DD`. Contas e formatação de datas ficam em `shared/utils/dates.ts`, sobre o Luxon.
- Antes de concluir uma tarefa: `npm run typecheck`, `npm test` e `npm run lint`. `npm run format` aplica o Prettier.
- O lint confere sem `any`, sem `else`, sem `if` dentro de `if`, profundidade máxima de 2 blocos, ordem dos imports e formatação.

## Decisões

**Migrações imutáveis.** Uma migração já distribuída nunca é alterada. Mudanças de banco entram como um novo item em `MIGRATIONS`, em `connection.ts`.

**Combustível e manutenção não saem do lucro.** Eles já estão no custo por km. Descontar de novo contaria duas vezes, então os lançamentos desses tipos servem para comparar o previsto com o pago.

**Cópia do custo na jornada.** Cada jornada guarda o custo por km do dia, então mudar o preço do combustível não altera o passado.

**SQL direto, sem ORM.** O esquema é pequeno, e `expo-sqlite` com repositórios evita uma dependência a mais.

**Regras duplicadas de oferta e da nota.** O Copiloto precisa calcular em Kotlin porque roda com o app em segundo plano, e a calculadora manual usa TypeScript. Os dois lados são testados com `modules/copilot/fixtures/offers.json`, para continuarem iguais.

**Preço por km não é valor da corrida.** Plataformas mostram `R$ 2,3/km` antes do valor. `OfferParser` ignora valores seguidos de `/km`, `/h` ou `por km`. Quando a tela traz esse preço, o km total é o valor dividido por ele, porque a distância escrita pode ser só o trecho até o passageiro.

**Tempo da corrida pode faltar.** `2 min.` com ponto indica há quanto tempo o pedido foi feito, não a duração, e por isso é ignorado. Sem tempo na oferta, `minutes` é 0: a nota usa só o R$/km, e o R$/h fica vazio. Nunca estimamos o tempo.

**Sem tempo, nota até 4.** Sem a duração não dá para saber se a corrida compensa por hora, então a nota não passa de 4.

**Selo de nota.** A nota de 0 a 5 aparece sempre no mesmo selo, com a cor da faixa e o número escrito, para a faixa não depender só da cor. Cartão e notificação têm fundo neutro, e o selo é o único ponto de cor. O selo é desenhado em `ScoreBadge`, em TypeScript e em Kotlin, com as mesmas proporções e cores. O histórico mudou de chave ao trocar a escala, para não misturar notas de 0 a 10.

**Leitura de todas as janelas do app monitorado.** Uma oferta pode abrir em outra janela ou em views marcadas como não importantes. Por isso o serviço usa `flagRetrieveInteractiveWindows` e `flagIncludeNotImportantViews`, e `monitoredRoots` descarta as janelas de qualquer outro app. Só o texto visível é lido.

**Mock de ofertas só em debug.** `OfferMockReceiver` só é registrado quando o app é depurável, porque recebe comandos de fora do app. `scripts/mock-oferta.sh` envia o texto para o mesmo caminho da leitura real, mas não passa pela captura da tela das plataformas.

**Dados de exemplo só pelo SQLite do app.** `devSeed` roda em `__DEV__`, na conexão do próprio app. O banco nunca deve ser aberto pelo SQLite do Android no mesmo processo: duas cópias da biblioteca corrompem o arquivo.

**Cronômetro no lado nativo.** O botão flutuante e o app precisam ver o mesmo estado, mesmo com o app fechado. Por isso o estado fica em `ShiftTimer`, no Kotlin.

**Internet só no build de desenvolvimento.** O Metro exige `INTERNET`. Com `APP_VARIANT=release`, a permissão é removida em `app.config.ts`.

**Copiloto só leitura.** O serviço declara `canPerformGestures=false`. O cartão recebe toques só para ser arrastado e usa `FLAG_NOT_TOUCH_MODAL`, para os toques fora dele chegarem ao app embaixo. Qualquer automação de toque, aceite ou recusa está fora do produto.

**Regra `set-state-in-effect` desligada.** Ela acusa carregamentos assíncronos que só alteram o estado depois de um `await`, o que é falso positivo neste projeto.

**Sessão da oferta sem Android.** `OfferSession` recebe canais, relógio de tarefas e preferências por parâmetro, para ser testada sem aparelho.

**Chamadas de interface na thread principal.** Funções do módulo que mexem em janelas usam `Handler(Looper.getMainLooper())`, porque o JavaScript roda em outra thread.

**Só tabelas novas são opcionais no backup.** Um arquivo sem as tabelas originais é recusado, para uma restauração nunca apagar dados por um arquivo incompleto.

**A avaliação do passageiro não entra na nota.** A nota mede o valor da oferta para o motorista, e a avaliação é só uma informação da plataforma.

**Identidade visual em SVG.** Os ícones e as ilustrações em linha são componentes em `shared/ui/illustrations`, e os ícones do app são gerados das fontes em `assets/brand`. Nada depende de internet.

**Selos no lugar de logos.** Logos de plataformas são marcas de terceiros. Os selos ficam em `PlatformBadge` e `OfferSources`, para a troca ser simples se houver autorização.

## Decisões da versão 0.6.0

- **Oferta dentro do botão flutuante:** `OfferAccessibilityService.activeChannels` usa o botão como canal quando ele está visível e o cartão avulso nos demais casos, evitando duas janelas para a mesma oferta.
- **Medição protegida:** `useLiveTracking.apply` copia os valores e mantém a medição; só `discard` zera. O formulário bloqueia salvar com medição pendente.
- **Mínimos derivados da meta do mês:** `suggestOfferTargets` é função pura de domínio.
- **Lembrete por km:** `due_km` guarda o total acumulado de km das jornadas em que o aviso vence, sem depender de odômetro informado.
- **Layout da notificação:** a cor vem de `RemoteViews` no layout próprio, porque `setColor` sozinho não colore o corpo no Android atual.

## Decisões da versão 0.7.0

- **Uma jornada por vez:** existe um único cronômetro, salvo em `ShiftTimer`. `useShiftTimer` consulta esse estado a cada segundo, então o app reconhece uma jornada iniciada pelo botão flutuante.
- **Km em pausa:** `gpsTask` ignora os pontos recebidos com o cronômetro pausado e descarta o último ponto, evitando somar o trecho percorrido durante a pausa.
- **Distribuição:** os APKs são publicados nas Releases do GitHub. `motorista.apk` é o de 64 bits, com nome fixo para manter um link estável sem aumentar o histórico do git, e `motorista-32bits.apk` atende aparelhos antigos. Separar por arquitetura reduz o download, porque o ML Kit traz bibliotecas nativas.
- **Assinatura:** `scripts/release-apk.sh` assina o APK com uma chave mantida fora do repositório. Toda versão precisa usar a mesma chave para instalar por cima da anterior.

## Decisões da versão 0.7.1

- **Meta e mínimos na mesma tela:** "meta" é o objetivo do mês e "mínimo" é o valor exigido por corrida. Os valores são editados só em `GoalScreen`; Copiloto e Calculadora mostram um resumo.
- **Acompanhar a meta:** com `followGoal` ligado, `withGoalTargets` calcula os mínimos do modo normal ao carregar as configurações. Assim, eles não ficam desatualizados quando a meta muda. Sem meta ou veículo, valem os valores salvos.

## Decisões da versão 0.8.0

- **Identidade monocromática:** a interface usa branco, cinza e preto, e a cor fica reservada aos dados, como lucro, estados e nota da oferta. Os valores estão em `palette`, com contraste testado.
- **Fonte embutida:** a Manrope vai dentro do APK pelo plugin `expo-font`, porque o app não usa internet. O código nativo a carrega em `AppFonts`.
- **Separação sem borda:** cards se destacam pelo fundo e por uma sombra leve no tema claro. Avisos usam ícone e fundo neutro.
- **Progresso em trechos:** `ProgressBar` desenha 12 trechos, como uma faixa de estrada.

## Decisões da versão 0.8.1

- **Painel do botão flutuante:** `FloatingPanel` desenha o botão fechado e o painel aberto, e `FloatingTimerService` cuida da janela, do cronômetro e das ofertas.
- **Mesma regra de oferta:** o botão flutuante usa as preferências do cartão como estão, sem forçar o formato resumido.
- **Tempo do cartão:** o padrão é de 8 segundos, e um valor já salvo pelo usuário é mantido.

## Meta do mês

- **A meta mede lucro:** `computeGoalProgress` usa o mesmo lucro de "Neste mês" no início, com despesas avulsas, para as duas telas nunca discordarem. Faturar muito rodando muito não bate a meta.
- **Meta do dia estável:** divide o que faltava no começo do dia pelos dias restantes, para o número não encolher enquanto o motorista lucra.
- **Plano separado:** `requiredGrossForGoal` é uma previsão com os km informados e continua alimentando os mínimos por corrida, que precisam existir antes de rodar.
- **Diferença para o Mês fechado:** o lucro da meta dilui o custo fixo pelos km previstos, e o Mês fechado desconta o fixo inteiro. A tela explica isso em "Como essa conta funciona?".
- **Ajuste do dia:** `goal_day_overrides` agora guarda lucro, não faturamento. Só o valor do próprio dia é usado, então ajustes antigos não afetam nada.

## Faturamento estimado

- **Estimativa, nunca registro:** `estimateEarnings` soma as ofertas aceitas por plataforma, mas só `ShiftEstimateCard` leva o valor para a jornada, e só quando o motorista pede. Aceitar não garante que a corrida terminou nem quanto foi pago.
- **Registro no lado nativo:** o serviço roda com o app fechado e não pode abrir o SQLite do app. Por isso, as ofertas ficam em `offer_log.db`, um arquivo separado, com consulta por período e guardadas por 12 meses. Cada arquivo tem uma só biblioteca SQLite.
- **Sem correção por oferta:** o app registra sozinho, e o motorista corrige o valor na jornada. Marcar oferta por oferta criaria duas fontes para o mesmo número.
- **Filtros que crescem:** `FilterChips` quebra a linha conforme a largura e o tamanho da letra. `Segmented` divide a largura e serve só para poucas opções fixas. As opções de app vêm das ofertas do período. Para um app novo, basta incluir o pacote em `copilot_accessibility_service.xml` e em `OfferSources`, além de `DEFAULT_PACKAGES`.
- **Aceite pelo toque:** `typeViewClicked` só observa; o Copiloto continua sem gestos. `OfferOutcomeReader` lê o texto do elemento tocado, e um toque ambíguo não registra nada. O aceite é definitivo dentro da oferta.
- **Contraoferta:** o toque em um valor exato fica registrado como contraoferta, fora da soma, porque o passageiro ainda precisa concordar.

## Revisão de leitura e dados

- **Só conta como oferta o botão de aceitar:** `isAcceptAction` exige o rótulo do botão, sozinho. "Confirmar" saiu da lista, porque aparece em "Confirmar chegada" e "Confirmar pagamento" e criava ofertas e aceites falsos.
- **O valor vem do botão:** `Aceitar por R$ X` tem prioridade. Sem ele, vale o primeiro valor na faixa que não seja bônus, ganhos ou saldo.
- **Textos repetidos:** `joinParts` remove repetidos antes de ler, porque um mesmo texto pode vir como rótulo e como descrição e dobraria km e tempo. Dois trechos iguais contam como um; preferimos esse erro raro ao outro, mais comum.
- **Android 8 ou mais novo:** `minSdkVersion` 26, porque canais de notificação e sobreposição do módulo exigem essa versão.
- **Validar antes de salvar:** número preenchido e inválido bloqueia a jornada, em vez de virar zero. Consumo e km previstos são obrigatórios, porque zerá-los infla o lucro.
- **Custo da jornada no mês fechado:** `useReport` soma `km * variable_per_km` de cada jornada, respeitando a cópia do custo. Jornadas antigas sem essa cópia usam o custo atual.

## Decisões da versão 0.8.2

- **Permissões conferidas no release:** `scripts/verificar-permissoes.sh` para o script de release se o APK pedir uma permissão fora da lista, como `INTERNET`.
- **Relato sem conta:** `ReportScreen` monta o texto e usa o menu de compartilhar do Android, sem internet no app. O motorista vê o que será enviado antes.
- **Aviso de versão antiga:** `extra.buildDate` guarda a data do build, e o início sugere verificar a atualização depois de 30 dias, sem consultar nada na internet.
- **Restauração completa:** `applyRestoredState` volta os ajustes do Copiloto, as metas, o tema e reagenda as notificações. Uma falha nessa etapa não vira "restauração falhou", porque os dados já foram trocados. A cópia de segurança pode ser restaurada em Backup.
- **Jornada esquecida no lado nativo:** `ForgottenShiftAlarm` agenda o aviso em `ShiftTimer`, porque a jornada também começa pelo botão flutuante, com o app fechado. Usa alarme inexato, que não exige permissão nova.
- **Leituras de oferta preservadas:** `OfferDiagnostics` guarda em separado as telas com valor, para as outras não as apagarem antes de serem enviadas.

## Leitura de ofertas

- **Ritmo da leitura:** `ScanPacer` usa intervalo fixo em vez de debounce, porque telas com contador geram eventos sem parar e adiariam a leitura para sempre. Mudança de janela e notificação abrem uma rajada de 8 segundos, que para ao achar a oferta.
- **Fora da thread principal:** a coleta e o parse rodam em `HandlerThread`. Texto igual ao da leitura anterior não passa pelo parser. A sessão e as janelas seguem na thread principal.
- **Todos os pacotes no XML:** o filtro `packageNames` descartaria mudanças de janela, que podem vir sem pacote. O filtro fica em `onAccessibilityEvent`, e só a Uber, a 99 e o inDrive são lidos.
- **Cartão da Uber sem botão:** produto e duas pernas de rota já contam como oferta. Só o trecho até o passageiro é leitura incompleta, para não mostrar um R$/km inflado.
- **Texto da tela:** `ScreenText` ordena por posição e só une repetições quando um texto está dentro do outro, então dois trechos iguais em pontos diferentes continuam contando. Na Uber, os 15% de cima são ignorados, por causa dos ganhos do dia, e não mais que isso, porque o cartão pode ser alto.
- **Imagem como reforço opcional:** com `imageReading` ligado, na Uber e na 99, sem oferta no texto, `OfferImageReader` lê a imagem da tela com ML Kit embutido, no máximo uma vez por segundo. `OfferReadPolicy` decide quando: nunca em viagem nem com o cartão aberto, para não ler o próprio cartão. Por isso, oferta lida por imagem fecha pelo tempo do cartão, não por leitura vazia.
- **Sem internet:** o ML Kit traz `INTERNET` e `ACCESS_NETWORK_STATE`, bloqueadas no release por `blockedPermissions`. O modelo é embutido e funciona sem rede.
- **Botão flutuante:** o cronômetro aparece sempre, mesmo zerado. `FloatingPanel` só refaz o visual quando o estado muda, e `WindowDrag` usa a tolerância de toque do Android.
- **Decisões separadas do Android:** `OfferReadPolicy`, `OfferTextTracker`, `WindowEventGate` e `ScanPacer` não dependem do Android e têm teste. `OfferTreeReader` e `OfferImageReader` só coletam. A spec fica em `docs/specs/leitura-de-ofertas.md`.
- **Gravar fora da thread principal:** a oferta é gravada na thread de leitura. Como é uma fila única, gravação e atualização mantêm a ordem.
- **Botão flutuante ligado por padrão:** `floatingButton` nasce ligado, e `useFloatingVisibility` inicia o botão ao abrir o app ou voltar a ele, se houver permissão de sobreposição. Desligar nas configurações fica salvo. "Ocultar o botão", ou arrastar o botão até a `DismissZone`, é temporário: `FloatingVisibility` esconde até o motorista entrar no app e sair dele, com o serviço ativo e as ofertas no cartão avulso. Sem a permissão, o app não insiste: ela segue sendo pedida só quando o motorista liga a opção.
- **Selo da plataforma:** nome e cor, em tamanho fixo, para Uber, 99 e inDrive ficarem na mesma proporção. Nenhuma imagem de marca entra no repositório.
- **Nota do passageiro:** não aparece no cartão, no botão nem na notificação. O parser só a reconhece com estrela ou contagem de avaliações.
- **Idade do pedido não é tempo de viagem:** no inDrive, `N min.` com ponto e `Agora mesmo` dizem há quanto tempo o pedido existe, e `~N km` é a distância até o passageiro. Sem os dois trechos, "Por hora" fica vazio, sem estimativa.
- **Cartão no botão flutuante:** o cartão cresce a partir do botão e encolhe de volta. `OfferCardMotion` calcula o ponto de partida e não depende do Android. Um toque em qualquer ponto, ou arrastar até a `DismissZone`, fecha o cartão e a voz, via `OfferSession.dismiss`. A sessão guarda a oferta, para ela não reabrir enquanto seguir na tela.

## Decisões da versão 0.10.0

- **Transação em conexão própria:** `runInTransaction` abre uma conexão nova, liga `foreign_keys` antes do `BEGIN` e a fecha no fim. O `expo-sqlite` já usava conexão nova em `withExclusiveTransactionAsync`, mas sem a verificação de chave estrangeira, porque esse pragma vale por conexão e é ignorado dentro de uma transação.
- **Migrações sem verificação de chave:** é o procedimento do SQLite para alterar tabelas. A migração confere `foreign_key_check` antes de concluir.
- **Restauração atômica:** a restauração confere as chaves e marca o onboarding na mesma transação.
- **Harness igual à produção:** os testes usam um arquivo temporário e abrem conexão nova por transação, para pegar diferenças de pragma.
- **Formulário preenchido uma vez:** `useFormHydration` preenche os campos com o dado carregado só na primeira vez de cada chave. `useAsyncData` recarrega no foco, e isso não pode apagar o que o motorista digitou.
- **Schemas no domínio:** os formatos que entram por JSON ficam em zod, junto do tipo que descrevem, como `costProfileSchema`, `workWeekdaysSchema`, `gpsPointSchema` e `offerTargetsSchema`. O zod é a única dependência externa permitida em `domain`, porque não tem efeito colateral.
- **Validar na fronteira:** o backup valida cada tabela e cada coluna JSON. Os repositórios leem JSON por `parseJsonColumn`, e os ajustes por `getJson` com schema ou por `getEnum`, que devolvem o padrão quando o valor é inválido. A ponte com o Kotlin valida em `modules/copilot/schemas.ts`.
- **Histórico tolerante:** uma oferta inválida no histórico é descartada sem esconder as outras, porque o histórico é informativo e pode vir de versões antigas.
- **Números de formulário não negativos:** os helpers de `shared/utils/parse` recusam negativos. `parseBRL` e `parseDecimal` continuam aceitando sinal, porque também leem valores calculados.
- **Toda escrita por botão usa `useSubmit`:** ele bloqueia o segundo toque e mostra o erro. Ele aceita argumentos, para ações como escolher um horário.
- **Mínimos salvos ao sair do campo:** salvar a cada tecla enviava valores parciais, como `2,`, ao Copiloto.
- **Concorrência no Kotlin:** `OfferDiagnostics` usa a mesma trava no setter e na captura, e `ShiftTimer` faz ler-modificar-gravar sob uma trava única, porque é chamado do JavaScript e do botão flutuante.
- **Carregar uma vez:** `useAsyncData` carrega no foco, que já acontece ao montar, e só recarrega por `deps` quando eles mudam. Ao mudar de período, o dado antigo some até o novo chegar.
- **Estado do carregamento na tela:** `AsyncBoundary` mostra carregando, erro com "Tentar de novo" ou o conteúdo. Uma falha nunca aparece como lista vazia. O erro vai para `reportError`.
- **Histórico de ofertas assíncrono:** `getHistory`, `getOffers`, `getRecentOffers` e `setHistory` são `AsyncFunction`, porque leem SQLite e o histórico pode ter um ano de ofertas.
- **Ciclo da sessão de GPS:** o `gpsTask` grava com `WHERE cycle = ? AND running = 1`. Descartar incrementa o ciclo e pausar desliga `running`, então um lote atrasado não volta com metros antigos. Iniciar e pausar não regravam os metros.
- **Valores ao editar:** horas aparecem como `H:MM` e decimais por `decimalToInput`, sem resíduo de ponto flutuante.
- **Regras de tela no domínio:** `kmFromEntry` e `validateShiftForm` ficam em `domain/shift/shiftForm`, o custo do mês fechado e o gráfico em `domain/report`, e o lembrete por km em `domain/reminder`. A validação devolve um código, e a tela traduz o código em texto, para o domínio não ter texto de interface.
- **Uma conta de lucro:** as regras de insight usam `computeShift` e `totalsByPlatform`, as mesmas funções da jornada e do relatório.
- **Janela das últimas 4 semanas:** 28 dias até hoje, inclusive.
- **Sem custo, sem lucro:** sem custo por km, a oferta é neutra e `profitCents` é nulo nos dois lados. As fixtures conferem `perKm`, `perHour` e `profitCents`.
- **Camada `application`:** progresso da meta, ajustes de oferta, insights, próximo passo e inicialização. Antes eles ficavam dentro de uma funcionalidade e criavam ciclos, como `goals -> copilot -> goals`.
- **API pública por `index.ts`:** componentes que dependem de tipos do domínio não podem ir para `shared/ui`, então ficam na funcionalidade dona e são expostos pelo `index.ts` dela.
- **Repositórios por fábrica:** `createXRepository(connection = getDb)` devolve o repositório, e o módulo exporta uma instância padrão. `createShiftRepository` também recebe o repositório de veículo. `SqlExecutor` serve tanto para a conexão quanto para a transação.
- **Canais do Copiloto testáveis:** `OfferChannels` escolhe os canais sem Android, e o botão flutuante é acessado pela interface `FloatingHost`.
- **Botão flutuante dividido:** `FloatingTimerService` cuida do ciclo de vida, do menu e do cronômetro. `FloatingWindow` cuida da janela, `PillPositionStore` da posição salva, `FloatingCardPresenter` do cartão e da animação, e `ForegroundNotification` da notificação do serviço.
- **Limites da tela em um lugar:** `ScreenBounds` é uma função pura, usada pelo cartão avulso e pelo botão. `Context.dp` substitui as cópias de `dp()`.
- **Texto do Kotlin em `strings.xml`:** a exceção são `OfferEvaluator` e `OfferFormat`, que rodam nos testes sem Android.
- **Cores dos overlays:** `OverlayColors`, em `CardTheme.kt`, guarda as cores repetidas no botão, na área de soltar e no cartão.
- **Nós de acessibilidade reciclados:** abaixo do Android 13, os nós e janelas obtidos na leitura são reciclados. A raiz recebida de fora continua com quem a passou.
- **Foco de áudio sem ramo antigo:** com `minSdk` 26, `AudioFocusRequest` sempre existe.
- **TypeScript estrito:** `noUncheckedIndexedAccess`, `noImplicitReturns` e `noFallthroughCasesInSwitch` ligados. Acesso por índice é tratado com valor padrão ou early return, sem `!`.
- **Sem cast:** o único `as` fora de `as const` são os genéricos de `getAllAsync<Row>`, que tipam o SQL na fronteira do repositório.
- **Linhas do banco em camelCase:** os repositórios devolvem objetos como `Reminder`, `SavedQuote` e `ShiftRecord`, com booleanos de verdade. O formato da tabela não sai de `data`.
- **Constantes de tempo:** `shared/utils/time.ts` concentra `MS_PER_DAY`, `MINUTES_PER_HOUR`, `MONTHS_PER_YEAR` e as demais.
- **Hooks do Copiloto separados:** `useCopilotStatus`, `useCopilotPreferences`, `useCopilotTests` e `useCopilotDiagnostics`. `useCopilot` só os compõe, e cada cartão recebe a parte que usa.
- **Formulário da jornada:** os campos de texto ficam em `useFormFields`, e a jornada salva é preenchida por `useFormHydration`, sem efeito colateral dentro do loader.
- **Dinheiro com `currency.js`:** `Money` é imutável e faz as contas com seis casas, para não perder a fração de centavo da taxa por km. Ela arredonda para centavos só ao formatar. `formatBRL`, `parseBRL`, `centsToInput` e `centsOrNull` são atalhos para `Money`.
- **Centavos no contrato:** os tipos do domínio, o banco, o backup, as fixtures e a ponte com o Kotlin continuam em centavos inteiros. Trocar isso por `Money` mudaria o formato salvo e o contrato com o Kotlin.
- **Datas com Luxon:** `DateTime` faz soma de dias e meses, início de semana e fim de mês no fuso do aparelho, inclusive na troca de horário de verão. `fromISODate` saiu: quem precisa do dia da semana usa `weekdayOf`, quem precisa de intervalo usa `daysBetween`, e o seletor nativo recebe `toJsDate`.
- **Bibliotecas puras no domínio:** além do zod, `luxon` e `currency.js` podem ser usados em `domain` e `shared/utils`, porque não têm efeito colateral nem dependem de internet.


## Decisões da versão 0.11.0

- **Perfil regional:** idioma, formato regional, moeda e unidades são independentes e ficam em `RegionalProfile`, em `domain/regional`. `resolveRegionalProfile` é pura: a escolha salva vence o aparelho, campo a campo. O ciclo de hora sempre vem do aparelho.
- **Uma fonte de verdade:** `regionalStore`, em `application/regional`, carrega as escolhas, lê o aparelho por `shared/platform/locale` e aplica o perfil. As telas usam `useRegional`. O aparelho é relido quando o app volta ao primeiro plano.
- **Instalações antigas fixadas:** a migração 5 grava `pt-BR`, `BRL`, `km`, `L`, `km/L` e semana na segunda só onde já houve onboarding, para quem usa o app não ver diferença. Instalação nova segue o aparelho.
- **Dia da semana ISO:** `firstWeekday` usa 1 para segunda e 7 para domingo, como o Luxon. O `expo-localization` usa 1 para domingo, e a conversão fica em `resolveRegionalProfile`.
- **Traduções com `i18next`:** `shared/i18n` cria uma instância própria, com `pt-BR` como origem e reserva. As chaves são tipadas pelo JSON do `pt-BR`, então chave inexistente não compila. O Jest inicia o i18n em `jest.setup.ts`.
- **Domínio sem texto:** insights devolvem uma união discriminada por `id` com números e códigos, `classifyOffer` devolve `OfferReason`, e `buildChart` devolve datas. O texto é montado na funcionalidade por `describeInsight`, `describeOfferReason` e os formatadores. Uma regra de lint recusa frases em `domain`, e `domain` e `shared/utils` não importam traduções.
- **Plataformas padrão traduzidas no banco:** `platforms.system_key` marca `Particular` e `Outros`. Ao aplicar o idioma, `localizeSystemNames` grava a tradução no próprio nome, então toda tela, relatório e backup já leem o nome certo. `UPDATE OR IGNORE` preserva um nome igual que o usuário tenha criado.
- **Formatação em duas camadas:** `shared/utils` tem funções puras que recebem locale, moeda e unidade (`Money`, `numbers`, `parse`, `dates`, `units`). `shared/i18n/format` cria o formatador do perfil ativo, com dinheiro, números, distância, volume, consumo, datas e semana. Telas usam `useFormat()`, que redesenha quando o perfil muda. Código fora do React, como exportação e mensagens, recebe o formatador por parâmetro.
- **Canônico no banco, unidade na borda:** distância em km, volume em litros, consumo em km por litro e preço em centésimos por km ou por litro. O formatador converte ao mostrar e ao ler o campo. Combustíveis líquidos usam a unidade de volume e de consumo. GNV e elétrico só convertem a distância.
- **Agrupamento de milhar pela região:** os números usam a regra de cada locale, então `es-ES` mostra `1234,5` e `pt-BR` mostra `1.234,5`. Espaços especiais do `Intl` viram espaço comum, para o texto ficar igual ao do Kotlin.
- **Sem valor fixo de região:** o lint recusa `R$`, `pt-BR`, `BRL`, `toFixed` e `toLocaleString` fora de `shared/i18n`, `shared/utils`, `domain/regional` e das migrações. Os textos de exemplo do teste do Copiloto ficam em real porque imitam a tela das plataformas no Brasil.
- **Textos por namespace:** cada funcionalidade tem seu JSON em `shared/i18n/locales/pt-BR`, e `common` guarda ações, rotas, abas e `shared/ui`. Constantes com rótulo guardam só o valor, e o componente monta o rótulo com `t`. Funções que montam frase recebem `t` e `format`, como `describeGoalDay`, `describeFormError` e `helpSections`. Frases que mudam com a unidade usam contexto `_km`/`_mi` ou `_L`/`_gal`. O lint recusa texto fixo em `.tsx` pela regra `i18next/no-literal-string`.
- **Erros como código na fronteira:** `parseBackup` devolve `BackupProblem`, e `validateProfile` devolve `ProfileProblem`. A tela traduz.
- **Imports por camada:** `@app`, `@application`, `@config`, `@data`, `@domain`, `@features`, `@shared` e `@modules`, no `tsconfig.json` e no Jest. O Metro lê os mesmos `paths`.
- **Perfil no Kotlin:** `RegionalSettings` vai dentro de `CopilotPreferences` e chega por `copilot.setRegional`, chamado em toda aplicação do perfil. `setPreferences` sem `regional` mantém o perfil atual, porque o schema do JS não conhece o campo.
- **`OfferFormat` como classe:** recebe o perfil e um `OfferTexts`. No Android, `OfferFormat.of(context, regional)` usa os recursos de um `Context` com o idioma do perfil, então o serviço fala e escreve no idioma do app mesmo fechado. Nos testes, `XmlOfferTexts` lê o próprio `strings.xml`, e os testes conferem o texto real do recurso.
- **Motivo da nota estruturado nos dois lados:** `OfferReason` no TypeScript e no Kotlin. O histórico guarda o texto já montado no idioma do momento, porque é um registro do que foi mostrado.
- **Nome da moeda na voz:** real, dólar, euro e peso têm singular e plural nos recursos. Outra moeda, ou moeda sem centavos, é falada pelo valor formatado.
- **Agrupamento diferente entre Java e Intl:** o `NumberFormat` do Java agrupa milhar em `es-ES` a partir de 4 dígitos, e o `Intl` não. A diferença é só visual e fica registrada nos testes.
- **Idioma por app no Android 13+:** `AppLanguage` usa o `LocaleManager`. Escolher na tela grava no sistema, e `regionalStore` adota a escolha feita nas configurações do sistema ao voltar ao primeiro plano. `allowDynamicLocaleChangesAndroid` evita recriar a tela na troca.
- **Troca de moeda sem câmbio:** trocar a moeda ou restaurar um backup com outra moeda pede confirmação quando há dados, porque os números ficam iguais. `backupCurrency` diz a moeda de um backup, e backup de antes do perfil regional é tratado como real.
- **Backup antigo:** `LEGACY_REGIONAL_SQL` e `SYSTEM_PLATFORMS_SQL` são as mesmas instruções da migração, repetidas na restauração de um backup de versão anterior.
- **CSV pela região:** o separador de colunas é `;` quando o decimal é vírgula e `,` nos demais casos. Distância e custo saem na unidade do usuário, e o cabeçalho diz a moeda e a unidade.
- **Pseudo-idioma em desenvolvimento:** `pseudo` acentua e alonga os textos do português, preservando interpolação e tags. Aparece só em `__DEV__`, na tela Idioma e região.
- **Diálogo próprio:** confirmações e escolhas usam `showDialog` e `confirmAction`, de `shared/ui/dialog`, desenhados por `DialogHost`, montado uma vez na raiz com as cores, o raio e os botões do app. Fundo escurecido e botão voltar fecham o diálogo. Duas ações ficam lado a lado, e três ou mais ficam empilhadas. Erro dentro da ação é registrado e não derruba o app. O lint recusa importar `Alert` do `react-native`.
- **Traduções registradas:** `pt-BR`, `en` e `es` em `resources.ts`. O teste do catálogo confere chaves, parâmetros e plurais, e `StringResourcesTest` confere os nomes e especificadores dos `strings.xml` do Kotlin.
- **País no lugar de moeda:** o que vem das plataformas segue o país, e o que é só exibição segue o motorista. `market` define a moeda (`MARKET_CURRENCY`) e as regras do leitor. Só entram países com leitor pronto, e por isso hoje a lista tem só o Brasil. Idioma, formato de data e número e unidade de exibição continuam livres, porque o banco guarda sempre em km, litros e centésimos. `isSameMarket` compara países sem que o TypeScript estreite o tipo enquanto existe um único país.
- **Leitor recusa outro mercado:** `OfferParser` não avalia texto com `$`, `US$`, `€`, `£` ou distância em milhas. As fixtures guardam esses casos.

## Decisões da versão 0.12.0

- **Máscara nos campos:** `shared/utils/inputMask.ts` reúne funções puras usadas pelos campos de `shared/ui/fields.tsx`. `MoneyField` e `NumberField` aceitam só dígitos e um separador decimal, agrupam milhares e tratam ponto ou vírgula digitados no fim como decimal, porque o teclado decimal do Android muda de aparelho para aparelho. `MoneyField` completa as casas da moeda ao sair do campo. `IntegerField` aceita só dígitos, e `DurationField` monta `HH:MM`.
- **Dinheiro agrupado na edição:** `Money.toInput` agrupa milhares, igual ao que a máscara mostra. `parseDecimal` já lê o valor agrupado.
- **Datas sem digitação:** todas as datas usam `DateField`, que abre o seletor do sistema. A validação fica nos limites: o período de ofertas não deixa o início passar do fim, e despesas e jornadas não aceitam data futura.
- **Plataformas em catálogo:** a pessoa não cria plataforma pelo nome, porque o Copiloto só lê os apps que conhece. `CATALOG_PLATFORMS_SQL` marca Uber, 99, inDrive, Particular e Outros com `system_key`, e a tela só liga e desliga. Plataformas criadas antes continuam ativas numa seção própria até serem desligadas, e o histórico mantém o nome.
- **Uma fonte para os apps lidos:** os pacotes lidos pelo Copiloto saem das plataformas ativas, em `application/platforms.ts`. A sincronização roda ao ligar ou desligar uma plataforma e na abertura do app. A lista "Apps monitorados" do Copiloto só mostra o resultado e leva à tela Plataformas.
- **Veículo atual e veículo da jornada:** o atual fica na configuração `current_vehicle` e define o custo de hoje para o Copiloto, a calculadora, a meta e o Início. `getCurrent` cai no último veículo não arquivado quando a configuração falta, então uma instalação com um veículo não muda. A jornada guarda o veículo escolhido no formulário, e trocar o veículo ou a data na edição copia o custo de novo.
- **Arquivar no lugar de excluir:** um veículo sai de uso com `active = 0`. As jornadas continuam ligadas a ele, e o único veículo não pode ser arquivado.
- **Lembrete por veículo:** `reminders.vehicle_id` liga o lembrete por km ao veículo atual na criação, e `kmTotals` soma o km por veículo. Lembrete antigo, sem veículo, conta todas as jornadas, como antes.
- **Escolhas regionais em telas próprias:** Idioma e Formato regional abrem `region-language` e `region-format`, com nomes fixos em `common:formatLocaleName` no próprio idioma de cada formato, como faz o Android. A prévia do topo vem de `buildRegionPreview`.
- **Pendências do Início:** lembretes, backup e atualização viram linhas de um card só, montadas por `pendingItems`.
- **Erro no campo:** `fieldOfError` liga cada erro da jornada ao campo que precisa de correção. Só o que não tem campo próprio, como a falta de ganhos, fica no aviso geral. `Collapsible` com `forceOpen` abre a seção que tem um campo com erro.
- **Rádios acessíveis:** opções de `Segmented` e linhas de `ListRow` com `selected` usam o papel `radio` com o estado `checked`, e cada opção tem a altura mínima de toque.
- **Perfil regional só depois de carregar:** `regionalStore.refresh` não faz nada antes de `load`. Na primeira abertura, o app pode voltar ao primeiro plano antes de a migração criar as tabelas, e aplicar o perfil nesse momento renomearia plataformas que ainda não existem.
- **Tempo estimado na oferta:** algumas telas de oferta mostram só preço e distância. `TripTimeEstimator` estima o tempo pela velocidade mediana das últimas 200 ofertas com tempo lido, guardada em `CopilotStore.tripSpeedKmh`, e marca `minutesEstimated`. A avaliação usa o tempo estimado como qualquer outro, e só a exibição muda, com `~`. Assim as regras de oferta continuam iguais às do TypeScript.

## Decisões da versão 0.13.0

Spec: `docs/specs/fluxos-e-regras-0.13.md`.

- **Veículo da jornada:** o cronômetro é nativo e pode ser iniciado pelo botão flutuante, então o veículo da jornada não é gravado no início, e sim na primeira consulta com o cronômetro iniciado (`application/vehicleInUse.ts`). Copiloto, calculadora e o encerramento usam o veículo em uso. Trocar o atual no meio da jornada só vale para a próxima.
- **Backup confirmado:** o compartilhamento do Android não diz se o arquivo foi salvo, então o app pergunta. Só a resposta "Salvei" grava `last_backup_at`.
- **Meta vigente:** `goalRepository.findInEffect` usa a meta mais recente até o mês pedido, sem copiar linhas. Salvar na tela da Meta grava o mês atual.
- **Barra de abas própria:** `features/navigation/AppTabBar` substitui a barra padrão para ter o contador de ofertas novas e o indicador de 64x32. As abas ficam em `features/navigation/tabs.ts`. A aba Ofertas se chama `offer-hub` porque `/offers` já é o histórico.
- **Jornada em andamento na notificação:** `ShiftNotification` mostra uma notificação fixa com cronômetro, Pausar ou Retomar e Encerrar enquanto o cronômetro estiver iniciado. `ShiftTimer` a atualiza em cada mudança, então ela vale também para o botão flutuante. Pausar pela notificação para o cronômetro, e o `gpsTask` já ignora pontos com o cronômetro parado.
- **Iniciar sem formulário:** o Início liga a medição direto por `ShiftControls`, que vira o card da jornada em andamento, com pausar e encerrar. O formulário serve para encerrar ou registrar uma jornada passada.
- **Jornada esquecida:** com 14 h ou mais, o encerramento não aplica a medição sozinho. O card pergunta a hora de parada, sugerida pelas horas por dia da meta, e `nextClockTime` acha essa hora depois do início, mesmo no dia seguinte. A notificação abre `motorista://shift/new?finish=1`.
- **Acessibilidade nos componentes base:** `Notice` negativo e de alerta é região viva, o erro do campo vira dica do leitor de tela, títulos de `Card`, `EmptyState`, `Collapsible` e diálogo são `header`, e `ListRow` sem ação é lido como um item. O token `borderStrong` (3:1 contra `surface`) contorna campos, datas e o interruptor desligado. O diálogo se anuncia com `announceForAccessibility`, porque o papel `alert` num container não é lido no Android.
- **Botão flutuante acessível:** `WindowDrag` chama `performClick` no toque sem arraste, então o leitor de tela também abre e fecha o painel. A descrição e o estado do botão são atualizados a cada render.
- **Mês fechado com vários veículos:** `proratedFixedMonthly` divide o custo fixo de cada veículo pelos dias com jornada dele no mês. A Meta continua planejando com o veículo atual, porque olha para frente, e avisa isso quando há mais de um veículo.
- **Despesa com veículo:** `expenses.vehicle_id` liga o lançamento ao veículo. Um abastecimento com litros calcula o preço pago por litro e oferece gravar um perfil de custo novo a partir de hoje, só para gasolina, etanol e diesel, porque GNV e elétrico não usam litro.
- **Alterações não salvas:** `useUnsavedChangesGuard` usa `usePreventRemove` do expo-router. O formulário da jornada só fica "alterado" pelo que a pessoa digita, e não pela hidratação, pela medição aplicada ou pelo odômetro sugerido. Salvar chama a liberação antes de navegar.
- **Correção da oferta:** `copilot.setOfferStatus` grava o resultado pelo `timestamp`, a chave do registro, com o mesmo `markOutcome` usado no toque.
- **Lembrete que se repete:** `reminders.repeat_km` guarda o intervalo de um lembrete por km, para oferecer o próximo ao concluir.

## Decisões da versão 0.14.0

Spec: `docs/specs/redesign-0.14.md`.

- **Marca "m de rota":** o símbolo é um m minúsculo de traço único com o ponto de destino. Os SVGs de `assets/brand` são a fonte, e os PNGs de `assets` são gerados a partir deles. O ícone da notificação usa a versão pequena, sem o recorte do meio e com traço mais grosso, para continuar legível em 24 dp.
- **Bandeira de tamanho fixo:** `PlatformBadge` mede sempre 78x32, então as bandeiras alinham em colunas em qualquer lista. Um nome que não cabe diminui a fonte, em vez de alargar a bandeira.
