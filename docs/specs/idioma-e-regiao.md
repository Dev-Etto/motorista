# Spec: idioma e região 0.11.0

Esta spec prepara o app para ser usado fora do Brasil. Ela separa quatro conceitos que hoje estão misturados no português e no real: idioma, formato regional, moeda e unidade. Entram o inglês e o espanhol, e a estrutura permite novos idiomas sem mudar código. Cada requisito tem um critério de aceite e o teste que o confirma. O plano no fim diz em que ordem cada requisito entra.

Tipos de teste:

- **Jest:** `src/**/__tests__`.
- **Kotlin:** `modules/copilot/android/src/test`, com `./gradlew :copilot:testDebugUnitTest`.
- **Fixtures:** `modules/copilot/fixtures/offers.json`, lidas pelo Kotlin e pelo Jest.
- **Lint:** regra do ESLint que falha o `npm run lint`.
- **Typecheck:** `npm run typecheck`.
- **Revisão:** o que só a leitura do código confirma.
- **Manual:** o que só o aparelho confirma.

## Conceitos

| Conceito | O que decide | Formato | Exemplo |
| --- | --- | --- | --- |
| Idioma | Textos da interface, da notificação e da voz | Tag BCP 47 de um idioma suportado | `pt-BR`, `en`, `es` |
| Formato regional | Separadores de número, nomes de meses, primeiro dia da semana, relógio de 12 ou 24 horas | Tag BCP 47 com região | `es-MX`, `en-US`, `pt-BR` |
| País onde dirige | Moeda e regras de leitura das ofertas, porque os valores vêm das telas das plataformas daquele país | Código ISO 3166 | `BR` |
| Unidade | Distância, volume e consumo | Enum | `km` ou `mi`, `L` ou `gal`, `km/L`, `L/100km` ou `mpg` |

Idioma, formato regional e unidade de exibição são preferência do motorista e só mudam como o número aparece. A moeda não é escolha livre: ela vem do país onde ele dirige, porque o Copiloto lê os valores das telas das plataformas desse país, e uma moeda diferente mostraria um número com o símbolo errado. Um país só entra na lista quando a leitura das plataformas dele existe. Hoje, só o Brasil.

## Princípios

- **Guardar canônico, converter na borda.** O banco, o backup, o domínio e a ponte com o Kotlin continuam em centésimos da moeda, quilômetros e litros. A conversão acontece só na leitura do campo e na formatação da tela.
- **Domínio sem texto.** `domain` devolve códigos e parâmetros, e quem traduz é a camada de apresentação.
- **Uma fonte de verdade.** O perfil regional é lido em um lugar só e chega ao JS e ao Kotlin pelo mesmo contrato.
- **Quem já usa o app não vê diferença.** Uma instalação existente continua em `pt-BR`, `BRL`, `km` e `L`, qualquer que seja o idioma do aparelho.
- **Padrão de mercado.** `i18next` e `react-i18next` para os textos do JS, `expo-localization` para ler o aparelho, `Intl` e Luxon para os formatos, e recursos do Android com `values-xx` e `<plurals>` para o Kotlin.
- **Regra escrita vira regra verificada.** Texto fixo, símbolo de moeda e locale escrito à mão viram erro de lint.
- **Teste antes da mudança.** Cada fase começa com testes que fixam o comportamento atual em `pt-BR` e só depois troca a implementação.

## R1. Perfil regional

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R1.1 | `domain/regional` define `RegionalProfile` com `language`, `formatLocale`, `currency`, `distanceUnit`, `volumeUnit`, `consumptionUnit`, `firstWeekday` e `hourCycle`, e o schema zod correspondente | Typecheck, Jest |
| R1.2 | `SUPPORTED_LANGUAGES` lista `pt-BR`, `en` e `es`. Um idioma novo entra por uma linha nessa lista e pelos arquivos de tradução, sem mudar outro código | Jest, Revisão |
| R1.3 | `resolveRegionalProfile(device, saved)` é função pura. A escolha salva vence a do aparelho, e a do aparelho vence o padrão. Cada campo é resolvido em separado | Jest |
| R1.4 | Idioma do aparelho fora da lista cai para o idioma suportado mais próximo pela língua (`es-AR` vira `es`, `pt-PT` vira `pt-BR`). Sem nenhum próximo, cai para `en` | Jest |
| R1.5 | A moeda padrão vem da região do aparelho, e a unidade padrão vem do sistema de medidas do aparelho. Região desconhecida usa `BRL` e o sistema métrico | Jest |
| R1.6 | `shared/platform/locale.ts` é o único arquivo que importa `expo-localization`. Ele devolve os dados do aparelho no formato que `resolveRegionalProfile` recebe | Lint, Revisão |
| R1.7 | `useRegional()` entrega o perfil resolvido às telas e é atualizado quando o usuário muda uma configuração ou o idioma do aparelho, sem reiniciar o app | Jest |

