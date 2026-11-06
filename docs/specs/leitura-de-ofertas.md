# Spec: leitura de ofertas 0.9.4

O Copiloto lê a oferta na tela do app de corrida e mostra os números do motorista. Esta spec define como a leitura se comporta, com quais limites e como cada regra é testada.

Cada requisito tem um critério de aceite e o teste que o confirma:

- **Kotlin:** `modules/copilot/android/src/test`.
- **Jest:** `src/**/__tests__`.
- **Fixtures:** `modules/copilot/fixtures/offers.json`, usadas pelo Kotlin.
- **Fim a fim:** `scripts/teste-leitura.sh`, no emulador, com tela de teste para cada plataforma. Confere o valor gravado, não só a quantidade.
- **Manual:** o que só um aparelho real ou a tela confirmam.

## Princípios

- **Só leitura.** O app não toca na tela e não aceita nem recusa corridas.
- **Sem contornar proteções.** O app não se declara ferramenta de acessibilidade e não tenta burlar bloqueio de captura nem ocultação de janelas. Se uma plataforma esconder a oferta, o app fica sem leitura.
- **Nada sai do aparelho.** O release continua sem a permissão `INTERNET`.
- **Decisão do motorista.** O que traz mais risco para a conta fica desligado até o motorista ligar, com o aviso na mesma tela.

## R1. Leitura por imagem opcional

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R1.1 | `imageReading` nasce desligado, inclusive em preferências salvas antes desta versão | Kotlin |
| R1.2 | O valor é salvo e restaurado pelo JSON das preferências | Kotlin |
| R1.3 | Desligada, nenhuma captura de tela acontece | Kotlin, fim a fim |
| R1.4 | Vale só para a Uber e a 99 | Kotlin |
| R1.5 | A tela do Copiloto mostra a opção e o aviso de risco juntos | Manual |

## R2. Quando ler a imagem

Com a opção ligada, a captura só acontece se todas estas condições valerem:

| ID | Condição | Teste |
| --- | --- | --- |
| R2.1 | A leitura de texto não achou oferta, mesmo com texto igual ao da leitura anterior | Kotlin |
| R2.2 | Nenhum cartão está aberto | Kotlin |
| R2.3 | O app de corrida teve atividade há pouco | Kotlin |
| R2.4 | O texto mudou ou há uma rajada de leituras aberta | Kotlin |
| R2.5 | A tela não é de viagem em andamento | Kotlin |

## R3. Viagem em andamento

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R3.1 | Ações como iniciar ou finalizar a corrida, "Cheguei" e "Chegou ao destino" marcam a tela como viagem | Kotlin |
| R3.2 | Uma oferta reconhecida tem prioridade sobre a marca de viagem | Kotlin |
| R3.3 | Em viagem, a leitura de texto cai para 1 leitura por segundo e continua achando ofertas | Kotlin |

## R4. Ritmo da leitura

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R4.1 | Eventos seguidos não adiam a leitura | Kotlin |
| R4.2 | O intervalo é de 300 ms, 900 ms com cartão aberto e 1000 ms em viagem | Kotlin |
| R4.3 | Mudança de janela causada pelo próprio cartão não abre rajada | Kotlin |
| R4.4 | Achar a oferta encerra a rajada, mesmo com texto repetido | Kotlin |
| R4.5 | Enquanto a oferta estiver na tela, a leitura continua a cada 900 ms, para perceber que ela sumiu mesmo sem novos eventos | Kotlin, fim a fim |

## R5. Interpretação do texto

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R5.1 | Número e unidade em nós separados contam como uma medida | Fixtures |
| R5.2 | `R$` em nó próprio conta como parte do valor | Fixtures |
| R5.3 | A nota do passageiro só é aceita com estrela ou com a contagem de avaliações, como `4,96 (9)`. Número solto não vira nota | Fixtures |
| R5.4 | "Reservar" conta como ação de aceite, e "exclusiva" como sinal de produto | Fixtures |
| R5.5 | As regras antigas continuam valendo, com casos da 99 | Fixtures |
| R5.6 | Um valor logo depois de um rótulo como "Ganhos de hoje" ou "Saldo" não é o valor da corrida | Fixtures, fim a fim |
| R5.7 | O mesmo valor, depois de mais de 3 segundos sem leitura da oferta, é outra oferta | Kotlin |

## R6. Área ignorada da tela

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R6.1 | Na Uber, só os 15% de cima são ignorados, porque o cartão pode ser alto | Kotlin |
| R6.2 | A leitura por imagem usa o mesmo recorte | Kotlin |

## R7. Contador de leituras incompletas

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R7.1 | Soma uma vez por oferta incompleta, mesmo com contador mudando na tela | Kotlin |
| R7.2 | Volta a contar depois de uma leitura que não é incompleta | Kotlin |

## R8. Canais e aviso

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R8.1 | A tela avisa que o botão flutuante pode ser escondido durante a oferta e recomenda a voz | Manual |
| R8.2 | Termos, privacidade, README e descrição do serviço dizem que a imagem é opcional | Manual |
| R8.3 | Gravar a oferta não acontece na thread principal, e os registros mantêm a ordem | Revisão, fim a fim |

