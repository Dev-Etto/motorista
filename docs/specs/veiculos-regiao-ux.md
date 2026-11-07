# Spec: veículos, idioma e região e usabilidade 0.12.0

Esta spec tem três etapas. A etapa A permite cadastrar mais de um veículo e diz qual deles foi usado em cada jornada. A etapa B redesenha a tela Idioma e região. A etapa C corrige os problemas de usabilidade de maior impacto encontrados na auditoria da 0.11.0. Cada requisito tem um critério de aceite e o teste que o confirma.

Tipos de teste:

- **Jest:** `src/**/__tests__`.
- **Lint:** `npm run lint`.
- **Typecheck:** `npm run typecheck`.
- **Revisão:** o que só a leitura do código confirma.
- **Manual:** o que só o aparelho confirma.

## Regras da entrega

- Todo o trabalho fica na branch `feat/veiculos-regiao-ux`. Nada entra na `main` antes de as três etapas estarem prontas.
- Cada etapa termina com `npm run typecheck`, `npm test` e `npm run lint` passando, em um commit próprio.
- A spec vem antes do código. Uma mudança de rumo durante a implementação atualiza a spec no mesmo commit.
- Quem já usa o app não perde dados: a jornada, o custo salvo nela e os lembretes continuam iguais depois da atualização.

## Etapa A. Mais de um veículo

Hoje o banco aceita vários veículos, mas o app usa sempre o último cadastrado. A tela Veículo edita só esse, e a jornada grava o veículo ativo no momento de salvar, sem a pessoa escolher. Com carro e moto, o custo por km da jornada sai errado.

### Conceitos

| Conceito | O que é |
| --- | --- |
| Veículo atual | O que a pessoa está usando agora. Define o custo por km do Copiloto, da calculadora, da meta e do Início |
| Veículo da jornada | O que foi usado naquela jornada. Define o custo por km copiado para ela |
| Veículo arquivado | Saiu de uso. Some das escolhas, mas as jornadas antigas continuam ligadas a ele |

### A1. Dados

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| A1.1 | `vehicleRepository.list()` devolve os veículos não arquivados, do mais antigo para o mais novo | Jest |
| A1.2 | O veículo atual fica na configuração `current_vehicle`. `getCurrent()` devolve esse veículo, ou o último não arquivado quando a configuração falta ou aponta para um arquivado | Jest |
| A1.3 | `setCurrent(id)` grava a configuração e o Copiloto recebe o custo por km do novo veículo | Jest |
| A1.4 | `archive(id)` marca `active = 0`. Arquivar o único veículo não é permitido | Jest |
| A1.5 | `getCostsAt(date, vehicleId?)` usa o veículo indicado ou, sem ele, o atual | Jest |
| A1.6 | `reminders` ganha `vehicle_id`. Lembrete por km criado agora fica ligado ao veículo atual, e o km acumulado dele conta só as jornadas desse veículo. Lembrete antigo, sem veículo, continua contando todas as jornadas | Jest |
| A1.7 | Uma instalação com um só veículo continua igual: ele vira o atual e todas as jornadas continuam ligadas a ele | Jest |
| A1.8 | Backup de versão anterior é restaurado sem erro, com os lembretes sem veículo | Jest |

### A2. Jornada

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| A2.1 | `ShiftInput` tem `vehicleId`. Salvar uma jornada copia o custo por km do veículo escolhido na data da jornada | Jest |
| A2.2 | Editar uma jornada mantém o custo copiado, salvo quando a data ou o veículo mudam. Nesses casos, o custo é copiado de novo | Jest |
| A2.3 | Com dois ou mais veículos, o formulário mostra a escolha do veículo, com o atual marcado numa jornada nova e o da jornada numa edição. Com um só, a escolha não aparece | Jest, Manual |
| A2.4 | A prévia do resultado usa o custo do veículo escolhido | Jest |
| A2.5 | O detalhe da jornada mostra o nome do veículo quando há mais de um cadastrado | Manual |

### A3. Telas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| A3.1 | Mais › Veículos abre a lista de veículos com nome, tipo (carro ou moto), custo por km de hoje e o selo "Atual" | Manual |
| A3.2 | Tocar num veículo abre a edição. "Adicionar veículo" abre o mesmo formulário vazio, com a escolha entre carro e moto e os valores sugeridos do tipo | Manual |
| A3.3 | A edição mostra "Usar agora" quando o veículo não é o atual e "Arquivar" quando há mais de um. Arquivar pede confirmação | Manual |
| A3.4 | Com dois ou mais veículos, o Início mostra o veículo atual numa linha que leva à lista | Manual |
| A3.5 | O onboarding continua criando um único veículo, que vira o atual | Jest |

