# Inventário de dados

Lista única do que o app guarda e do que sai do aparelho. É a base da política de privacidade e da seção Segurança dos dados da Play Console: qualquer mudança aqui precisa ser refletida nas duas.

Revisado em 08/11/2026 (issue #57).

## Guardado só no aparelho

| Onde | O que | Observação |
| --- | --- | --- |
| SQLite do app (`src/data`) | Veículos, custos, jornadas, ganhos por plataforma, despesas, metas, orçamentos, lembretes e configurações | Dados digitados pelo usuário. Campos de texto livre (rótulo de orçamento, nota de despesa, título de lembrete) podem conter o que ele quiser |
| SQLite do app, tabela `gps_session` | Distância acumulada da jornada e só o último ponto GPS | O último ponto é apagado ao parar ou zerar a medição. O trajeto não é guardado |
| `offer_log.db` (módulo nativo) | Histórico de ofertas dos últimos dias: hora, plataforma, valor, km, minutos, R$/km, R$/h, nota, cor, lucro estimado, motivo da nota e resposta do motorista | Só números e o texto da avaliação gerado pelo app. **Sem nome, telefone ou endereço de passageiro ou cliente.** O texto lido da tela não é gravado |
| Preferências do Copiloto (`SharedPreferences`) | Ajustes do cartão, voz, metas de R$/km e R$/h, pacotes monitorados, região | Configuração |
| Memória, enquanto o diagnóstico está ligado | Até 15 leituras recentes da tela para calibração (`OfferDiagnostics`) | Opcional, desligado por padrão, nunca vai para disco. Letras viram `x` e números que não são valor ou medida viram `#`, então nomes e endereços chegam mascarados |
| Arquivo de backup | Cópia dos dados acima | Só sai do aparelho quando o usuário compartilha |

## Sai do aparelho

Hoje, nada sai sem ação do usuário: o relato de problema e o backup usam o menu de compartilhar do Android.

As issues da Fase 2 e da Fase 5 vão acrescentar saídas. Cada uma deve ser registrada aqui quando entrar:

| Saída | Issue | Dados | Base |
| --- | --- | --- | --- |
| Relatórios de falha (Crashlytics) | #59 | Erro, modelo do aparelho, versão do Android e do app | Legítimo interesse, ligado por padrão, com opção de desligar em Escolhas de privacidade |
| Métricas de uso (Analytics) | #59 | Eventos anônimos: `onboarding_complete`, `copilot_enabled` (lista em `src/application/analytics.ts`) | Consentimento, desligado por padrão. Escolha guardada em `privacy_choices` |
| Relatar problema | #60 | A definir na implementação | Ação do usuário |
| Backup automático do Android | #61 | Banco do app (`files/SQLite`), histórico de ofertas (`databases`) e preferências, menos o cronômetro e a posição do botão flutuante. Regras em `plugins/withBackupRules.js` | Configuração do sistema. Só com criptografia de ponta a ponta (bloqueio de tela) |
| Backup no Google Drive | #75 | Arquivo de backup na pasta privada do app no Drive do usuário | Ação do usuário |
| Cobrança (Google Play e RevenueCat) | #78 | Compra e estado da assinatura, com ID anônimo | Execução do contrato |
| ML Kit | #89 | Verificar se envia métricas de uso ao Google com a internet liberada | A confirmar |

## Exclusão

- **No aparelho:** Mais → Sobre → Privacidade → Apagar todos os meus dados. Usa `ActivityManager.clearApplicationUserData()`, que apaga banco, preferências e arquivos do app e o fecha (#62).
- **Fora do aparelho:** a definir com o Firebase (#59) e a página pública de exclusão (#64).

## Nunca sai do aparelho

- Texto e imagem lidos das telas das plataformas.
- Nomes, telefones e endereços de passageiros ou clientes.
- Localização GPS.
- Valores individuais de ganhos, a menos que o usuário aceite um uso específico e agregado no futuro.
