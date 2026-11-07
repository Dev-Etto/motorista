# Spec: qualidade do código 0.10.0

Esta spec corrige os problemas encontrados na revisão do projeto: bugs, validação de dados, camadas, tipos e padronização. Cada requisito tem um critério de aceite e o teste que o confirma. O plano no fim diz em que ordem cada requisito entra.

Tipos de teste:

- **Jest:** `src/**/__tests__`.
- **Kotlin:** `modules/copilot/android/src/test`, com `./gradlew :copilot:testDebugUnitTest`.
- **Fixtures:** `modules/copilot/fixtures/offers.json`, lidas pelo Kotlin e pelo Jest.
- **Lint:** regra do ESLint que falha o `npm run lint`.
- **Typecheck:** `npm run typecheck`.
- **Revisão:** o que só a leitura do código confirma.
- **Manual:** o que só o aparelho confirma.

## Princípios

- **Teste antes da correção.** Todo bug ganha primeiro um teste que falha. A correção entra depois, no mesmo PR.
- **Sem mudança de comportamento no refactor.** As fases de arquitetura só movem código. Os testes existentes passam sem alteração, exceto imports.
- **Validar na fronteira.** Dado que entra pelo backup, pelas configurações salvas ou pelo módulo nativo passa por um schema antes de chegar ao domínio.
- **Regra escrita vira regra verificada.** O que `docs/arquitetura.md` exige e dá para checar automaticamente vira regra de lint ou de typecheck.
- **Migrações imutáveis continuam valendo.** Nenhuma correção altera uma migração já distribuída.

## R1. Integridade do banco

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R1.1 | Toda transação roda pelo helper `runInTransaction` de `connection.ts`, em conexão própria e com `foreign_keys = ON`. Nenhum código chama `withExclusiveTransactionAsync` direto. A exceção são as migrações, que rodam com a verificação desligada, como o SQLite recomenda, e conferem `foreign_key_check` antes de concluir | Jest, Revisão |
| R1.2 | O harness de testes abre uma conexão nova para cada transação, como o `expo-sqlite` faz em produção | Jest |
| R1.3 | Um backup com `shift_earnings.platform_id` sem plataforma é recusado, e os dados anteriores ficam intactos | Jest |
| R1.4 | Depois de restaurar, `PRAGMA foreign_key_check` vazio é condição para concluir a transação | Jest |
| R1.5 | Restaurar o backup e marcar o onboarding acontecem na mesma transação | Jest |

## R2. Validação na fronteira de dados

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R2.1 | Schemas zod ficam junto dos tipos de domínio: perfil de custo, dias de trabalho, preferências do Copiloto, histórico de ofertas e uma linha por tabela do backup | Revisão |
| R2.2 | O backup recusa `work_weekdays` fora de inteiros de 0 a 6, perfil de custo sem campos numéricos, centavos não inteiros e datas fora de `AAAA-MM-DD` | Jest |
| R2.3 | O backup recusa histórico que não é lista e preferências que não são objeto. Ofertas com formato inválido são descartadas antes de chegar ao módulo nativo, e as outras são mantidas | Jest |
| R2.4 | `settingsRepository.getJson` recebe schema e valor padrão. JSON inválido ou fora do formato devolve o padrão, sem lançar erro | Jest |
| R2.5 | As chaves de configuração são um tipo `SettingKey`. Uma chave fora de `SETTING_KEYS` não compila | Typecheck |
| R2.6 | `getEnum(key, values, fallback)` lê tema e modo de oferta. Valor desconhecido devolve o padrão | Jest |
| R2.7 | Os repositórios de veículo e GPS leem JSON pelo schema, sem `as` | Jest, Revisão |
| R2.8 | `modules/copilot/index.ts` valida preferências e histórico. Uma linha inválida do histórico é descartada sem esconder as outras | Jest |
| R2.9 | `CopilotPreferences.fromJson` com JSON corrompido devolve as preferências padrão | Kotlin |
| R2.10 | `lastBackupAt` que não é número trata o backup como vencido | Jest |
| R2.11 | A lista de tabelas do backup vem de `tablesSchema`, sem uma segunda lista e sem `{} as` | Revisão |

