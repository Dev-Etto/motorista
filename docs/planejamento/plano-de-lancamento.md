# Motorista — Plano de lançamento pago na Play Store

Atualizado em 09/11/2026 · João Neto (Dev-Etto)

> Documento de planejamento. As issues do repositório seguem a ordem de execução das fases descritas aqui.

## Resumo

**Objetivo:** transformar o Motorista em um app pago por assinatura na Google Play, completo para motoristas de carro e moto nos apps de corrida. O código fica fechado, e o app já nasce dentro das regras da Play e das plataformas suportadas. Preço: 7 dias grátis e depois R$ 9,90/mês (planos mensal, trimestral e anual).

**Sem data fixa de lançamento (decisão de 08/11).** O app só vai para a Play quando estiver completo e estável. Até lá, o repositório fica fechado e o APK é distribuído manualmente para o grupo de testers. Play Store, cobrança e divulgação ficam para a última fase. Mesmo assim, tudo o que a Play exige do app em si é feito desde já, para não haver retrabalho na hora de publicar.

**Ordem das fases:**

1. **Fechar e organizar:** repositório privado, licença proprietária, distribuição manual para os testers, nome e marca novos.
2. **Conformidade com a Play no código:** targetSdk 36, build AAB, divulgação de Acessibilidade, consentimento, dados mínimos, backup e relatório de falhas.
3. **Moto e mais apps de corrida:** carro e moto com custos e mínimos próprios, ofertas das categorias de moto da Uber, 99 e inDrive, relatórios por plataforma e novos apps de corrida escolhidos por dado.
4. **Estabilização com os testers**, até atingir os critérios de "pronto".
5. **Play Store e pagamento:** conta, RevenueCat, paywall, ficha, artes, teste interno e revisão de produção (conta de empresa, sem a regra dos 14 dias).
6. **Lançamento e divulgação.**

**Decisões que continuam valendo:** o app usa internet só para cobrança, suporte, falhas, backup e métricas opcionais. A coleta de dados é mínima e com consentimento. O backup fica na conta Google do usuário. O app só lê e calcula, nunca age pelo motorista. A marca nova vem antes de publicar. O app é só para corridas, de carro e de moto: entregas ficam de fora (decisão de 09/11).

**Os maiores riscos:** reprovação na declaração de Acessibilidade, a manutenção dos leitores de cada plataforma e a reação jurídica das plataformas.

## Diagnóstico do projeto hoje

Análise do repositório `Dev-Etto/motorista` na versão 0.17.0 (versionCode 25), commit d177853 de 08/11/2026.

| Área | Situação atual | Impacto no lançamento pago |
| --- | --- | --- |
| Stack | Expo SDK 58, React Native 0.88, expo-router, expo-sqlite, Zod, i18n (pt-BR, en, es) | Atual. Facilita o targetSdk 36 exigido pela Play |
| Pacote | `app.motorista.android`, minSdk 26 | Manter igual, porque muda a identidade do app |
| Distribuição | APK assinado à mão (`scripts/release-apk.sh`), separado em arm64 e armeabi-v7a | A Play exige **AAB**. É preciso um script novo ou EAS Build |
| Internet | Em release, bloqueia `INTERNET` e confere com `verificar-permissoes.sh` | Passa a usar internet (cobrança, suporte, backup e métricas). O bloqueio e o script de permissões precisam ser atualizados |
| Copiloto | AccessibilityService que lê telas da Uber, 99 e inDrive, com `canTakeScreenshot` + OCR (ML Kit) e sobreposição (`SYSTEM_ALERT_WINDOW`) | O ponto mais sensível da revisão da Play |
| Serviço em 1º plano | `specialUse` (cronômetro flutuante) + localização em 1º plano | Exige declaração na Play Console |
| Dados | Tudo local (SQLite), backup manual por arquivo, `allowBackup: false` | Bom para a seção Segurança dos dados. Exige cuidado na migração APK → Play |
| Monetização hoje | Link de doação (Buy Me a Coffee) em `src/config/app.ts` e no README | Remover |
| Textos "gratuito" | `onboarding.json` ("Sem conta. Sem cobrança. Sem anúncios."), `settings.json` (sobre e termos) em pt-BR, en e es | Reescrever |
| Licença | PolyForm Noncommercial + permissão extra para motoristas e proibição expressa de cobrar | Trocar por licença proprietária |
| Autoria | 204 commits, todos seus (Dev-Etto / João Neto) | Você pode relicenciar sozinho |
| Qualidade | CI com typecheck, lint, Jest e testes Kotlin | Ótima base para o teste fechado |
| Maturidade | README diz "versão piloto". Leitura de ofertas e faturamento estimado ainda em validação | Precisa estar estável antes de cobrar |

**Conclusão:** o produto já está maduro para cobrar. Custos, jornadas, metas, relatórios e calculadoras estão prontos. O Copiloto é o recurso que os motoristas pagam para ter. O trabalho que falta é sobretudo de embalagem: cobrança, textos, build e conformidade com a Play.

## Modelo de negócio e preços

### O mercado já paga por isso

- A **GigU** (antiga StopClub) faz a mesma avaliação de ofertas por acessibilidade. Ela fechou junho de 2025 com receita mensal de R$ 950 mil e está em centenas de cidades. Ou seja: motoristas pagam por esse recurso, e existe um concorrente grande e bem financiado.
- Uber e 99 começaram a vender passes de assinatura para motoristas, de R$ 6,99 a R$ 40,99. O motorista já está acostumado a pagar um valor fixo para trabalhar melhor, e R$ 9,90/mês fica na parte de baixo dessa faixa.
- **Seus diferenciais** contra a GigU: privacidade (sem conta, com os dados de trabalho no celular e no Google do próprio usuário), preço baixo, a conta do custo real por km e as metas de lucro.

### Planos (uma assinatura, três planos base)

| Plano | Preço | Equivale a | Desconto | Líquido estimado (−15% da Play) |
| --- | --- | --- | --- | --- |
| Mensal | R$ 9,90 | R$ 9,90/mês | — | \~R$ 8,42 |
| Trimestral | R$ 26,90 | R$ 8,97/mês | \~9% | \~R$ 22,87 |
| Anual | R$ 89,90 | R$ 7,49/mês | \~24% | \~R$ 76,42 |

O anual a R$ 89,90 segue o mesmo par R$ 9,90/mês e R$ 89,90/ano que o Google usou no Play Pass no Brasil, uma referência de preço que o brasileiro já conhece. O líquido é antes de imposto de renda e tributos. Veja a parte fiscal na seção da Play Console.

**Taxa da Play:** no Brasil, assinaturas pagam 15%. O Google anunciou a mudança para 10% de serviço mais 5% de cobrança (o mesmo total quando se usa o Play Billing). Ela começa por EUA, Reino Unido e Espaço Econômico Europeu, e o resto do mundo está previsto até setembro de 2027. Para você, a conta prática fica em 15%.

### Teste grátis