## R2. Infraestrutura de tradução

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R2.1 | `shared/i18n` configura o `i18next` com `react-i18next`, `pt-BR` como idioma de origem e reserva, e plurais pelo `Intl.PluralRules` | Jest |
| R2.2 | As traduções ficam em `shared/i18n/locales/<idioma>/<namespace>.json`, com um namespace por funcionalidade e um `common` para textos de `shared/ui` | Revisão |
| R2.3 | As chaves são tipadas a partir do `pt-BR` por `CustomTypeOptions`. Chave inexistente ou parâmetro faltando não compila | Typecheck |
| R2.4 | Todos os idiomas têm exatamente as mesmas chaves, os mesmos parâmetros de interpolação e as formas de plural exigidas pelo idioma | Jest |
| R2.5 | Nenhuma chave do `pt-BR` fica sem uso no código. Chaves montadas em tempo de execução, como `category.${code}` e as de contexto `_km`/`_mi`, impedem um extrator automático confiável, então a conferência é feita na revisão de cada PR | Revisão |
| R2.6 | As chaves descrevem o lugar e o sentido (`shifts.form.saveButton`), nunca o texto em português | Revisão |
| R2.7 | Frases com valor variável usam interpolação ou o componente `Trans`, nunca concatenação de partes traduzidas | Revisão |
| R2.8 | O setup do Jest inicia o i18n em `pt-BR` e com o perfil `pt-BR`, `BRL` e `km`, então os testes atuais passam sem mudança de texto | Jest |
| R2.9 | Em `__DEV__` existe um pseudo-idioma, com texto cerca de 40% mais longo e acentuado, para revisar cortes e textos esquecidos | Manual |

## R3. Textos fora do código

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R3.1 | Nenhum `.tsx` de `features` e `shared/ui` tem texto visível fixo, conferido por `i18next/no-literal-string` | Lint |
| R3.2 | `copy.ts` do Copiloto, `helpContent.ts`, `LOCATION_PERMISSION_MESSAGE`, `IRREVERSIBLE_MESSAGE` e os textos de `shared/platform` passam para os namespaces | Revisão |
| R3.3 | Rótulos de acessibilidade (`accessibilityLabel`, `accessibilityHint`) também são traduzidos | Lint |
| R3.4 | O nome do app é o mesmo em todos os idiomas. No Android, os pedidos de permissão são textos do sistema, e as explicações do app vêm das traduções da tela de permissões | Revisão |

## R4. Domínio sem texto

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R4.1 | `buildInsights` devolve `{ kind, params }`, e o título e a frase de cada insight são montados na funcionalidade pela chave `insights.<kind>` | Jest |
| R4.2 | `domain/expense` exporta só os códigos de categoria. O nome vem de `expenses.category.<código>` | Jest, Revisão |
| R4.3 | `DayPeriod` passa a ser `dawn`, `morning`, `afternoon` ou `night`, e o nome é traduzido na tela | Jest |
| R4.6 | `buildChart` devolve a data de cada ponto, e o rótulo do dia ou do mês abreviado é formatado na funcionalidade | Jest |
| R4.7 | `classifyOffer` devolve o motivo como `OfferReason`. O texto montado a partir dele é igual ao `reason` das fixtures | Jest, Fixtures |
| R4.4 | Mensagens de validação em `domain` viram códigos de erro tipados, como em `validateShiftForm` | Jest |
| R4.5 | Nenhum arquivo de `domain` tem texto em linguagem natural, conferido por uma regra de lint que recusa strings com espaço em `domain`, exceto em testes | Lint |

