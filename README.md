# Vali

Documentação interna. Repositório privado, código proprietário (veja [LICENSE](LICENSE)).

App Android para motoristas de aplicativo, de carro e moto, entenderem o custo real, o lucro de cada jornada e se uma oferta vale a pena. Os dados de trabalho ficam no celular do usuário.

## Situação do projeto

- **Fase atual:** preparação para o lançamento pago na Google Play. O app é distribuído só para o grupo de testers.
- **Plano completo:** [docs/planejamento/plano-de-lancamento.md](docs/planejamento/plano-de-lancamento.md).
- **Ordem de trabalho:** issues com o rótulo `planejamento`, agrupadas nos marcos "Fase 1" a "Fase 6". Cada issue tem as tarefas e o critério de pronto.

## Stack

Expo 58, React Native 0.88, TypeScript, Expo Router, SQLite (`expo-sqlite`), Zod, i18next (pt-BR, en, es) e um módulo nativo em Kotlin (`modules/copilot`) com o serviço de acessibilidade, o cartão flutuante, a voz e o OCR (ML Kit).

Antes de mexer em qualquer API do Expo, leia o [AGENTS.md](AGENTS.md): ele exige consultar a documentação da versão instalada.

## Estrutura

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
  copilot/      Módulo nativo: acessibilidade, cartão, voz e botão flutuante
scripts/        Build de release, verificação de permissões e ofertas de teste
docs/           Arquitetura, specs, i18n e planejamento
```

As regras de camadas, imports e estilo de código estão em [docs/arquitetura.md](docs/arquitetura.md) e são conferidas pelo lint.

## Rodar o projeto

Requisitos: Node 22 e Android SDK.

O app usa o Firebase (Crashlytics e Analytics) do projeto `motorista-app-br`. Coloque o `google-services.json` na raiz do repositório antes do primeiro build. Ele fica fora do git (`.gitignore`). No CI, o arquivo vem do segredo `GOOGLE_SERVICES_JSON`. As opções de coleta ficam em `firebase.json`: Analytics desligado até o consentimento, sem ID de publicidade.

```bash
npm install
npm run android        # development build no aparelho ou emulador
```

## Verificações

Rode antes de abrir qualquer PR. O CI roda as mesmas.

```bash
npm run typecheck
npm run lint
npm test
```

Testes do módulo nativo, depois de gerar a pasta `android`:

```bash
npx expo prebuild --platform android --no-install
cd android && ./gradlew :copilot:testDebugUnitTest
```

## Testar o Copiloto sem oferta real

Só em build de debug:

- `npm run mock -- setup` e depois `npm run mock -- uber` (o comando `npm run mock` lista as outras plataformas).
- Fluxo completo no emulador, com uma tela de oferta de teste: `bash scripts/teste-leitura.sh emulator-5556` com o build de debug instalado.

## Build para os testers

`npm run build:apk` roda as verificações, gera os APKs assinados em `dist/motorista.apk` (arm64) e `dist/motorista-32bits.apk` (armeabi-v7a) e confere as permissões com `scripts/verificar-permissoes.sh`.

Variáveis:

| Variável | Uso |
| --- | --- |
| `MOTORISTA_KEYSTORE` | Caminho da chave de assinatura (padrão `~/.android-keys/motorista-release.jks`) |
| `MOTORISTA_KEY_ALIAS` | Alias da chave (padrão `motorista`) |
| `MOTORISTA_KEYSTORE_PASSWORD` | Senha. Se não for definida, vem do Keychain do macOS (`motorista-release-keystore`) |

A chave de assinatura nunca muda: é ela que permite instalar cada versão nova por cima e, no futuro, atualizar pela Play sem perder dados. Mantenha backup em dois lugares seguros. Nenhum segredo (chaves, senhas, `google-services.json`) entra no git.

Distribuição: só no canal privado dos testers, com as notas da versão. O APK não deve ser publicado em lugar aberto.

## Build para a Play (AAB)

`npm run build:aab` roda as mesmas verificações, gera `dist/motorista.aab` assinado com a mesma chave e confere no manifesto final as permissões e o targetSdk (mínimo 36, exigência da Play). As variáveis são as mesmas da tabela acima.

A assinatura do AAB vem do plugin `plugins/withReleaseSigning.js`: quando `MOTORISTA_KEYSTORE` está definida, o build de release usa essa chave. Sem ela, usa a chave de debug. O CI gera o AAB assim, só para conferir que o build e as permissões estão certos.

## Checklist de versão

1. Atualizar `version` em `package.json` e `app.config.ts` e subir o `versionCode`.
2. `npm run typecheck`, `npm run lint`, `npm test` e os testes do módulo nativo.
3. `npm run build:apk` e conferir a saída do `verificar-permissoes.sh`.
4. Testar a instalação por cima da versão anterior num aparelho real.
5. Enviar o APK e as notas no canal dos testers.

## Créditos de terceiros

A fonte Manrope é distribuída sob a [SIL Open Font License](assets/fonts/OFL.txt).

O app não tem vínculo com Uber, 99, inDrive ou outras plataformas. As marcas citadas pertencem aos seus donos.