- 7 dias grátis configurados como **oferta de teste** em cada plano base, com elegível = "nunca teve esta assinatura". A Play cuida da elegibilidade, de lembrar o usuário antes da cobrança e do cancelamento. Você não precisa de relógio próprio, que seria fácil de burlar mudando a data do celular.
- O teste exige cartão ou outro meio de pagamento cadastrado. Isso reduz o número de testes, mas aumenta muito a conversão.

### O que acontece quando o teste ou a assinatura acaba (decisão sua)

Recomendação: **modo leitura**. A pessoa continua vendo o histórico e **sempre pode exportar o backup**, mas não registra jornadas novas nem usa o Copiloto. Prender os dados do usuário atrás da cobrança gera avaliação ruim e reclamação no Reclame Aqui. Deixar ver e exportar custa pouco e passa confiança.

Alternativa a considerar mais adiante, se a conversão ficar baixa: plano gratuito limitado (custos e calculadoras grátis, Copiloto pago). É o modelo mais comum no setor, mas foge do "tudo pago" que você quer. Fica como plano B, não para o lançamento.

### Preço regional (internacional)

Crie os preços em BRL e deixe a Play converter para os outros países. No lançamento, publique **só no Brasil**, porque as leituras do Copiloto foram validadas com Uber, 99 e inDrive daqui. Abra outros países depois, um por vez, conferindo os preços locais que a Play sugerir.

## O preço é bom? Projeção e potencial

### Avaliação do preço

**R$ 9,90/mês é um bom preço de entrada, mas é barato para o valor entregue.**

- **Para o motorista, a conta fecha fácil:** se o app evitar uma corrida ruim por semana, ele já se paga. A renda média de quem trabalha com app de transporte fica perto de R$ 2.900/mês (IBGE, 2025), e R$ 9,90 equivale a cerca de 0,3% disso.
- **Comparado com o que ele já paga:** os passes de Uber e 99 para motoristas vão de R$ 6,99 a R$ 40,99. O Motorista fica na parte de baixo da faixa.
- **O problema é do seu lado:** com R$ 9,90 sobram uns R$ 8,40 depois da Play. Isso limita quanto você pode pagar por cliente em anúncio (veja abaixo).

**Decisão: R$ 9,90/mês, para ganhar em volume de assinantes.** Com carro e moto num app só, o público é grande o bastante para essa estratégia: preço baixo derruba a principal objeção ("mais um boleto") e acelera o boca a boca. O anual a R$ 89,90 deve ser o plano em destaque na tela de assinatura, porque dá caixa adiantado e reduz cancelamento.

**Observação, alternativa para o futuro:** se um dia quiser subir o preço, teste **R$ 12,90 ou R$ 14,90 só para clientes novos**. A Play permite manter o preço antigo de quem já assina, o que vira argumento ("quem entrou cedo paga menos para sempre") e evita cancelamentos. Um bom momento seria depois de ter uma base estável e boas avaliações, ou quando entrar um recurso grande novo.

Sobre o teste: 7 dias é uma boa escolha. No relatório de 2026 da RevenueCat, testes de 5 a 9 dias convertem em mediana 37,4% em assinatura paga, contra 25,5% dos testes de até 4 dias.

### Tamanho do mercado

| Público | Quantos | Fonte |
| --- | --- | --- |
| Pessoas que trabalham por aplicativo no Brasil | \~1,96 milhão | IBGE, PNAD 2025 |
| Motoristas de carro com app como trabalho principal | \~905 mil | IBGE, PNAD 2025 |
| Usuários do maior concorrente (GigU) | \~200 mil, em mais de mil cidades | Imprensa, abril/2026 |

Com só 0,5% dos motoristas de carro (\~4.500 assinantes), o Motorista faria cerca de **R$ 35 mil/mês líquidos** antes de impostos. O mercado comporta um negócio de verdade. O desafio é alcance, não tamanho.

### Projeção dos primeiros 6 meses

**Premissas (ajuste com os dados reais do teste fechado):** receita líquida média de R$ 7,80 por assinante/mês (mistura de planos, já sem os 15% da Play e antes de impostos). A conversão de instalação em assinante pago em 35 dias usa como referência o benchmark da RevenueCat para apps com paywall rígido (10,7% global). Brasil e Android tendem a converter abaixo disso.

| Cenário | Instalações/mês | Conversão | Cancelamento mensal | Assinantes no mês 3 | Assinantes no mês 6 | Receita líquida no mês 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Conservador | 800, estável | 5% | 18% | \~100 | \~155 | \~R$ 1.200/mês |
| Base | 2.000, +15%/mês | 8% | 15% | \~480 | \~1.030 | \~R$ 8.000/mês |
| Otimista | 4.000, +25%/mês | 10,7% | 12% | \~1.470 | \~3.900 | \~R$ 30.000/mês |

Leitura honesta: o **conservador** é o que acontece se a divulgação ficar só nos seus grupos. O **base** exige rotina de conteúdo e algum anúncio. O **otimista** exige que um vídeo ou um criador grande "pegue". Nenhum cenário é garantido. Use a tabela para decidir onde investir esforço, não como promessa.

### Ele se vende sozinho? Vai ter assinante passivo?

**No começo, não.** Um app novo, sem avaliações, aparece pouco na busca da Play, e "Uber", "motorista" e "corrida" são termos disputados com a GigU e outros. A aquisição passiva (gente que acha o app sozinha na Play) cresce com três coisas: número e nota das avaliações, instalações recentes (a Play premia quem está crescendo) e palavras-chave certas no título e na descrição. A expectativa realista: nos 2 ou 3 primeiros meses, quase tudo vem do seu esforço ativo. A partir do 4º mês, com centenas de avaliações boas, a busca orgânica começa a trazer uma parte relevante sozinha. E o boca a boca entre motoristas é forte. Eles trocam dica o dia todo em ponto de apoio, grupo e fila de aeroporto.

### Orgânico ou pago?

**Os dois, nessa ordem: orgânico para validar, pago para escalar o que já funciona.**

- **Meses 1–2, orgânico:** grupos de WhatsApp e Telegram, vídeos curtos (TikTok, Reels, Shorts) mostrando o app avaliando uma corrida real, criadores de conteúdo para motoristas, e pedir avaliação aos pilotos. Custo: seu tempo.
- **A partir do mês 2, pago em teste:** Google App Campaigns (aparece na própria Play, no YouTube e na busca) com R$ 20–30/dia por 2 a 3 semanas, otimizando para "início de teste", não para instalação.
- **A conta que decide se o pago vale:** com R$ 7,80 líquidos e 15% de cancelamento ao mês, cada assinante rende em média \~R$ 52 ao longo da vida (7,80 ÷ 0,15). Para o anúncio dar lucro, o custo por assinante precisa ficar bem abaixo disso. Exemplo: instalação a R$ 3 com 8% de conversão dá R$ 37,50 por assinante. Dá lucro, mas com pouca folga. Por isso, primeiro medir a conversão real e só depois aumentar a verba.
- **O que mais rende para o seu caso:** parcerias com criadores de conteúdo para motoristas, que têm público exato e confiança, e um programa de indicação ("indique um colega e ganhe 1 mês"), usando códigos promocionais da Play.

## Transição de open source para pago

### Licença