## R3. Leitura de ofertas resistente a falhas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R3.1 | Um texto com sequência de dígitos maior que `Int` antes de `min` não lança exceção. O trecho ilegível é descartado, e a oferta só é lida se o resto bastar | Kotlin |
| R3.2 | `onImageText` e `mockScan` têm a mesma proteção de `requestScan`: uma exceção não derruba o processo | Revisão |
| R3.3 | Se `recognizer.process` lançar exceção síncrona, `busy` volta a falso e o bitmap é reciclado | Revisão |
| R3.4 | `OfferDiagnostics.enabled` é `@Volatile`, e o setter usa a mesma trava de `capture` | Kotlin, Revisão |
| R3.5 | No `onDestroy` do serviço, uma falha em `hide()` de um canal não impede liberar a voz, o leitor de imagem e a thread | Kotlin |
| R3.6 | `pause` e `resume` do `ShiftTimer` são atômicos quando chamados do JS e do botão flutuante ao mesmo tempo | Kotlin |
| R3.7 | Em API abaixo de 33, nós e janelas de acessibilidade são reciclados depois da leitura | Revisão, Manual |

## R4. Ponte nativa assíncrona

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R4.1 | `getHistory`, `getOffers`, `getRecentOffers` e `setHistory` são `AsyncFunction` | Revisão |
| R4.2 | Nenhum componente chama o módulo nativo durante o render. `ShiftDetailScreen` e `useOfferHistory` carregam por `useAsyncData` | Jest |

## R5. Carregamento de dados

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R5.1 | `useAsyncData` carrega uma vez ao montar a tela, não duas | Jest |
| R5.2 | Ao mudar `deps`, `loading` volta a verdadeiro até a resposta nova chegar | Jest |
| R5.3 | Uma falha de carregamento aparece como erro com opção de tentar de novo, nunca como lista vazia | Jest |
| R5.4 | `AsyncBoundary`, em `shared/ui`, mostra carregando, erro e conteúdo. Toda tela cujo conteúdo principal vem de `useAsyncData` usa esse componente | Jest, Revisão |
| R5.5 | O erro capturado vai para `reportError`, um ponto único que hoje grava no console em `__DEV__` | Revisão |

## R6. Formulários

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R6.1 | O formulário da meta preenche os campos uma vez. Voltar à tela ou ao app não apaga o que foi digitado | Jest |
| R6.2 | Os mínimos de oferta seguem a mesma regra de R6.1 | Jest |
| R6.3 | `useFormHydration(data, toFields)`, em `shared/hooks`, é o único jeito de preencher formulário com dado carregado | Revisão |
| R6.4 | Toda escrita disparada por botão usa `useSubmit`: dois toques seguidos geram uma só gravação. Vale para lembretes, plataformas, calculadora, lembrete diário e backup | Jest |
| R6.5 | Os mínimos de oferta são salvos ao sair do campo ou no botão salvar, não a cada tecla | Jest |
| R6.6 | Valores negativos são recusados em despesa, km, corridas, odômetro e hora de início | Jest |
| R6.7 | A hora de início aceita só de 0 a 23 | Jest |
| R6.8 | Ao editar, horas aparecem como `H:MM` e decimais com no máximo duas casas e vírgula, por `decimalToInput` | Jest |

## R7. Medição por GPS

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R7.1 | A sessão de GPS tem um número de ciclo. `reset` incrementa o número, e o `gpsTask` só grava no ciclo em que leu a sessão e com a medição ligada | Jest |
| R7.2 | Descartar a medição durante um lote em andamento termina com 0 metros, e a próxima jornada começa do zero | Jest |
| R7.3 | Pedir permissão e ler o estado do GPS em `start()` ficam dentro do `try` | Jest |
| R7.4 | A escolha de medir km por GPS é salva e respeitada ao reabrir o formulário | Jest |

## R8. Regras de domínio

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R8.1 | `resolveKm` e `validateShiftForm` ficam em `domain/shift`, como funções puras | Jest |
| R8.2 | O custo da jornada no mês fechado e o gráfico do relatório ficam em `domain/report` | Jest |
| R8.3 | A regra do lembrete por km fica em `domain/reminder`, usada pelo painel e pela tela de lembretes | Jest |
| R8.4 | As regras de insight usam `computeShift` e `totalsByPlatform`, sem cálculo próprio de lucro | Jest |
| R8.5 | "Últimas 4 semanas" são 28 dias, de `hoje - 27` até `hoje`, inclusive | Jest |
| R8.6 | `parseDecimal("-1.234")` dá -1234, como `"1.234"` dá 1234 | Jest |
| R8.7 | O seed de desenvolvimento usa datas locais, por `addDays(today(), -n)` | Jest |
| R8.8 | As fixtures conferem `profitCents`, `perKm` e `perHour`, e há casos neutros, sem custo por km, com valor definido nos dois lados | Fixtures |
| R8.9 | No caso neutro, Kotlin e TypeScript devolvem o mesmo `profitCents` | Fixtures |