## R9. Botão flutuante

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R9.1 | O timer aparece ao lado da logo, mesmo zerado | Manual |
| R9.2 | O relógio não atualiza enquanto o botão está escondido | Revisão |
| R9.3 | `floatingButton` nasce ligado, inclusive em preferências salvas antes desta versão | Kotlin |
| R9.4 | O botão inicia ao abrir o app ou voltar a ele, se a preferência estiver ligada, houver permissão de sobreposição e ele não estiver rodando | Jest |
| R9.5 | Desligar o botão nas configurações do app fica salvo, e só essa opção o desliga de vez | Kotlin, manual |
| R9.6 | "Ocultar o botão" esconde até o motorista entrar no app e sair dele. O serviço continua ativo, e as ofertas aparecem no cartão avulso | Kotlin, manual |
| R9.7 | Arrastar o botão até a área de exclusão oculta com a mesma regra de R9.6, e a posição dele continua a de antes. Durante o arrasto ele segue o dedo. Solto fora da área, volta para fora do terço inferior da tela | Manual |
| R9.8 | A área entra com transição curta, o texto mantém contraste sobre qualquer fundo, e o círculo fica vermelho e cresce com o dedo sobre ela. O que está sendo arrastado encolhe nesse momento | Manual |

## R12. Identificação da plataforma no cartão

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R12.1 | O cartão, a oferta no botão, a notificação e as telas do app usam selo com nome e cor | Manual |
| R12.2 | Os selos de Uber, 99 e inDrive têm a mesma largura e altura em cada lugar, com o texto centralizado | Manual |
| R12.3 | Nenhuma imagem de marca entra no repositório | Revisão |
| R12.4 | O cartão, a oferta no botão e a notificação não mostram a nota do passageiro | Kotlin, manual |

## R13. Tempo e distância em ofertas com preço por km

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R13.1 | `N min.`, `N h M min.` e `Agora mesmo` são a idade do pedido e nunca contam como tempo de viagem | Fixtures |
| R13.2 | Em oferta com R$/km e tempos em pares `min` e `km`, o tempo só vale com os dois trechos, sem trecho zerado. Sem isso, "Por hora" fica vazio, sem estimativa. Tempo fora desse formato continua valendo | Fixtures |
| R13.3 | `~N km` é a distância até o passageiro e não conta como distância da viagem. Se for a única distância, a leitura é incompleta | Fixtures, Kotlin |
| R13.4 | O botão com bônus em outra linha e `Aumentar para R$ X` contam como ação de aceite, e o valor continua sendo o preço da oferta | Fixtures |

## R14. Cartão no botão flutuante

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R14.1 | O cartão cresce a partir do botão, em até 220 ms, e encolhe de volta ao fechar | Kotlin, manual |
| R14.2 | Com as animações do Android desligadas, o cartão aparece e fecha sem transição | Manual |
| R14.3 | Um toque em qualquer ponto do cartão fecha o cartão e interrompe a voz | Kotlin, manual |
| R14.4 | Ao arrastar o cartão, aparece uma área de exclusão na parte de baixo. Soltar com o dedo nela fecha o cartão, sem salvar a posição. Soltar fora só move. O cartão não tem ícone de fechar | Kotlin, manual |
| R14.5 | Oferta fechada pelo motorista não reaparece enquanto continuar na tela, e o toque em aceitar continua sendo registrado | Kotlin |
| R14.8 | Na posição padrão, o cartão não entra no terço inferior da tela, onde costumam ficar os botões de aceitar. A posição escolhida pelo motorista é respeitada | Kotlin |
| R14.6 | Nada depende de toque: sem interação, o cartão fecha sozinho como antes | Kotlin |
| R14.7 | "Última oferta" continua mostrando a oferta fechada | Manual |

## R10. Estrutura do código

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R10.1 | As decisões de leitura ficam em classes sem dependência do Android | Kotlin |
| R10.2 | Cada pacote de plataforma é definido em um lugar no Kotlin e em um no TS | Revisão |
| R10.3 | O painel não cria uma view de cartão só para ler a paleta | Revisão |
| R10.4 | `CopilotStore` tem uma instância por processo | Revisão |

## R11. Distribuição

| ID | Critério de aceite | Teste |
| --- | --- | --- |
| R11.1 | `motorista.apk` é a versão de 64 bits e mantém o link estável | `release-apk.sh` |
| R11.2 | `motorista-32bits.apk` atende aparelhos antigos, e o README explica qual baixar | `release-apk.sh` |
| R11.3 | Os dois passam na verificação de permissões | `release-apk.sh` |
| R11.4 | A versão sobe para 0.9.4 | `app.config.ts` |

## Fora do escopo

- Declarar `isAccessibilityTool`, burlar `FLAG_SECURE` ou evitar a ocultação de janelas.
- Interceptar rede, acessar APIs das plataformas ou simular ofertas em contas reais.
- Garantir leitura em todos os aparelhos. O formato real só é confirmado com uma oferta real no diagnóstico.