- Você é o único autor (204 commits, sem contribuições de terceiros), então pode fechar o código sem pedir permissão a ninguém.
- A partir de agora: **licença proprietária** ("Todos os direitos reservados") no repositório e **contrato de uso (EULA)** dentro do app.
- Uma limitação que não dá para apagar: quem já baixou ou clonou o código até a 0.17.0 recebeu essa cópia sob PolyForm Noncommercial, e essa permissão não pode ser retirada. Na prática, o risco é baixo, porque a sua licença já proíbe vender, cobrar ou pôr anúncio. Alguém pode usar uma versão antiga para si, mas não pode concorrer comercialmente com ela.
- Não sou advogado. Para os termos de uso e a política de privacidade, ainda mais agora com coleta de dados, vale uma revisão profissional pontual.

### Fechar o repositório

1. Antes de fechar, baixe os APKs e as notas dos Releases para o seu arquivo pessoal.
2. Torne o repositório privado (Settings → Danger Zone → Change visibility). Os Releases, os links de download e as Issues deixam de ser públicos na hora.
3. Confira na aba Forks se alguém fez fork. Forks públicos de um repositório que vira privado continuam públicos e independentes, e você não consegue apagá-los.
4. Troque o arquivo `LICENSE` pela licença proprietária e reescreva o README como documentação interna.
5. Revise se não há segredos no histórico (a senha da keystore hoje vem do Keychain do Mac, o que é bom). Daqui para frente, chaves do RevenueCat e do Firebase ficam fora do git.
6. Suporte e sugestões passam a ser por e-mail e pelo botão "Relatar problema" dentro do app.

**Quando fechar:** agora, na fase 1, depois de avisar os testers e de montar o canal novo de distribuição.

### Distribuição manual do APK até a publicação

- **Assine sempre com a mesma chave** (`motorista-release.jks`) e o mesmo pacote. Assim, cada versão nova instala por cima sem perder dados, e no futuro a versão da Play também.
- **Canal:** um grupo só de testers (WhatsApp ou Telegram) com o APK e as notas de cada versão. Ou um link privado (Google Drive com acesso restrito ao grupo). Não publique o APK em lugar aberto, ou ele acaba circulando grátis.
- **Termo de tester:** mensagem curta que cada um aceita: versão de teste, não repassar o APK, pode ter bugs, dados ficam no celular dele. Isso também protege você já com o código fechado.
- **Verificação de desenvolvedor Android:** desde 30/09/2026, no Brasil, apps instalados fora da Play em aparelhos certificados precisam estar registrados por um desenvolvedor verificado. Sem isso, os testers precisam usar o fluxo avançado de instalação ou o adb. Faça a verificação e o registro do pacote já na fase 1. Eles servem também para a Play depois.
- **Alternativa melhor:** usar o teste interno da Play Console para essa distribuição (veja a nota na seção de fases).
- O script `release-apk.sh` continua útil nessa fase. A troca para AAB entra na fase 2, mantendo os dois por um tempo.

### Usuários atuais do APK

- **Mesma chave de assinatura:** na Play App Signing, envie a sua chave atual (`motorista-release.jks`) como chave de assinatura do app, em vez de deixar o Google gerar uma nova. Com a mesma chave e o mesmo pacote, a versão da Play instala por cima do APK e mantém os dados. Com chave diferente, o usuário teria que desinstalar e perderia tudo que não tivesse exportado. Faça backup da keystore em dois lugares.
- **Verificação de desenvolvedor no Android:** desde 30/09/2026, no Brasil, apps instalados em aparelhos certificados precisam ser de um desenvolvedor verificado. Fechar o repositório e migrar para a Play resolve isso de vez.
- **Comunicação** (nos grupos, com 1 ou 2 semanas de antecedência): "O Motorista vai para a Play Store como app pago, R$ 9,90/mês. Quem testou a versão piloto ganha acesso gratuito. Para continuar recebendo melhorias, instale pela Play."
- **Recompensa para os pilotos:** eles são os testadores do teste fechado e ganham acesso gratuito na produção com códigos promocionais (por exemplo, 6 ou 12 meses).

## Mudanças no app

### 1. Cobrança com RevenueCat

Com internet liberada, o **RevenueCat** (`react-native-purchases`) passa a ser a melhor escolha:

- Valida cada compra no servidor dele, reconhece as compras automaticamente (compra não reconhecida em 3 dias é reembolsada pela Play) e acompanha renovação, carência, suspensão e reembolso. Você não mantém backend no lançamento.
- Tem painel com receita, conversão de teste e cancelamento, ou seja, as métricas de negócio sem esforço.
- **Custo:** grátis até US$ 2.500 de receita mensal rastreada (por volta de R$ 13 mil). Acima disso, 1% da receita bruta. É o ponto em que você já vai ter uns 1.500 assinantes.
- Usa Play Billing 8 ou mais novo, obrigatório desde 31/08/2026. Confira a versão do SDK na instalação.

Como implementar:

- `npx expo install react-native-purchases react-native-purchases-ui` e development build em aparelho real (o emulador não tem Play Billing).
- **Sem login:** o RevenueCat gera um ID anônimo por instalação, e a assinatura fica presa à conta Google da Play. "Restaurar compra" recupera tudo em outro celular. Não é preciso criar conta no Motorista.
- No painel: entitlement `pro`, uma *offering* com os 3 planos e os produtos da Play ligados a ele.
- Crie `src/features/subscription/` com `useEntitlement()`, que ouve as mudanças do `CustomerInfo` e guarda o último estado no SQLite para funcionar sem rede por alguns dias.
- **Bloqueie também o lado nativo:** o Copiloto roda num AccessibilityService independente do JS. Acrescente `setEntitled(bool)` ao `CopilotModule` para o serviço parar de ler ofertas sem assinatura ativa.
- Alternativa futura: um backend próprio no Cloud Run (a sua stack), com a Play Developer API e notificações em tempo real via Pub/Sub. Só compensa quando o 1% do RevenueCat pesar.

### 2. Tela de assinatura (paywall) dentro das regras da Play

A tela precisa mostrar: duração do teste e **quando** vira cobrança; preço e frequência de cada plano **vindos da API** (nunca escritos no código); o que está incluído; como cancelar; botão de fechar; **Restaurar compra**; **Gerenciar assinatura**; e links de Termos e Privacidade. O `react-native-purchases-ui` traz paywalls prontos e configuráveis pelo painel, o que permite testar textos e destaque do anual sem publicar versão nova. Onde a tela aparece: fim do onboarding, ao tocar num recurso bloqueado e no menu Mais.

### 3. Internet e permissões

- Tire `INTERNET` e `ACCESS_NETWORK_STATE` do `blockedPermissions` de release e da lista `UNUSED_LIBRARY_PERMISSIONS`. Acrescente `INTERNET`, `ACCESS_NETWORK_STATE` e `com.android.vending.BILLING` ao `ALLOWED` do `scripts/verificar-permissoes.sh`. O script continua útil para impedir permissões que não foram decididas.
- Tráfego só por HTTPS e só para os serviços listados na política de privacidade (Google Play, RevenueCat, Firebase, Google Drive).
- **Regra de ouro:** o conteúdo das ofertas lidas (valores, endereços, nomes) e a localização GPS nunca saem do aparelho, salvo no backup que o próprio usuário fizer na conta Google dele.

