<div align="center">
  <img src="assets/icon.png" width="96" alt="Ícone do Motorista" />

  # Motorista

  **O app gratuito que mostra quanto sobra de verdade no trabalho de motorista.**

  Sem conta. Sem cobrança. Sem anúncios. Seus dados ficam só no seu celular.

  [**Baixar o APK para Android**](https://github.com/Dev-Etto/motorista/releases/latest/download/motorista.apk) · [Todas as versões](https://github.com/Dev-Etto/motorista/releases) · [Apoiar o projeto](https://buymeacoffee.com/contatodevj)
</div>

<p align="center">
  <img src="docs/imagens/inicio.png" width="200" alt="Tela inicial com o lucro do dia" />
  <img src="docs/imagens/oferta.png" width="200" alt="Cartão de avaliação de uma oferta" />
  <img src="docs/imagens/calculadora.png" width="200" alt="Calculadora de corridas" />
  <img src="docs/imagens/relatorios.png" width="200" alt="Relatórios de lucro" />
</p>

## Por que este projeto existe

Motorista já tem custo demais: combustível, manutenção, seguro, parcela ou aluguel. Uma ferramenta para entender esses números não deveria ser mais um boleto.

O Motorista quer democratizar esse tipo de app. Ele é uma opção profissional e gratuita para quem trabalha com aplicativo ou viagens particulares entender o custo real, cobrar melhor, buscar boas margens e ter mais organização e previsibilidade.

## O que o app faz

- **Custo real por km:** combustível, manutenção, pneus, seguro, IPVA, parcela ou aluguel.
- **Lucro de verdade:** por dia, semana, mês e ano, por km e por hora.
- **Jornadas:** cronômetro, km medidos por GPS e ganhos por plataforma.
- **Calculadoras:** avaliação de ofertas e preço de corridas particulares.
- **Meta do mês:** transforma o lucro que você quer em valor por dia, mínimo por km e mínimo por hora.
- **Copiloto de ofertas:** lê a oferta na tela e mostra uma nota de 0 a 10 por cartão, botão flutuante, notificação ou voz.
- **Mais recursos:** relatórios, lembretes de manutenção, backup em arquivo e tema claro e escuro.

### Você sempre decide

O Copiloto só lê e informa. Ele nunca toca na tela, nunca aceita nem recusa corridas e não envia mensagens. Cada plataforma tem suas próprias regras sobre apps de apoio, e vale conhecê-las.

**Dirigindo, use a voz e não mexa no celular.** Configure e consulte o app só com o carro parado.

## Como instalar

1. Toque em [**Baixar o APK**](https://github.com/Dev-Etto/motorista/releases/latest/download/motorista.apk) no celular Android.
2. Abra o arquivo baixado e permita a instalação quando o Android pedir.
3. Abra o Motorista e siga a introdução.

Para atualizar, instale a versão nova por cima da atual. Seus dados continuam no aparelho, mas vale fazer um backup antes.

O app é distribuído fora das lojas, então o Android pode mostrar avisos extras durante a instalação. Para o Copiloto, o Android também pede a liberação de configurações restritas e da acessibilidade. O passo a passo aparece dentro do app.

> **Situação atual:** versão piloto. O cálculo de custos, jornadas e relatórios já pode ser usado. A leitura automática de ofertas ainda está sendo validada com ofertas reais e pode falhar em alguns aparelhos ou versões das plataformas.

## Privacidade

- Não há conta nem servidor.
- O APK não tem permissão de internet: seus dados não saem do aparelho pelo app.
- Links como este repositório e a página de doação abrem no seu navegador.
- O backup só sai do celular quando você compartilha o arquivo. Ele não tem senha, então guarde em um lugar só seu.
- Os resultados são estimativas feitas com os dados que você informa. Não são aconselhamento financeiro nem fiscal.

## Apoie o projeto

O app é e continuará gratuito. Pretendo mantê-lo e adicionar novos recursos. Se ele ajudou você e quiser contribuir, a doação é totalmente opcional.

<a href="https://buymeacoffee.com/contatodevj"><img src="docs/imagens/bmc_qr.png" width="180" alt="QR code para doar pelo Buy Me a Coffee" /></a>

[**buymeacoffee.com/contatodevj**](https://buymeacoffee.com/contatodevj)

## Para desenvolvedores

Feito com Expo, React Native, TypeScript, SQLite e um módulo nativo em Kotlin. As decisões técnicas estão em [docs/arquitetura.md](docs/arquitetura.md).

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run android
```

`npm run build:apk` gera o APK assinado em `dist/motorista.apk`. Ele exige uma chave de assinatura própria, indicada pelas variáveis `MOTORISTA_KEYSTORE` e `MOTORISTA_KEYSTORE_PASSWORD`.

## Licença

O código é aberto para consulta, estudo e melhorias, mas **a comercialização é proibida**. A licença é a [PolyForm Noncommercial 1.0.0](LICENSE), com uma permissão adicional para motoristas.

- **Pode:** usar o app no seu trabalho de motorista, mesmo sendo remunerado, além de estudar, alterar e compartilhar gratuitamente, mantendo a licença e o aviso de autoria.
- **Não pode:** vender ou alugar o app ou versões derivadas, cobrar por acesso, instalação, recursos ou suporte, exibir anúncios ou incluí-lo em produto ou serviço pago.

Este resumo não substitui o texto do arquivo [LICENSE](LICENSE).

Motorista é um projeto independente, sem vínculo com Uber, 99, inDrive ou outras plataformas. As marcas citadas pertencem aos seus donos.
