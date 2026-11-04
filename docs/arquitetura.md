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
- **Metas derivadas da meta do mês:** `suggestOfferTargets` é função pura de domínio. A aplicação às metas por corrida é sempre uma ação explícita do usuário.
- **Lembrete por km:** `due_km` guarda o total acumulado de km das jornadas em que o aviso vence, sem depender de odômetro informado.
- **Layout da notificação:** a cor vem de `RemoteViews` no layout próprio, porque `setColor` sozinho não colore o corpo no Android atual.

## Decisões da versão 0.7.0

- **Uma jornada por vez:** existe um único cronômetro, salvo em `ShiftTimer`. `useShiftTimer` consulta esse estado a cada segundo, então o app reconhece uma jornada iniciada pelo botão flutuante.
- **Km em pausa:** `gpsTask` ignora os pontos recebidos com o cronômetro pausado e descarta o último ponto, evitando somar o trecho percorrido durante a pausa.
- **Distribuição:** o APK é publicado nas Releases do GitHub, com o nome fixo `motorista.apk`, para manter um link estável sem aumentar o histórico do git.
- **Assinatura:** `scripts/release-apk.sh` assina o APK com uma chave mantida fora do repositório. Toda versão precisa usar a mesma chave para instalar por cima da anterior.