### 4. Relatar problema e relatórios de falha

- **Falhas:** Firebase Crashlytics (você já conhece o Firebase). Ele mostra quais aparelhos e versões do Android quebram, o que é essencial com tantos modelos diferentes entre motoristas.
- **"Relatar problema":** um formulário no app (descrição, modelo do aparelho, versão do app e do Android) que grava no Firestore ou chama um endpoint pequeno no Cloud Run. Você recebe tudo num lugar só, em vez de e-mails soltos.
- **Leituras do Copiloto para calibração** (o fluxo "Enviar estas leituras" que já existe): mantenha opcional, mostre ao usuário exatamente o que será enviado e **remova nomes de passageiros e endereços antes do envio**.

### 5. Backup na conta Google (os dados continuam do usuário)

Duas camadas, nenhuma passando por um servidor seu:

1. **Backup automático do Android:** troque `allowBackup: false` por `true`, com regras dizendo o que entra (o banco SQLite e as preferências) e o que fica de fora (caches e diagnósticos). O Android salva sozinho, sem login, numa área privada do Google Drive do usuário, que não conta na cota dele. Do Android 9 em diante, o backup é criptografado de ponta a ponta com o PIN ou senha de bloqueio de tela. Ao trocar de celular ou reinstalar, os dados voltam. Limite de 25 MB por app, então vale medir o tamanho do banco depois de meses de uso e deixar o histórico de ofertas antigo fora do backup, se precisar. Esse backup roda em horários do sistema (aparelho parado, carregando, no Wi-Fi), então não é imediato.
2. **Botão "Salvar no Google Drive" e "Restaurar":** login com Google (Credential Manager) pedindo só o escopo `drive.appdata`, que a Google classifica como não sensível (verificação simples). O arquivo vai para a pasta oculta do app no Drive do usuário, que só o Motorista acessa. Dá para oferecer backup semanal automático com uma data visível ("último backup: ontem, 22h"), o que passa muita confiança.

A exportação manual por arquivo continua existindo. A camada 1 entra no lançamento (é quase só configuração). A camada 2 pode entrar na 1.0 ou na 1.1.

### 6. Dados para marketing e melhoria (LGPD)

**O que coletar:** eventos de uso anônimos, ligados a um ID de instalação e não a nome ou e-mail. Exemplos: onboarding concluído, teste iniciado, Copiloto ativado, plataforma usada (Uber, 99, inDrive), tela aberta, versão do app e do Android, modelo do aparelho e cidade aproximada (no máximo). Isso responde "onde as pessoas desistem" e "em que cidade investir em anúncio".

**O que nunca coletar:** conteúdo das ofertas, endereços, nomes de passageiros, localização GPS precisa, valores individuais de ganhos. Se um dia quiser estatísticas de ganhos ("o motorista médio de Recife ganha R$ X/km"), elas valem ouro para marketing. Mas faça isso só de forma agregada e com consentimento específico.

**Ferramenta:** Firebase Analytics (junto com o Crashlytics) ou PostHog. O Firebase é mais simples para você e se integra a anúncios do Google, o que ajuda a otimizar campanhas por "teste iniciado".

**LGPD na prática:**

- No onboarding, uma tela curta e honesta com duas opções separadas: "Ajudar a melhorar o app (estatísticas de uso anônimas)" e "Receber novidades e ofertas por e-mail". **As duas desligadas por padrão**, com consentimento explícito. Relatórios de falha podem ficar ligados com base em legítimo interesse, mas com opção de desligar.
- Política de privacidade dizendo o que é coletado, para quê, por quanto tempo, com quem é compartilhado (Google/Firebase, RevenueCat) e como pedir exclusão. Botão "Apagar meus dados" no app.
- A seção Segurança dos dados da Play precisa bater exatamente com isso. Divergência dá reprovação.
- Essa é a parte que mais pede uma revisão jurídica pontual. Não sou advogado.

**Posicionamento:** o selo "sem internet" sai, mas o diferencial de privacidade continua forte se for verdadeiro e bem explicado: "seus ganhos e corridas ficam no seu celular e no seu Google; nós só sabemos, se você deixar, quais telas do app são mais usadas".

### 7. Build e configurações

- **AAB em vez de APK:** troque o `release-apk.sh` por `bundleRelease` ou pelo EAS Build (`eas build -p android --profile production` + `eas submit`).
- **targetSdk 36** (obrigatório desde 31/08/2026): confira o que o prebuild do SDK 58 gera e fixe com `expo-build-properties` se precisar. Verifique também a compatibilidade com páginas de memória de 16 KB no relatório de pré-lançamento.
- **Versão** `1.0.0`, com `versionCode` a partir de 26.
- `app.config.ts`: plugins do RevenueCat e do Firebase, `google-services.json` fora do git (EAS Secrets), `allowBackup: true` com as regras de backup.
- CI: gerar o AAB de release e rodar o `verificar-permissoes.sh` sobre ele.

### 8. Textos que dizem "grátis" ou "sem internet"

- `src/config/app.ts`: remover `DONATION_URL`. Remover "Apoiar o projeto" da tela Sobre e o teste em `AboutScreen.test.tsx`.
- `onboarding.json` (`promise`): de "Sem conta. Sem cobrança. Sem anúncios." para algo como "Sem conta. Sem anúncios. Seus dados são seus."
- `settings.json` nos 3 idiomas: Sobre ("É gratuito… funciona sem internet") e Termos (que citam a licença não comercial) viram EULA e assinatura.
- Tela Privacidade: reescrever com a nova realidade (internet, cobrança, backup, métricas opcionais).

### 9. Divulgação em destaque da Acessibilidade

- A Play exige uma tela **dentro do app**, antes de mandar o usuário para as configurações. Ela explica o que é lido (texto e, se ligado, imagem das ofertas das plataformas suportadas), para quê, que o conteúdo lido não sai do aparelho e que o app não executa toques. E precisa de um botão de consentimento explícito. Confira se a `copilot-setup` cumpre tudo isso.
- **Não** marque `isAccessibilityTool="true"` (declaração falsa dá suspensão). Mantenha `canPerformGestures="false"`.

## Conformidade com a Play e com os apps suportados

O objetivo é que nem a Play nem Uber, 99 ou inDrive tenham motivo concreto para bloquear o app ou punir o motorista que o usa.

### O que as plataformas punem

- A Uber proíbe ferramentas de automação com o app ligado, como robôs que recusam corridas sozinhos. Ela chegou a expor o caso de um motorista que recusou 1,1 mil viagens num dia com um app desses, e foi justamente a recusa automática que motivou o processo contra a StopClub.
- A Uber também desativa contas por fraude, como apps de terceiros que alteram GPS ou tarifa, e por conta usada por outra pessoa.
- A Justiça já validou o banimento de um motorista que recusou milhares de corridas num mês, tratando isso como abuso do direito de recusar.
- **Ressalva:** não encontrei, nos termos públicos da 99 e da inDrive, uma regra específica sobre apps que só leem a tela. A leitura de conteúdo não é proibida de forma expressa nas fontes que achei, mas também não é autorizada. Vale a pena reler os termos atuais de cada plataforma antes do lançamento.