## R5. Formato regional

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R5.1 | `dates.ts` recebe o locale por parâmetro, sem `LOCALE = 'pt-BR'` fixo. As telas usam o formatador ativo de `shared/i18n/format`, ligado ao perfil | Jest |
| R5.2 | `weekBounds` e os calendários começam a semana no `firstWeekday` do perfil, pelas semanas de locale do Luxon | Jest |
| R5.3 | Nomes de mês vêm do Luxon no formato regional. Nomes de dia da semana vêm das traduções, porque seguem o idioma e a forma curta de cada língua | Jest |
| R5.4 | Horário de relógio, como a hora do lembrete, respeita `hourCycle`. Durações, como `formatDuration` e `formatClock`, continuam no formato `H:MM` e `HH:MM:SS` | Jest |
| R5.5 | `formatNumber` usa `Intl.NumberFormat` no `formatLocale`, sem `toFixed` com troca manual de separador | Jest |
| R5.6 | A leitura de campo numérico aceita o separador decimal do `formatLocale` e ignora o de milhar: `1.234,56` em `pt-BR`, `1,234.56` em `en-US` | Jest |
| R5.7 | A data guardada continua `AAAA-MM-DD`, no fuso do aparelho, em qualquer formato regional | Jest |
| R5.8 | Uma matriz de testes cobre `pt-BR`, `en-US`, `es-MX` e `es-ES` nos formatos de número, data, mês e semana | Jest |

## R6. Moeda

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R6.1 | Valores continuam inteiros em centésimos da moeda escolhida, no banco, no backup, nas fixtures e na ponte com o Kotlin | Jest, Kotlin |
| R6.2 | `Money` recebe moeda e locale e formata por `Intl.NumberFormat` com `style: 'currency'`. As casas decimais vêm da moeda: `BRL` e `USD` com 2, `CLP` com 0 | Jest |
| R6.3 | `formatBRL` e `parseBRL` saem e dão lugar a `formatMoney` e `parseMoney`. Nenhum arquivo fora de `money.ts` escreve `R$`, `BRL` ou símbolo de moeda | Lint |
| R6.4 | Com `pt-BR` e `BRL`, o texto continua `R$ 1.234,56`, `-R$ 12,34` e `R$ 12` no valor inteiro, como na R15.3 da spec de qualidade | Jest |
| R6.5 | Taxas por distância (`/km`, `/mi`) e por hora usam `formatMoney` e mantêm a fração de centavo nas contas | Jest |
| R6.6 | A moeda vem do país onde o motorista dirige (`MARKET_CURRENCY`), nunca da moeda do aparelho nem de uma escolha livre. Trocar de país com dados salvos pede confirmação e não converte valores | Jest, Manual |
| R6.8 | O leitor de ofertas não avalia texto com outra moeda (`$`, `US$`, `€`, `£`) nem com distância em milhas, para nunca mostrar um valor com o símbolo ou a unidade errados | Kotlin, Fixtures |
| R6.7 | O app não faz câmbio nem consulta cotação | Revisão |

## R7. Unidades

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R7.1 | `shared/utils/units.ts` concentra as conversões entre km e mi, entre L e galão americano e entre km/L, L/100km e mpg, com as constantes exatas (`1.609344`, `3.785411784`) | Jest |
| R7.2 | Distância, odômetro, vida útil dos pneus, lembrete por km e km da jornada são digitados e mostrados na unidade do perfil e guardados em km | Jest |
| R7.3 | Litros do abastecimento são digitados na unidade do perfil e guardados em litros. Preço do combustível é mostrado por litro ou por galão | Jest |
| R7.4 | `consumptionKmPerUnit` continua guardado em km por litro. O formulário do veículo mostra e lê na unidade de consumo do perfil | Jest |
| R7.5 | Custo por km, metas de oferta e taxas aparecem por mi quando a distância é `mi`, convertidos na formatação, sem mudar o que é guardado | Jest |
| R7.6 | Ida e volta de cada conversão mantém o valor com erro menor que a menor fração mostrada | Jest |
| R7.7 | Trocar a unidade com dados salvos só muda a exibição e não altera nenhum valor guardado | Jest |