## R9. Camadas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R9.1 | Nenhum componente `.tsx` de `features` importa `@/data`. Cada tela usa um hook ou serviço `.ts` da própria funcionalidade | Lint |
| R9.2 | Orquestradores usados por mais de uma funcionalidade ficam em `src/application`: progresso da meta, sincronização dos mínimos do Copiloto, insights e próximo passo | Revisão |
| R9.3 | Uma funcionalidade só importa outra pelo `index.ts` dela. Não há ciclo entre funcionalidades | Lint |
| R9.4 | Componentes usados por mais de uma funcionalidade são expostos pelo `index.ts` da funcionalidade dona. Os que não dependem do domínio podem ir para `shared/ui` | Lint |
| R9.5 | `expo-notifications` e `expo-location` são usados só em `shared/platform`, que oferece `ensureNotifications` e `ensureLocation` | Lint |
| R9.6 | `shared/utils` não importa `react-native` nem `expo-*`. `confirm` e `share` vão para `shared/platform` | Lint |
| R9.7 | Os repositórios são criados por fábrica, como `createShiftRepository(db, deps)`, e exportam uma instância padrão. Métodos que escrevem aceitam uma transação opcional | Jest |
| R9.8 | `domain` não importa `data`, `features`, `application`, React nem Expo | Lint |
| R9.9 | `OfferAccessibilityService` fala com o botão flutuante pela interface `FloatingHost`, e a escolha de canais fica em `OfferChannels`, testável sem Android | Kotlin |

## R10. Estrutura do módulo nativo

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R10.1 | `FloatingTimerService` delega a janela a `FloatingWindow`, a posição a `PillPositionStore`, o cartão a `FloatingCardPresenter` e a notificação a `ForegroundNotification`. Nenhum desses arquivos passa de 200 linhas | Revisão |
| R10.2 | `dp()` existe uma vez, como extensão de `Context` em `ScreenBounds.kt` | Revisão |
| R10.3 | O ajuste à borda da tela é uma função pura `ScreenBounds.clamp`, usada pelo cartão e pelo botão | Kotlin |
| R10.4 | As cores dos overlays vêm de `CardTheme`, sem literais `0xFF…` repetidos | Revisão |
| R10.5 | O texto da interface em Kotlin vem de `strings.xml`. `OfferEvaluator` e `OfferFormat` ficam no código, porque são testados sem Android e os motivos são conferidos pelas fixtures | Revisão |

## R11. Tipos

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R11.1 | `noImplicitReturns` e `noFallthroughCasesInSwitch` ligados | Typecheck |
| R11.2 | `noUncheckedIndexedAccess` ligado, sem `!` para silenciar | Typecheck, Lint |
| R11.3 | Sem `as` fora de `as const` no código de produção, exceto em testes | Lint |
| R11.4 | `MoreScreen` usa `Href` tipado, `ExpenseFormScreen` usa `useState<LooseCategory>`, e `useFormFields` não precisa de cast | Typecheck |
| R11.5 | Linhas do banco viram objetos de domínio no repositório, com nomes em camelCase e booleanos de verdade | Revisão |

## R12. Padronização automática

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R12.1 | `@typescript-eslint/no-explicit-any` como erro | Lint |
| R12.2 | Sem `else` depois de `return` e sem `if` dentro do `else`, por `no-else-return` e `no-restricted-syntax` | Lint |
| R12.3 | `max-depth` igual a 2 | Lint |
| R12.4 | Camadas verificadas por `import/no-restricted-paths`, cobrindo R9.1, R9.3, R9.5, R9.6 e R9.8 | Lint |
| R12.5 | `prettier --check` faz parte do `npm run lint`, e a ordem dos imports é conferida por `import/order` | Lint |
| R12.6 | No Kotlin, cadeias de `if/else if` viram `when`, e `if` opostos viram early return, como em `FloatingPanel`, `OfferCardView` e `CopilotStore` | Revisão |