### Regras de produto que o Motorista deve seguir sempre

1. **Só ler e calcular. Nunca agir.** Nada de aceitar, recusar, tocar, rolar ou abrir telas pelo motorista, nem como opção "avançada". Mantenha `canPerformGestures="false"`. Isso protege o usuário, o app na Play (que proíbe automação pela API de Acessibilidade) e você juridicamente.
2. **Não interferir na tela da plataforma.** O cartão flutuante não pode cobrir os botões de aceitar ou recusar nem atrasar o toque do motorista. Ofereça posições seguras e deixe o cartão "atravessar" toques fora dele.
3. **Nunca mexer em GPS, rota ou tarifa** das plataformas. A medição de km do Motorista é só dele e só leitura.
4. **Dados de terceiros:** não guarde nomes de passageiros, telefones nem endereços completos. Do histórico de ofertas, mantenha só o necessário para o cálculo (valor, km, tempo, plataforma, hora e bairro no máximo). Revise o que o `OfferLogDatabase` grava hoje.
5. **Ler o mínimo necessário:** filtrar por pacote (só os apps suportados, o `rideApps.json` já faz isso), limitar a frequência de capturas de tela e manter a leitura por imagem como opção desligada por padrão.
6. **Marcas de terceiros:** não use logos nem cores oficiais de Uber, 99 ou inDrive no ícone, no nome, na imagem de destaque ou em anúncios. Na descrição, só de forma descritiva ("funciona com ofertas da Uber, 99 e inDrive"), com uma nota de que o app não é afiliado a essas empresas. Isso vale para a Play, que reprova uso de marca alheia, e para evitar briga de marca.
7. **Discurso público:** o Motorista ajuda a decidir com informação, não "burla" nem "vence o algoritmo". Evite qualquer comunicação que incentive recusa em massa.
8. **Guarde provas de boa-fé:** um documento técnico curto (o que o app lê, o que guarda, o que não faz) e o histórico das declarações aprovadas pela Play. Se uma plataforma questionar, isso ajuda muito.

### Do lado da Play

- Declaração de Acessibilidade com vídeo, divulgação em destaque no app e menção na descrição da loja.
- Declarações de serviço em primeiro plano (`specialUse` e localização).
- Segurança dos dados batendo exatamente com o que o app coleta (seção de mudanças no app, item 6).
- Paywall dentro da política de assinaturas.
- Nada de "marca alheia" na ficha.

## Checklist de pré-lançamento (conformidade)

O que deixa o app pronto para a Play mesmo sem publicar agora. Os itens marcados com (Console) dependem da conta da Play e ficam para a fase 5.

**Build e plataforma**

- [ ] targetSdk 36 e minSdk 26 confirmados no prebuild
- [ ] Build AAB de release funcionando (Gradle ou EAS), assinado com a chave atual
- [ ] Compatibilidade com páginas de memória de 16 KB verificada
- [ ] `verificar-permissoes.sh` atualizado com a lista nova de permissões

**Acessibilidade e sobreposição**

- [ ] Tela de divulgação em destaque com consentimento explícito, antes de abrir as configurações
- [ ] Nenhuma ação automática (`canPerformGestures="false"`), sem `isAccessibilityTool`
- [ ] Leitura filtrada pelos pacotes suportados (apps de corrida). Leitura por imagem desligada por padrão
- [ ] Cartão flutuante sem cobrir os botões das plataformas
- [ ] Vídeo de demonstração gravado (para a declaração)

**Serviços em primeiro plano e localização**

- [ ] Tipos declarados no manifesto (`specialUse` e localização) com justificativa escrita
- [ ] Localização só em primeiro plano e só com a medição ligada

**Dados e privacidade**

- [ ] Histórico de ofertas sem nomes, telefones nem endereços completos
- [ ] Tela de consentimento (métricas e e-mail desligados por padrão)
- [ ] Lista única de tudo que sai do aparelho, que vira a base da Segurança dos dados
- [ ] Política de privacidade, termos de uso e página de exclusão de dados publicados
- [ ] Botão "Apagar meus dados" no app
- [ ] Backup automático do Android com regras de inclusão e exclusão

**Conteúdo e marca**

- [ ] Nada de "grátis", "sem internet" ou doação nos textos (3 idiomas)
- [ ] Nome e ícone novos, sem marcas nem cores de terceiros
- [ ] Aviso de "não afiliado a Uber, 99 e inDrive"

**Fase 5 (Console)**

- [ ] Declaração de Acessibilidade e de serviços em primeiro plano
- [ ] Segurança dos dados, classificação de conteúdo e público-alvo
- [ ] Assinatura, planos e teste grátis. Paywall dentro da política
- [ ] Ficha da loja e artes

## Play Console passo a passo

### 1. Conta de desenvolvedor (faça já, porque a verificação demora)

**Decisão: conta de organização, com o seu CNPJ.**

|  | Conta de organização (CNPJ) |
| --- | --- |
| Custo | US$ 25, pagamento único |
| Exige | CNPJ + número **D-U-N-S** da empresa (gratuito, mas pode levar até \~30 dias) + verificação de pagamento (alguns dias) |
| Teste fechado obrigatório | **Não.** A regra de 12 testadores por 14 dias vale só para contas pessoais novas |
| Vantagens extras | Nome da empresa como desenvolvedor na loja, mais credibilidade e receita direto na PJ |

**Peça o D-U-N-S já na fase 1.** É a etapa mais lenta e não depende do app. Use exatamente a razão social e o endereço do cartão do CNPJ, porque divergência atrasa a verificação.

Depois de criar a conta: perfil de pagamentos em nome da empresa e **conta bancária PJ em reais**. Desenvolvedores no Brasil que recebem em outra moeda têm 25% retidos sobre as vendas para brasileiros.

**Parte fiscal:** a receita entra na empresa. Confirme com o contador se o CNAE e o regime atual (MEI, Simples etc.) cobrem venda de software por assinatura, porque isso pode exigir ajuste antes da primeira receita. Não sou contador.

### 2. Criar o app

- Nome do pacote: `app.motorista.android` (o mesmo do APK).
- **Play App Signing com a sua chave atual:** use a opção de exportar e enviar a chave existente (ferramenta PEPK). Depois, crie uma chave de upload separada.
- Registrar o pacote na verificação de desenvolvedor Android acontece pela própria conta.

### 3. Conteúdo do app (Política → Conteúdo do app)