## R8. Escolha do usuário

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R8.1 | `SETTING_KEYS` ganha `language`, `formatLocale`, `currency`, `distanceUnit`, `volumeUnit`, `consumptionUnit` e `firstWeekday`, lidos e validados por `regionalSettings`. Valor ausente, `system` ou inválido segue o aparelho | Jest, Typecheck |
| R8.2 | Configurações ganha a tela Idioma e região, com idioma, formato regional, moeda e unidades. Cada campo mostra um exemplo do resultado, como `R$ 1.234,56` e `12,5 km` | Jest, Manual |
| R8.3 | O onboarding mostra o perfil detectado do aparelho e permite corrigir antes do primeiro cadastro | Manual |
| R8.4 | No Android 13 ou mais novo, o idioma também pode ser trocado em Configurações do sistema > Apps > Idioma, pelo `supportedLocales` do plugin do `expo-localization`. Escolher no app grava no `LocaleManager`, e a escolha feita no sistema é adotada quando o app volta ao primeiro plano | Jest, Manual |
| R8.5 | Trocar o idioma reagenda as notificações já agendadas, como o lembrete diário, com o texto novo | Jest |
| R8.6 | A lista de moedas começa pela moeda atual e pela do aparelho, seguidas das moedas mais comuns das regiões atendidas. Cada opção mostra o código e um valor de exemplo, sem depender de `Intl.DisplayNames`, que o Hermes não garante | Jest |

## R9. Dados e quem já usa o app

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R9.1 | Uma migração nova grava `pt-BR`, `BRL`, `km`, `L`, `km/L` e a semana começando na segunda nas instalações já com onboarding, sem sobrescrever uma escolha já salva. Instalação nova não recebe esses valores e segue o aparelho | Jest |
| R9.2 | Uma migração nova adiciona `platforms.system_key`. As plataformas padrão `Particular` e `Outros` recebem `private` e `other`. Ao aplicar o idioma, o nome guardado dessas linhas é trocado pela tradução, sem sobrescrever um nome que o usuário já usa em outra plataforma | Jest |
| R9.3 | A migração inicial não é alterada. Instalações novas recebem o `system_key` pela migração nova, e o seed traduzido usa o idioma resolvido | Jest, Revisão |
| R9.4 | O backup leva as configurações regionais junto da tabela `settings`. Um backup antigo, sem elas, é restaurado como `pt-BR`, `BRL`, `km` e `L` | Jest |
| R9.5 | Restaurar um backup com outra moeda pede confirmação, porque os valores não são convertidos | Jest, Manual |

## R10. Módulo nativo

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R10.1 | `CopilotPreferences` ganha `regional`, com `languageTag`, `formatLocale`, `currencyCode` e `distanceUnit`. JSON antigo sem o campo usa `pt-BR`, `BRL` e `km`, e preferências enviadas sem o campo mantêm o perfil atual | Kotlin |
| R10.2 | O JS envia o perfil ao módulo por `copilot.setRegional` sempre que ele é aplicado, validado por `copilotRegionalSchema` em `modules/copilot/schemas.ts` | Jest |
| R10.3 | `strings.xml` ganha `values-en` e `values-es`. O serviço usa um `Context` com o locale do perfil por `createConfigurationContext`, então o texto segue o app mesmo com ele fechado | Kotlin, Manual |
| R10.4 | `OfferFormat` e `OfferEvaluator` não montam frases. Nota, motivo, linhas do cartão, notificação e frase falada vêm de recursos com parâmetros e `<plurals>` | Kotlin |
| R10.5 | `OfferFormat` formata dinheiro por `NumberFormat.getCurrencyInstance` com a moeda e o locale do perfil, e distância na unidade do perfil | Kotlin |
| R10.6 | A voz usa o `languageTag` do perfil. Sem o pacote de voz do idioma, o canal de voz fica indisponível e o diagnóstico do Copiloto explica o motivo, sem falar em outro idioma | Kotlin, Manual |
| R10.7 | A frase falada usa o nome da moeda no idioma, com singular e plural (`1 real`, `12 reais`, `12 dollars`, `12 pesos`). Moeda sem nome nos recursos lê o valor formatado | Kotlin |
| R10.8 | A mesma matriz de locales da R5.8 roda nos testes Kotlin de `OfferFormat` | Kotlin |
| R10.9 | O formato do texto lido segue a plataforma do país, nunca o idioma, o formato ou a unidade escolhidos pelo motorista | Kotlin, Fixtures |