## R13. Textos e constantes

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R13.1 | Textos repetidos ficam em um lugar só: `copy.ts` da funcionalidade, como no Copiloto, ou a constante do módulo que os usa, como `LOCATION_PERMISSION_MESSAGE` e `IRREVERSIBLE_MESSAGE` | Revisão |
| R13.2 | `MS_PER_DAY`, `MS_PER_HOUR`, `MS_PER_MINUTE` e `MONTHS_PER_YEAR` existem uma vez, em `shared/utils/time.ts` | Revisão |
| R13.3 | A faixa verde da nota usa `TARGET_SCORE`, sem repetir `3.5` | Revisão |
| R13.4 | Intervalos e arredondamentos com significado viram constantes nomeadas, como o atraso de 300 ms do Copiloto | Revisão |

## R14. Hooks enxutos

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R14.1 | `useShiftForm` usa `useFormFields` para os campos de texto e devolve só o que a tela usa | Jest |
| R14.2 | `useCopilot` vira `useCopilotPreferences`, `useCopilotTests` e `useCopilotDiagnostics` | Jest |

## R15. Dinheiro com biblioteca

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R15.1 | `Money`, em `shared/utils/money.ts`, é uma classe imutável sobre o `currency.js` e a única implementação de aritmética, arredondamento, leitura e formatação de reais | Jest, Revisão |
| R15.2 | `Money` aceita fração de centavo nas contas, como a taxa por km, e arredonda só ao formatar | Jest |
| R15.3 | O formato continua `R$ 1.234,56`, com `-R$ 12,34` para negativo e `R$ 12` no valor inteiro | Jest |
| R15.4 | A leitura de texto aceita `1.234,56`, `1.234`, `12,5`, `-1.234` e vírgula no final, como antes | Jest |
| R15.5 | `formatBRL`, `centsToInput` e os helpers de formulário delegam para `Money`, sem conta própria | Revisão |
| R15.6 | Banco, backup, fixtures e ponte com o Kotlin continuam em centavos | Jest |

## R16. Datas com biblioteca

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R16.1 | `shared/utils/dates.ts` usa o `DateTime` do Luxon, e nenhum outro arquivo faz conta com `Date` | Jest, Revisão |
| R16.2 | A data guardada continua `AAAA-MM-DD`, no fuso do aparelho | Jest |
| R16.3 | `fromISODate` sai. Quem precisava do dia da semana usa `weekdayOf`, quem precisava de intervalo usa `daysBetween`, e o seletor nativo usa `toJsDate` | Revisão |
| R16.4 | Meses, semanas e o fim do mês continuam iguais, inclusive na troca de horário de verão | Jest |
| R16.5 | `formatDate`, `formatMonth`, `formatDuration` e `formatClock` mantêm o texto de hoje | Jest |

## Plano

Cada fase é um PR. Uma fase só começa com a anterior integrada e com `npm run typecheck`, `npm test`, `npm run lint` e os testes Kotlin passando.

Em cada fase, a ordem é:

1. Escrever os testes dos critérios da fase. Eles devem falhar.
2. Fazer a correção mínima que faz os testes passarem.
3. Refatorar sem mudar os testes.
4. Registrar em `docs/arquitetura.md` as decisões novas.
5. Rodar `graphify update .`.

### Fase 1. Bugs que corrompem dados ou derrubam o app

Requisitos: R1, R3.1 a R3.3, R6.1, R6.2.

1. Mudar `sqliteHarness.ts` para abrir conexão nova por transação (R1.2). Os testes de backup devem passar a falhar com chave estrangeira órfã.
2. Criar `runInTransaction` e trocar as quatro chamadas: migração, jornada, seed e backup (R1.1, R1.3, R1.4).
3. Levar o onboarding para dentro da transação da restauração (R1.5).
4. Testes Kotlin de dígitos longos no parser e de exceção no caminho da imagem. Depois, `toIntOrNull` e `runCatching` (R3.1 a R3.3).
5. Criar `useFormHydration` e usar na meta e nos mínimos (R6.1, R6.2).

### Fase 2. Validação na fronteira

Requisitos: R2, R3.4 a R3.6, R6.4 a R6.7.

1. Schemas zod em `domain` (R2.1).
2. Backup validado por linha e por coluna JSON (R2.2, R2.3, R2.11).
3. `getJson` com schema, `SettingKey` e `getEnum` (R2.4 a R2.6).
4. Repositórios e ponte nativa lendo pelos schemas (R2.7, R2.8). Kotlin com valor padrão para preferências corrompidas (R2.9).
5. `lastBackupAt` inválido (R2.10).
6. Concorrência no Kotlin: diagnóstico, desmontagem e cronômetro (R3.4 a R3.6).
7. `useSubmit` em todas as escritas e validação de números (R6.4 a R6.7).

### Fase 3. Carregamento, GPS e ponte assíncrona