- **Política de privacidade:** URL pública. Pode ser uma página no GitHub Pages do repositório público.
- **Anúncios:** não tem.
- **Acesso ao app:** instruções para o revisor testar sem conta de motorista. Explique o modo de oferta de teste (`testOffer`, o mesmo do `scripts/mock-oferta.sh`) e mande um vídeo.
- **Classificação de conteúdo:** questionário IARC.
- **Público-alvo:** 18+ (motoristas profissionais).
- **Segurança dos dados:** declare as métricas de uso (Firebase Analytics, opcionais), os relatórios de falha (Crashlytics), os dados de compra (Google Play e RevenueCat), os relatos de problema e o e-mail de quem optar por receber novidades. Localização e leitura de tela são processadas só no aparelho. O que for opcional deve aparecer como opcional.
- **Declaração da API de Acessibilidade:** "não é ferramenta de acessibilidade", motivo "funcionalidade do app", descrição do Copiloto e **vídeo** mostrando a divulgação em destaque, o consentimento e o recurso funcionando. A descrição da loja também precisa citar o uso de Acessibilidade.
- **Serviços em primeiro plano:** declare o tipo `specialUse` (cronômetro flutuante da jornada) e o de localização (medição de km), com justificativa e vídeo.

### 4. Assinatura (Monetizar → Produtos → Assinaturas)

| Item | ID sugerido | Configuração |
| --- | --- | --- |
| Assinatura | `motorista_pro` | Nome "Motorista Pro" (ou só "Motorista") e lista de benefícios |
| Plano base | `mensal` | Renovação automática a cada 1 mês, R$ 9,90 |
| Plano base | `trimestral` | A cada 3 meses, R$ 26,90 |
| Plano base | `anual` | A cada 1 ano, R$ 89,90 |
| Oferta (em cada plano) | `teste-7-dias` | Fase grátis de 7 dias. Elegível: novo cliente da assinatura |

Ative o **período de carência** (falha no pagamento sem cortar o acesso na hora) e a suspensão de conta. Cadastre o seu e-mail e o de alguns pilotos como **testadores de licença**: no teste, as renovações são aceleradas (o teste de 7 dias dura minutos).

### 5. Ficha da loja

- **Título** (até 30 caracteres), por exemplo "Motorista: lucro e ofertas". Use palavras que o motorista busca: custo por km, lucro, Uber, 99, calculadora de corrida. Cuidado com marcas de terceiros no título, que são motivo de reprovação. Na descrição, só de forma descritiva.
- Descrição curta (80 caracteres) e completa (até 4.000), deixando claro que é assinatura com 7 dias grátis.
- Ícone 512×512, imagem de destaque 1024×500 e capturas de tela (as de `docs/imagens/` são um bom começo, refeitas com a tela de assinatura).
- Categoria: **Automóveis e veículos** (a mesma da GigU).

### 6. Faixas de teste e produção

1. **Teste interno** (até 100 pessoas, sem revisão): pode ser o canal de distribuição para os testers desde as primeiras fases, com o relatório de pré-lançamento apontando problemas.
2. **Teste fechado** (opcional para conta de empresa): recomendado por 1 a 2 semanas com a versão candidata, para validar a compra real e a revisão das declarações antes da produção.
3. **Produção** em lançamento gradual: 20% → 50% → 100%, acompanhando falhas e avaliações.

## README e materiais públicos

### README (agora interno)

Com o repositório fechado, o README vira documentação de trabalho: como rodar, como gerar o AAB, como publicar (EAS ou Gradle), onde ficam as chaves (sem os segredos), variáveis de ambiente (RevenueCat, Firebase), checklist de versão e o histórico de decisões. O `AGENTS.md` continua igual. Reaproveite as seções "O que o app faz" e "Como as contas funcionam" como base da descrição da loja e do site.

### O que precisa ficar público

Repos públicos saem de cena, então estes materiais precisam de outra casa. O Firebase Hosting é o caminho natural, já que você vai usar Firebase.

- **Site simples** (uma página): o que o app faz, preço, botão da Play, perguntas frequentes e contato. É para onde vão os links dos vídeos e dos grupos.
- **Política de privacidade** e **termos de uso** (a Play exige URL pública).
- **Página de exclusão de dados** (a Play pede um link para o usuário pedir exclusão quando há coleta).
- **E-mail de suporte** dedicado, com domínio próprio se der.
- **Vídeo curto** (30 a 60 s) do Copiloto avaliando uma oferta. Serve para a ficha, para os grupos e para a declaração de Acessibilidade.

## Fases até o lançamento

Sem data fixa: cada fase termina quando cumpre o critério de saída, não quando o calendário manda. As durações são estimativas para você trabalhando no app em tempo integral.

| Fase | Estimativa | O que entra | Critério de saída |
| --- | --- | --- | --- |
| 1. Fechar e organizar | 1–2 semanas | Aviso aos testers. Arquivar os Releases e fechar o repositório. Licença proprietária. Rotina de distribuição manual do APK. Pedido do D-U-N-S e conta de organização na Play Console. Verificação de desenvolvedor Android e registro do pacote. Escolha do nome (busca no INPI, na Play e de domínio) e briefing do logo | Repositório privado, testers recebendo o APK pelo canal novo, nome escolhido |
| 2. Conformidade com a Play no código | 2–3 semanas | targetSdk 36 e build AAB. Divulgação em destaque da Acessibilidade. Revisão do que o histórico de ofertas guarda. Tela de consentimento (LGPD). Crashlytics e "Relatar problema". Backup automático do Android. Textos sem "grátis" e sem doação. Rascunho da política de privacidade e dos termos. Marca nova no app | Checklist de conformidade da seção "Pré-lançamento" todo marcado, exceto o que depende da conta da Play |
| 3. Moto e mais apps de corrida | 3–5 semanas | Carro e moto com custos e mínimos de oferta próprios. Ofertas das categorias de moto da Uber, 99 e inDrive. Relatórios e metas por plataforma. Próximo app de corrida escolhido por dado. Testers que rodam de moto no grupo | Ofertas de carro e de moto lidas corretamente nas plataformas suportadas, com fixtures no repositório |
| 4. Estabilização com testers | 3–4 semanas ou mais | Correções, desempenho, bateria, aparelhos problemáticos. Botão "Salvar no Google Drive" | Leituras corretas em pelo menos 95% das ofertas, mais de 99% das sessões sem falha e 2 semanas sem bug grave |
| 5. Play Store e pagamento | 5–7 semanas | Conta na Play Console (pode ser criada antes, veja a nota abaixo). RevenueCat, paywall, Segurança dos dados, declarações, ficha e artes. Teste interno. **Teste fechado curto (1–2 semanas, opcional com CNPJ).** Envio para a revisão de produção | App aprovado na revisão |
| 6. Lançamento | Contínuo | Lançamento gradual (20% → 100%), códigos para os testers, divulgação (seção de divulgação) | — |

Somando tudo, dá uns 3 a 5 meses até o lançamento: algo entre fevereiro e abril de 2027. Evite publicar entre meados de dezembro e o começo de janeiro, quando a revisão da Play costuma ser mais lenta.

**Nota sobre a conta da Play:** criar a conta cedo (US$ 25) não obriga a publicar. Ela permite usar o **teste interno** (até 100 pessoas, sem revisão) para distribuir as builds aos testers, no lugar do APK manual. A atualização fica automática pela Play, e o relatório de pré-lançamento já aponta problemas de conformidade e de compatibilidade. Com conta de empresa, não há a regra dos 12 testadores por 14 dias. Então, quando o app estiver pronto, ele pode ir direto para a revisão de produção. Vale considerar na fase 1 ou 2.