## Etapa B. Idioma e região

Hoje a tela abre com cerca de 24 linhas de uma vez. O formato aparece como código (`pt-BR`), o card de país tem uma opção só e a prévia fica no fim.

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| B1 | O topo mostra uma prévia com dinheiro, distância, preço por km, data e consumo no perfil atual. A prévia muda na hora quando uma escolha muda | Jest |
| B2 | O card "Idioma e formato" tem as linhas Idioma e Formato regional, que mostram o valor atual e abrem a lista só quando são tocadas. "A semana começa em" fica no mesmo card como `Segmented`, porque tem só três opções | Manual |
| B3 | A lista de idiomas e a de formatos abrem em telas próprias do stack, com "Automático" no topo, dizendo o que foi detectado no aparelho | Manual |
| B4 | Cada formato tem nome legível, como "Português (Brasil)" ou "Español (México)", vindo de `common:formatLocaleName`, com o exemplo de data e número como subtítulo | Jest |
| B5 | Com um só país disponível, o país aparece como informação, sem ação, com a moeda ao lado. A explicação longa vai para um `LearnMore` | Manual |
| B6 | Unidades continuam como `Segmented`, com a grafia `km/L`, igual à da spec 0.11.0 | Revisão |
| B7 | A confirmação ao trocar de país com dados salvos continua igual | Revisão |
| B8 | `ListRow` ganha seta de navegação (`chevron`) para linhas que abrem outra tela | Revisão |

## Etapa C. Usabilidade

A auditoria da 0.11.0 listou 25 problemas. Esta etapa resolve os que o motorista encontra todo dia. Mudar as abas ficou de fora: o Copiloto roda em segundo plano e é configurado poucas vezes, e o Início já avisa quando ele para.

### C1. Início

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| C1.1 | "Nova jornada" aparece logo abaixo da jornada em andamento, antes dos cards de lucro | Manual |
| C1.2 | Os avisos de lembrete, backup e atualização ficam num único card "Pendências", com uma linha e uma ação por item | Jest, Manual |
| C1.3 | "Copiloto em pausa" é um aviso com ação, e não um estado vazio | Revisão |

### C2. Formulário da jornada

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| C2.1 | A data fica no primeiro card, antes de horas e distância | Manual |
| C2.2 | Na edição, o título é "Editar jornada" | Manual |
| C2.3 | Erros de hora de início, horas trabalhadas e odômetro aparecem embaixo do próprio campo | Jest |
| C2.4 | A confirmação de excluir uma jornada diz a data e o valor dela | Jest |

### C3. Formulário de despesa

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| C3.1 | Valor, litros e odômetro inválidos mostram o erro embaixo do próprio campo | Jest |

### C4. Componentes e acessibilidade

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| C4.1 | Cada opção do `Segmented` tem pelo menos 48 de altura e `accessibilityRole="radio"`, dentro de um grupo `radiogroup` | Jest |
| C4.2 | `ListRow` com `selected` usa `accessibilityRole="radio"` | Jest |
| C4.3 | A linha por plataforma em Relatórios tem o nome da plataforma como título | Revisão |
| C4.4 | O sufixo de minutos das calculadoras vem das traduções | Lint, Revisão |

### C5. Mais

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| C5.1 | A tela Mais tem uma seção "Preferências" com Aparência, Idioma e região, Plataformas e Lembretes | Jest |

## Plano

1. Spec (este arquivo).
2. Etapa A: migração e repositórios, depois jornada, telas e testes.
3. Etapa B: prévia e nomes dos formatos, telas de escolha e `ListRow` com seta.
4. Etapa C: Início, formulários, componentes e Mais.
5. `docs/arquitetura.md` com as decisões, versão 0.12.0 e revisão final da branch.

## Fora do escopo

- Relatório separado por veículo. O custo de cada jornada já é o do veículo dela, então os totais ficam certos.
- Escolher o veículo ao iniciar a jornada pelo botão flutuante. O veículo é escolhido ao salvar.
- Editar despesas avulsas e orçamentos salvos. Tocar continua abrindo a exclusão com confirmação.
- Mudar as abas e dividir a tela do Copiloto.
- Textos longos citados na auditoria, que pedem uma revisão de conteúdo própria.

## Pronto

A versão 0.12.0 está pronta quando:

- todos os critérios com teste Jest, Lint ou Typecheck passam;
- os critérios de Revisão foram conferidos no PR;
- os critérios Manuais foram conferidos num aparelho Android em `pt-BR`;
- uma instalação atualizada da 0.11.0 abre com o mesmo veículo, as mesmas jornadas e os mesmos lembretes.