Requisitos: R4, R5, R6.8, R7.

1. Testes de `useAsyncData` para montagem, mudança de `deps` e erro. Depois, a correção do hook (R5.1, R5.2).
2. `AsyncBoundary` e `reportError`, aplicados em todas as telas (R5.3 a R5.5).
3. Funções nativas viram `AsyncFunction`, e os hooks passam a usar `useAsyncData` (R4).
4. Ciclo da sessão de GPS e escolha de medição salva (R7). A coluna nova entra por uma migração nova.
5. Formatação de edição com `decimalToInput` e `H:MM` (R6.8).

### Fase 4. Domínio

Requisitos: R8.

1. Mover `resolveKm`, a validação da jornada, o custo do mês fechado, o gráfico e o lembrete por km para `domain`, cada um com teste próprio (R8.1 a R8.3).
2. Insights reaproveitando `computeShift` e `totalsByPlatform`, e janela de 28 dias (R8.4, R8.5).
3. `parseDecimal` com sinal e seed com data local (R8.6, R8.7).
4. Ampliar as fixtures e alinhar o caso neutro entre Kotlin e TypeScript (R8.8, R8.9).

### Fase 5. Camadas

Requisitos: R9, R12.4.

1. Criar `src/application` e mover os orquestradores compartilhados (R9.2).
2. Um hook por tela nas 11 telas e componentes que importam `@/data` (R9.1).
3. Mover componentes compartilhados para `shared/ui`, e `confirm` e `share` para `shared/platform` (R9.4, R9.6).
4. Fachada de permissões em `shared/platform` (R9.5).
5. Fábricas de repositório com transação opcional (R9.7).
6. Ligar `import/no-restricted-paths` como erro (R9.3, R9.8, R12.4).
7. `FloatingHost` no Kotlin (R9.9).
8. Atualizar o diagrama de camadas em `docs/arquitetura.md`.

### Fase 6. Módulo nativo

Requisitos: R3.7, R10, R12.6.

1. `Dimens`, `ScreenBounds` com teste, e cores por `CardTheme` (R10.2 a R10.4).
2. Dividir `FloatingTimerService` (R10.1).
3. Textos para `strings.xml` (R10.5).
4. `when` e early return (R12.6).
5. Reciclagem de nós em API abaixo de 33, conferida em aparelho com Android 8 a 12 (R3.7).

### Fase 7. Tipos, lint e textos

Requisitos: R11, R12.1 a R12.3, R12.5, R13, R14.

1. Flags de typecheck que já passam (R11.1).
2. `noUncheckedIndexedAccess` e correção dos 27 erros em `rules.ts`, `dates.ts`, `useCopilot.ts`, `money.ts`, `useBackup.ts`, `connection.ts` e `backup.ts` (R11.2).
3. Remover os casts restantes e mapear linhas para objetos de domínio (R11.3 a R11.5).
4. Regras do ESLint e Prettier (R12.1 a R12.3, R12.5).
5. `copy.ts` por funcionalidade e constantes de tempo (R13).
6. Dividir `useShiftForm` e `useCopilot` (R14).

### Fase 8. Dinheiro e datas com biblioteca

Requisitos: R15 e R16.

1. Testes de `Money` e das datas com os formatos atuais, antes de trocar a implementação.
2. `Money` sobre o `currency.js`, e os helpers passam a delegar para ela.
3. `dates.ts` sobre o Luxon, com `weekdayOf`, `daysBetween` e `toJsDate`. `fromISODate` sai.
4. Registrar em `docs/arquitetura.md`.

## Fora do escopo

- Mudanças de comportamento visível, exceto mensagens de erro de carregamento e campos que deixam de ser apagados.
- Novas funcionalidades.
- Trocar `expo-sqlite` ou adotar ORM.
- Trocar centavos por `Money` nos tipos do domínio e do banco. Isso mudaria o contrato com o backup e com o Kotlin, e fica para uma próxima versão.
- Leitor de ofertas em TypeScript. O parser continua só no Kotlin.

## Pronto

A versão 0.10.0 está pronta quando:

- todos os critérios com teste Jest, Kotlin, Fixtures, Lint ou Typecheck passam;
- os critérios de Revisão foram conferidos no PR de cada fase;
- os critérios Manuais foram conferidos em um aparelho com Android 14 e em um com Android 8 a 12;
- `docs/arquitetura.md` descreve a camada `application`, `shared/platform`, o helper de transação e a validação na fronteira.