## Divulgação, artes e métricas

### Plano de divulgação depois da aprovação

| Quando | Ação | Objetivo |
| --- | --- | --- |
| Semana do lançamento | Pilotos postam depoimento e avaliam na Play. Você anuncia nos grupos com vídeo de 30 s | Primeiras 30–50 avaliações, que destravam a busca orgânica |
| Semanas 1–4 | 3 vídeos curtos por semana (TikTok, Reels, Shorts): "essa corrida de R$ 18 vale a pena?", "quanto custa o km do meu carro", "minha meta do mês" | Alcance orgânico e prova de valor |
| Semanas 2–6 | 3 a 5 criadores de conteúdo para motoristas, com acesso grátis e código para os seguidores | Público exato e confiança |
| A partir do mês 2 | Google App Campaigns com R$ 20–30/dia, otimizando por "teste iniciado" | Medir o custo real por assinante antes de escalar |
| Sempre | Indicação: "indique um colega e ganhe 1 mês" (códigos promocionais). Pedido de avaliação no app depois de uma jornada com lucro | Boca a boca e nota alta |
| Semanas 4–8 | Onda dedicada a quem roda de moto: grupos de mototáxi por app, pontos de apoio, criadores do nicho | Público de moto com o mesmo app |

**Mensagem central:** "Saiba quanto sobra de verdade em cada corrida. Sem conta, sem anúncio, seus dados são seus." Teste variações com os pilotos. A análise de orgânico x pago e de assinantes passivos está na seção de preço e projeção.

### Artes para a página da Play Store

| Arte | Especificação | Obrigatória? | O que mostrar |
| --- | --- | --- | --- |
| Ícone | 512 × 512 px, PNG 32 bits, até 1 MB | Sim | O logo novo, legível em tamanho minúsculo, sem cores ou formas de Uber, 99 ou inDrive |
| Imagem de destaque | 1024 × 500 px, JPEG ou PNG 24 bits sem transparência | Sim | Uma mensagem só ("Saiba quanto sobra de verdade") com o celular mostrando o Copiloto |
| Capturas de tela | Mínimo 2, até 8 por tipo de aparelho; sugerido 1080 × 1920 px | Sim (mín. 2) | 6 a 8 telas com legenda grande, nesta ordem: lucro do dia, Copiloto avaliando uma oferta, custo por km, meta do mês, calculadora, relatórios, backup e privacidade, planos com 7 dias grátis |
| Vídeo promocional | Link do YouTube | Não | Os mesmos 30 s do vídeo de lançamento |

Além da loja: posts 1080 × 1350 e stories 1080 × 1920 para Instagram e WhatsApp, e uma capa para os vídeos. Posso montar essas artes como designs editáveis assim que o nome e o logo novos estiverem definidos.

### Métricas

- **RevenueCat:** testes iniciados, conversão de teste para pago, cancelamentos, receita por plano.
- **Firebase Analytics** (de quem consentir): onde as pessoas desistem no onboarding, uso do Copiloto, plataforma e cidade aproximada.
- **Crashlytics e Play Console:** falhas por aparelho, ANRs, avaliações e origem das instalações (busca, anúncio, link).

| Métrica | Sinal de alerta | O que fazer |
| --- | --- | --- |
| Instalação → teste | Menos de 20% | Melhorar o onboarding e a primeira tela do paywall |
| Teste → pago | Menos de 30% | Mostrar valor nos 7 dias: notificação com o lucro real da semana |
| Cancelamento no 1º mês | Mais de 20% | Ver no Crashlytics se o Copiloto falha em algum aparelho |
| Nota na Play | Abaixo de 4,3 | Responder todas as avaliações e corrigir o que mais aparece |

## Expansão: moto, mais apps de corrida e marca nova

**Decisão (09/11/2026): o app é só para corridas, de carro e de moto.** Entregas ficam de fora. A leitura e a nota de ofertas de corrida já foram validadas com motoristas reais, e um app focado num público só é mais certeiro na mensagem, na loja e no produto. Cada plataforma de entrega também seria um leitor novo para manter, com outro modelo de oferta (coleta, pedidos agrupados, espera, gorjeta).

### O que muda no produto

- **Veículos:** carro e moto, cada um com seu perfil de custo (a moto tem custo por km bem menor e outro tipo de manutenção) e com mínimos de oferta próprios. O Copiloto usa os do veículo da jornada. Bicicleta fica de fora: sem combustível, a conta de custo, que é o centro do app, perde o sentido.
- **Moto nos apps atuais:** Uber, 99 e inDrive têm categorias de moto. As ofertas dessas categorias precisam de fixtures e calibração próprias, como as de carro.
- **Relatórios e metas:** separar ganhos por plataforma.
- **Mesmo preço** para tudo.

### Mais apps de corrida

Uber, 99 e inDrive cobrem a maior parte do mercado, incluindo as categorias de moto. Os próximos apps de corrida entram um por vez, escolhidos por dado: os pedidos dos testers, o "Relatar problema" e as métricas mostram em quais cidades estão os usuários e quais apps regionais eles usam. Priorize por número de pedidos, não por intuição. Cada app novo é manutenção permanente, porque as plataformas mudam de tela.

### Rebranding: sim, e antes do lançamento

Por que trocar o nome:

- "Motorista" soa como carro e não fala com quem roda de moto.
- É um termo genérico. Palavras descritivas costumam ter registro difícil como marca no INPI e se perdem na busca da Play ("motorista" traz centenas de apps).
- Trocar o nome **antes** de publicar custa quase nada. Depois, você perde reconhecimento, links e o hábito de busca dos usuários.

O que **não** muda: o nome do pacote (`app.motorista.android`). Ele é invisível para o usuário e precisa continuar igual para a atualização por cima do APK funcionar.

Critérios para o nome novo: curto, fácil de falar em áudio de WhatsApp, que lembre lucro, ganho ou "corre", que sirva para quem dirige carro e para quem pilota moto, e que não lembre Uber, 99 ou inDrive. Ideias para começar (**nenhuma verificada**, são só ponto de partida):

- **Sobra:** conversa com a promessa "quanto sobra de verdade".
- **Corre Certo:** usa a gíria do "corre", comum entre motoristas e motociclistas de app.
- **Rodou:** curto, de fácil lembrança e vale para carro e moto.
- **Tô no Lucro:** fala a língua do motorista.