## R11. Exportação e notificações

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R11.1 | O cabeçalho do CSV é traduzido. O separador de colunas é `;` quando o decimal do `formatLocale` é vírgula e `,` nos demais casos, para a planilha abrir certo no aparelho | Jest |
| R11.2 | Os números do CSV usam o decimal do `formatLocale`, sem símbolo de moeda, e a coluna de valor diz a moeda no cabeçalho | Jest |
| R11.3 | O PDF do relatório usa os mesmos formatadores das telas e o atributo `lang` do idioma | Jest |
| R11.4 | Notificações e canais de notificação do JS e do Kotlin usam o idioma do perfil | Jest, Kotlin |

## R12. Traduções e processo

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R12.1 | `docs/i18n/glossario.md` fixa a tradução dos termos do produto em cada idioma: jornada, oferta, corrida, Copiloto, custo por km, meta, lucro e nota | Revisão |
| R12.2 | `docs/i18n/guia.md` explica como criar uma chave, usar plural e interpolação e adicionar um idioma | Revisão |
| R12.3 | `en` e `es` são revisados por uma pessoa fluente antes de serem distribuídos, inclusive as frases faladas | Manual |
| R12.4 | Espanhol usa um registro neutro da América Latina. Diferenças regionais ficam no formato regional, não no texto | Revisão |
| R12.5 | Nenhuma tela corta ou sobrepõe texto em `en`, `es` e no pseudo-idioma, nas fontes padrão e grande do sistema | Manual |

## R13. Verificação contínua

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R13.1 | `npm run lint` recusa texto fixo em `.tsx`, `R$`, `pt-BR`, `toLocaleString` e `toFixed` fora de `shared/i18n`, `shared/utils` e `domain/regional` | Lint |
| R13.2 | `npm test` confere paridade de chaves, plurais e parâmetros entre os idiomas | Jest |
| R13.3 | `import/no-restricted-paths` impede `domain` de importar `shared/i18n` | Lint |
| R13.4 | Os testes de tela renderizam em `pt-BR` e, nos fluxos principais, em `en-US` com `USD` e `mi` | Jest |

## Plano

Cada fase é um PR. Uma fase só começa com a anterior integrada e com `npm run typecheck`, `npm test`, `npm run lint` e os testes Kotlin passando.

Em cada fase, a ordem é:

1. Escrever os testes dos critérios da fase. Eles devem falhar.
2. Fazer a mudança mínima que faz os testes passarem.
3. Refatorar sem mudar os testes.
4. Registrar em `docs/arquitetura.md` as decisões novas.
5. Rodar `graphify update .`.

### Fase 1. Fundação regional

Requisitos: R1, R2.1 a R2.3, R2.8, R8.1, R9.1.

1. Testes de `resolveRegionalProfile` com aparelho, escolha salva e padrões (R1.3 a R1.5).
2. `RegionalProfile`, schema e `SUPPORTED_LANGUAGES` em `domain/regional` (R1.1, R1.2).
3. `shared/platform/locale.ts` com `expo-localization` (R1.6).
4. Novas chaves em `SETTING_KEYS` e migração que fixa o perfil das instalações existentes (R8.1, R9.1).
5. `shared/i18n` com `pt-BR` vazio, tipagem e setup do Jest (R2.1 a R2.3, R2.8).
6. `useRegional` (R1.7).

Sem mudança visível.

### Fase 2. Domínio sem texto

Requisitos: R4, R9.2, R9.3, R13.3.

1. Insights, categorias de despesa, períodos do dia, motivo da oferta, gráfico e erros de validação como códigos (R4.1 a R4.4, R4.6, R4.7).
2. Migração de `platforms.system_key` (R9.2, R9.3).
3. Regra de lint para texto em `domain` e para o import de `shared/i18n` (R4.5, R13.3).

Vem antes da formatação para que os formatadores novos não precisem entrar no domínio.

### Fase 3. Números, datas, moeda e unidade

Requisitos: R5, R6, R7, R13.1 nas partes de moeda e locale.

