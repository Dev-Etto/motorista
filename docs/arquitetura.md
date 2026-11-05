# Arquitetura

Regras de código e organização do projeto. Como o código não tem comentários, as decisões ficam registradas aqui.

## Camadas

```text
src/
  app/        Rotas do Expo Router. Só reexportam telas
  features/   Telas, hooks e componentes de cada funcionalidade
  domain/     Regras de negócio puras, sem React, banco ou Expo
  data/       SQLite, migrações, repositórios e backup
  shared/     Tema, componentes, hooks e utilitários genéricos
  config/     Constantes do app
modules/
  copilot/    Módulo nativo em Kotlin: acessibilidade, cartão, voz e botão flutuante
```

**Sentido das dependências**

```text
app -> features -> data -> domain -> shared/utils
                -> domain
                -> shared
```

- `domain` não conhece `features`, `data` nem React.
- `shared` não conhece `features`, `data` nem `domain`.
- Uma tela nunca escreve SQL: ela chama um hook, e o hook chama um repositório.

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
- Dinheiro é guardado em centavos. Taxas por km podem ter fração de centavo.
- Antes de concluir uma tarefa: `npm run typecheck`, `npm test` e `npm run lint`.

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
- **Distribuição:** o APK é publicado nas Releases do GitHub, com o nome fixo `motorista.apk`, para manter um link estável sem aumentar o histórico do git.
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

## Faturamento estimado

- **Estimativa, nunca registro:** `estimateEarnings` soma as ofertas aceitas por plataforma, mas só `ShiftEstimateCard` leva o valor para a jornada, e só quando o motorista pede. Aceitar não garante que a corrida terminou nem quanto foi pago.
- **Registro no lado nativo:** o estado da oferta fica no histórico de `CopilotStore`, porque o serviço roda com o app fechado e não pode abrir o SQLite do app.
- **Aceite pelo toque:** `typeViewClicked` só observa; o Copiloto continua sem gestos. `OfferOutcomeReader` lê o texto do elemento tocado, e um toque ambíguo não registra nada. O aceite é definitivo dentro da oferta.
- **Contraoferta:** o toque em um valor exato fica como contraoferta e não entra na soma até o motorista marcar como aceita, porque o passageiro ainda precisa concordar.

## Decisões da versão 0.8.2

- **Permissões conferidas no release:** `scripts/verificar-permissoes.sh` para o script de release se o APK pedir uma permissão fora da lista, como `INTERNET`.
- **Relato sem conta:** `ReportScreen` monta o texto e usa o menu de compartilhar do Android, sem internet no app. O motorista vê o que será enviado antes.
- **Aviso de versão antiga:** `extra.buildDate` guarda a data do build, e o início sugere verificar a atualização depois de 30 dias, sem consultar nada na internet.
- **Restauração completa:** `applyRestoredState` volta os ajustes do Copiloto, as metas, o tema e reagenda as notificações. Uma falha nessa etapa não vira "restauração falhou", porque os dados já foram trocados. A cópia de segurança pode ser restaurada em Backup.
- **Jornada esquecida no lado nativo:** `ForgottenShiftAlarm` agenda o aviso em `ShiftTimer`, porque a jornada também começa pelo botão flutuante, com o app fechado. Usa alarme inexato, que não exige permissão nova.
- **Leituras de oferta preservadas:** `OfferDiagnostics` guarda em separado as telas com valor, para as outras não as apagarem antes de serem enviadas.