Antes de escolher, para cada candidato: busca na base de marcas do INPI (classes de software, como a 9 e a 42), busca na Play Store, domínio `.com.br` e @ nas redes sociais. Depois, peça o registro da marca no INPI (vale a orientação de um especialista). Com o nome escolhido, posso ajudar a desenhar o logo e o ícone.

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
| --- | --- | --- |
| Declaração de Acessibilidade reprovada | Média | Divulgação em destaque bem feita, vídeo claro, nenhuma ação automática, descrição da loja citando o uso. A GigU está na Play com o mesmo modelo. Se reprovar, ajuste e reenvie |
| Reprovação na revisão de produção | Média | Checklist de conformidade completo e teste interno com relatório de pré-lançamento antes de enviar |
| Plataforma (Uber, 99, inDrive) processa o app ou pune quem usa | Baixa no início, cresce com a escala | Regras da seção de conformidade: só ler, nunca agir, não guardar dados de passageiros, não usar marca alheia. A StopClub derrubou a liminar da Uber em 2023. Documentação técnica de boa-fé guardada |
| Plataforma muda a tela e quebra a leitura | Alta (recorrente, e maior a cada app novo) | Fixtures, calibração, Crashlytics e "Relatar problema" para detectar rápido. Avisar "leitura em ajuste" no app em vez de falhar em silêncio |
| Divergência entre Segurança dos dados, política de privacidade e o que o app coleta | Média | Uma lista única de tudo que sai do aparelho, revisada a cada versão. Revisão jurídica pontual |
| Perda de confiança dos pilotos (pago, código fechado, internet) | Média | Aviso antecipado, acesso gratuito para pilotos, consentimento desligado por padrão e explicação honesta do que mudou |
| Nome novo com conflito de marca | Média | Busca no INPI e na Play antes de escolher. Pedido de registro logo depois |
| Perder a keystore | Baixa, mas catastrófica | Backup em dois lugares antes de tudo |
| Backup automático passa de 25 MB | Baixa no início | Medir o banco. Deixar histórico antigo de ofertas fora do backup automático |
| Concorrência da GigU (maior, com plano grátis) | Alta | Posicionamento em privacidade, custo real, preço e moto. Plano B: plano gratuito limitado |
| Parte fiscal mal resolvida | Média | Contador antes da primeira receita. Conta bancária em BRL |

## Fontes

- [Requisitos de teste para contas pessoais novas — Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)
- [Uso da API AccessibilityService — Play Console Help](https://support.google.com/googleplay/android-developer/answer/10964491?hl=en)
- [Descontinuação das versões da Play Billing Library — Android Developers](https://developer.android.com/google/play/billing/deprecation-faq?hl=en)
- [Requisito de nível de API alvo — Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878?hl=pt-BR)
- [Política de assinaturas — Play Console Help](https://support.google.com/googleplay/android-developer/answer/9900533)
- [Verificação de desenvolvedor Android — Android Developer Console Help](https://support.google.com/android-developer-console/answer/16561738)
- [Regras de verificação em vigor no Brasil desde 30/09 — Android Authority](https://androidauthority.com/android-sideloading-developer-verification-first-wave-rollout-3717921)
- [Taxas de assinatura da Google Play em 2026 — PricePush](https://pricepush.app/blog/google-play-subscription-fees-2026-real-math)
- [Google reduz taxas da Play Store — Tecnoblog](https://tecnoblog.net/noticias/em-vitoria-da-epic-games-google-reduz-taxas-da-play-store-veja-como-ficou/)
- [Retenção de 25% para recebimento fora de BRL — 9to5Google](https://9to5google.com/?p=92806)
- [In-app purchases no Expo — Expo Docs](https://docs.expo.dev/guides/in-app-purchases/)
- [expo-iap 2.7.0: Play Billing v8 — expo-iap](https://hyochan.github.io/expo-iap/blog/2.7.0)
- [expo-iap FAQ — expo-iap](https://hyochan.github.io/expo-iap/guides/faq)
- [Billing Library e permissões de rede — Google Play SDK Index](https://play.google.com/sdks/details/com-android-billingclient-billing)
- [Versões da Billing Library e reconhecimento em 3 dias — Adapty](https://adapty.io/glossary/google-play-billing-library/)
- [Play Pass no Brasil por R$ 9,90/mês — IstoÉ Dinheiro](https://istoedinheiro.com.br/play-pass-google-lanca-servico-de-assinatura-de-apps-e-games-no-brasil)
- [GigU atinge breakeven — Startupi](https://startupi.com.br/gigu-atinge-breakeven-receita-mensal-de-2-milhoes/)
- [Uber e 99 vendem assinaturas a motoristas — Diario de Pernambuco](https://www.diariodepernambuco.com.br/economia/2026/08/11721270-aplicativos-trocam-percentual-por-assinatura-e-motoristas-passam-a-pagar-antes-para-rodar.html)
- [StopClub derruba liminar da Uber — Tecnoblog](https://tecnoblog.net/noticias/2023/08/23/entenda-a-disputa-entre-uber-e-stopclub-nos-tribunais/)
- [Regra dos 12 testadores e contas de organização — Choicely](https://www.choicely.com/blog/google-play-12-tester-rule)
- [Mais da metade dos trabalhadores de apps estão em plataformas de transporte — Diario de Pernambuco (IBGE)](https://www.diariodepernambuco.com.br/economia/2026/09/11723112-mais-da-metade-dos-trabalhadores-de-aplicativos-estavam-em-plataformas-de-transporte-em-2025-diz-ibge.html)
- [Brasil tem quase 2 milhões de trabalhadores por aplicativos — O Hoje (IBGE)](https://ohoje.com/2026/09/04/brasil-tem-quase-2-milhoes-de-trabalhadores-por-aplicativos-aponta-ibge/)
- [905 mil motoristas usavam plataformas em 2025 — A Crítica (IBGE)](https://acritica.net/economia/brasil-tem-115-milhao-de-trabalhadores-no-transporte-por-aplicativos/)
- [Renda média de motoristas de aplicativo — Viva (IBGE)](https://viva.com.br/carreira-e-educacao/brasil-tem-quase-2-milhoes-de-trabalhadores-por-aplicativo-afirma-o-ibge.html)
- [GigU faturou R$ 12,3 milhões em 2025 e tem \~200 mil usuários — Portal Tela](https://www.portaltela.com/noticias/economia/2026/04/19/plataforma-para-motoristas-de-app-fatura-r-123-milhoes-em-2025/)
- [State of Subscription Apps 2026 — RevenueCat](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026)
- [Conversão de teste por duração — CatDoes (dados RevenueCat 2026)](https://catdoes.com/blog/free-trial-vs-pay-upfront)
- [Preços do RevenueCat em 2026 — Lushbinary](https://lushbinary.com/blog/revenuecat-integration-guide-native-vs-revenuecat-2026)
- [Auto Backup — Android Developers](https://developer.android.com/identity/data/autobackup)
- [Escopos da Drive API (drive.appdata não sensível) — Google for Developers](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Uber proíbe ferramentas de automação — Metrópoles](https://www.metropoles.com/colunas/grande-angular/com-app-robo-motorista-da-uber-recusou-11-mil-viagens-em-um-so-dia)
- [Uber e apps de terceiros que alteram GPS ou tarifa — Garagem 360](https://garagem360.com.br/uber-envia-comunicado-e-proibe-circulacao-de-motoristas/)
- [Justiça confirma exclusão de motorista por recusas — AutoPapo](https://autopapo.com.br/curta/justica-confirma-exclusao-de-motorista-da-uber-que-recusou-4-421-corridas-no-aplicativo/)
- [Requisitos de artes da Play — AppRadar](https://appradar.com/academy/android-app-screenshots)
- [CPI de Google App Campaigns — RocketShip HQ](https://www.rocketshiphq.com/?p=5758)
