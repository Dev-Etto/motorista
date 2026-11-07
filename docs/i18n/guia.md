# Guia de traduções

Como escrever texto de interface no app. A decisão de arquitetura está em `docs/arquitetura.md`, e os requisitos em `docs/specs/idioma-e-regiao.md`.

## Onde fica

- Traduções em `src/shared/i18n/locales/<idioma>/<namespace>.json`. O português (`pt-BR`) é a origem: toda chave nasce nele.
- Um namespace por funcionalidade, com o nome da pasta em `src/features`. `common` guarda o que `shared/ui`, as rotas de `src/app` e várias funcionalidades usam, como `actions.save`.
- Um namespace novo entra em `NAMESPACES` e em `resources`, em `src/shared/i18n/resources.ts`.

## Chaves

- camelCase, agrupadas pela tela ou pelo componente e depois pelo elemento: `shiftForm.hoursLabel`, `backup.importConfirm.title`.
- A chave diz o lugar e o sentido, nunca o texto: `shiftForm.saveButton`, não `salvar`.
- Uma chave por frase completa. Não monte frase juntando pedaços traduzidos, porque a ordem das palavras muda entre idiomas.

## No componente

```tsx
const { t } = useTranslation('shifts');
const format = useFormat();

<Button label={t('shiftForm.saveButton')} />
<Notice message={t('shiftForm.partial', { count: summary.partialCount })} />
```

- Para mais de um namespace: `useTranslation(['shifts', 'common'])`, e as chaves do segundo levam prefixo, como `t('common:actions.save')`.
- Listas de opções com rótulo, como as do `Segmented`, são montadas dentro do componente com `t`, não em constante fora dele.
- Rótulos de acessibilidade (`accessibilityLabel`, `accessibilityHint`) também são traduzidos.

## Fora do componente

- Função pura que monta texto recebe `t: TFunction<'namespace'>` e, se precisar formatar, `format: Formatter`. Assim ela é testada sem React. Exemplo: `describeInsight` e `describeOfferReason`.
- Código de efeito, como notificações e confirmações em `application` ou `shared/platform`, usa `i18n.t('namespace:chave')` de `@shared/i18n`.
- `domain` nunca importa traduções. Ele devolve códigos, e a funcionalidade traduz.

## Números, dinheiro e unidades no texto

- Todo valor entra por interpolação, já formatado por `useFormat()`: `t('goal.left', { amount: format.money(cents) })`.
- Exemplos de número dentro de frase também vêm do formatador: `t('common:invalidNumber', { example: format.moneyInput(15050) })`. Nunca escreva `150,50` no JSON.
- "por km" vira `por {{unit}}`, com `unit: format.distanceUnit`.
- Quando a unidade muda a gramática da frase, use contexto: chaves `plannedLabel_km` e `plannedLabel_mi`, chamadas com `t('plannedLabel', { context: format.distanceUnit })`.
- Símbolo de moeda em rótulo vem de `format.currencySymbol` ou `format.perDistanceLabel`.

## Plural

- Chaves `_one` e `_other`, chamadas com `count`: `t('shifts.count', { count })`. Outros idiomas acrescentam as formas que precisam, como `_few`.
- `count` também é interpolado: `"{{count}} jornadas"`.

## O que não se traduz

- Nomes de marca e de plataforma: Uber, 99, inDrive.
- `APP_NAME`.
- Os textos de exemplo de `useCopilotTests.ts`, que imitam a tela das plataformas.
- O que o usuário digitou, como nomes de plataformas e observações.

## Verificação

- `npm run typecheck` recusa chave inexistente e parâmetro faltando.
- `npm test` confere se todos os idiomas têm as mesmas chaves, os mesmos parâmetros e os plurais do idioma.
- `npm run lint` recusa texto fixo em `.tsx` pela regra `i18next/no-literal-string`.

## Novo idioma

1. Acrescente o código em `SUPPORTED_LANGUAGES`, em `src/domain/regional/regional.ts`.
2. Copie a pasta `locales/pt-BR` para `locales/<idioma>` e traduza cada arquivo, seguindo `docs/i18n/glossario.md`.
3. Registre os arquivos em `resources`.
4. Crie `modules/copilot/android/src/main/res/values-<idioma>/strings.xml`.
5. Rode `npm test`: o teste do catálogo aponta chave, parâmetro ou plural faltando.