1. Matriz de testes de formatação com `pt-BR` fixando o texto de hoje, e com os outros locales esperados (R5.8, R6.4).
2. `Money` com moeda e locale, e troca de `formatBRL` e `parseBRL` em todos os arquivos que os usam (R6.1 a R6.5).
3. `dates.ts` com locale, primeira semana e ciclo de hora (R5.1 a R5.4, R5.7).
4. `formatNumber` e leitura de campo pelo `formatLocale` (R5.5, R5.6).
5. `units.ts` e conversões nos formulários e formatadores (R7).
6. Regras de lint de moeda, locale e `toFixed` (R13.1).

Sem mudança visível em `pt-BR`.

### Fase 4. Extração dos textos

Requisitos: R2.4 a R2.7, R3, R13.2.

1. Teste de paridade de chaves e plurais (R2.4, R13.2).
2. Extração por funcionalidade, um commit por namespace: `common`, `dashboard`, `shifts`, `expenses`, `vehicle`, `goals`, `offers`, `calculators`, `copilot`, `reports`, `insights`, `settings`, `onboarding`, `permissions`, `tips`, `help` (R3.1 a R3.3).
3. Nome do app e permissões pelo `app.config.ts` (R3.4).
4. Ligar `i18next/no-literal-string` e a verificação de chaves sem uso (R2.5, R3.1).

Pode ser dividida em mais de um PR. A regra do lint só é ligada no último.

### Fase 5. Módulo nativo

Requisitos: R10, R11.4 no Kotlin.

1. Testes Kotlin de `OfferFormat` na matriz de locales e de preferências antigas sem `regional` (R10.1, R10.8).
2. `regional` nas preferências e envio pelo JS (R10.1, R10.2).
3. Frases para recursos com plurais, e `Context` com o locale do perfil (R10.3, R10.4).
4. Dinheiro, distância e voz pelo perfil (R10.5 a R10.7).
5. Aviso de leitura só em reais (R10.9).

### Fase 6. Escolha do usuário, exportação e backup

Requisitos: R8.2 a R8.6, R9.4, R9.5, R11.1 a R11.3.

1. Tela Idioma e região e passo no onboarding (R8.2, R8.3, R8.6).
2. Idioma por app do Android e reagendamento das notificações (R8.4, R8.5).
3. Confirmação ao trocar moeda e ao restaurar backup com outra moeda (R6.6, R9.4, R9.5).
4. CSV e PDF pelo perfil (R11.1 a R11.3).

### Fase 7. Inglês e espanhol

Requisitos: R2.9, R12, R13.4.

1. Glossário e guia (R12.1, R12.2).
2. Arquivos `en` e `es` do JS e `values-en` e `values-es` do Kotlin.
3. Pseudo-idioma e revisão de cortes nas telas (R2.9, R12.5).
4. Testes dos fluxos principais em `en-US` (R13.4).
5. Revisão por pessoa fluente (R12.3, R12.4).

## Fora do escopo

- Leitura de ofertas em outros idiomas, moedas ou unidades. O `OfferParser` precisa de amostras reais de cada mercado e terá uma spec própria, que vai usar o `regional` desta.
- Câmbio, cotação ou conversão de valores já salvos.
- Mais de uma moeda nos mesmos dados.
- Galão imperial e idiomas escritos da direita para a esquerda.
- Plataforma de tradução, como Crowdin ou Weblate. Os JSON e os `strings.xml` já estão no formato que elas leem.
- Tradução de textos digitados pelo usuário, como nomes de plataformas e observações.

## Pronto

A versão 0.11.0 está pronta quando:

- todos os critérios com teste Jest, Kotlin, Fixtures, Lint ou Typecheck passam;
- os critérios de Revisão foram conferidos no PR de cada fase;
- os critérios Manuais foram conferidos em um aparelho com Android 14 em `pt-BR`, `en-US` e `es-MX`, e em um com Android 8 a 12 em `pt-BR`;
- uma instalação atualizada da 0.10.0 abre em `pt-BR`, `BRL` e `km` com os dados intactos, mesmo com o aparelho em outro idioma;
- `docs/arquitetura.md` descreve o perfil regional, a regra de guardar canônico e converter na borda, e o domínio sem texto.
