# Declarações da Play Console

Textos prontos para as declarações de permissões da Play Console, conferidos contra o código. A Console aceita português, mas a revisão costuma ser mais rápida em inglês, por isso cada texto tem as duas versões. Antes de enviar, confira se o comportamento descrito continua igual.

Revisado em 08/11/2026 (issue #58).

## Serviços em primeiro plano

O app declara dois tipos. Os dois só existem porque o motorista ligou o recurso, e mostram notificação enquanto rodam.

### `specialUse`: botão flutuante da jornada

**Como funciona no código:** `FloatingTimerService` (módulo `copilot`) com `foregroundServiceType="specialUse"` e subtipo `floating_shift_timer`. Só existe com a opção **Botão flutuante** ligada pelo motorista no Copiloto: ao ligar a opção, e depois ao abrir o app com ela ligada, o serviço começa (`useFloatingVisibility` → `CopilotModule.startFloating`). Ele mostra, sobre os apps de corrida, o botão com o cronômetro da jornada (mesmo zerado), por onde o motorista inicia e pausa a jornada e reabre a última oferta. É também a janela onde aparece o cartão de cada oferta. Arrastar o botão para a zona de esconder só o oculta por um tempo. O serviço para quando o motorista desliga a opção (`stopFloating`).

**Por que nenhum tipo padrão serve:** não há mídia, localização, chamada, sincronização de dados nem saúde envolvidos. O serviço só mantém visível, enquanto o motorista usa outros apps, o controle e o tempo da jornada que ele mesmo liga. Isso não é coberto pelos tipos padrão.

Texto para a Console (inglês):

> The app shows a floating button with the driver's shift timer over ride-hailing apps while they work. It only runs when the driver turns on the "Floating button" option, and stops when the driver turns the option off. From the button the driver starts and pauses the shift timer and reopens the last offer card, and the same overlay shows the offer cards. A persistent notification is shown while it runs. No standard foreground service type applies: there is no media playback, location, phone call, data sync or health use. The service only keeps the driver's own work-time controls visible while they use other apps, so they can track working hours and earnings per hour in real time.

Texto para a Console (português):

> O app mostra um botão flutuante com o cronômetro da jornada do motorista por cima dos apps de corrida enquanto ele trabalha. Ele só roda quando o motorista liga a opção "Botão flutuante" e para quando o motorista desliga a opção. Pelo botão, o motorista inicia e pausa o cronômetro da jornada e reabre o cartão da última oferta, e a mesma janela mostra os cartões das ofertas. Uma notificação fixa aparece enquanto ele roda. Nenhum tipo padrão de serviço em primeiro plano se aplica: não há mídia, localização, chamada, sincronização de dados nem saúde. O serviço só mantém visíveis os controles e o tempo de trabalho do próprio motorista enquanto ele usa outros apps, para acompanhar as horas e o ganho por hora em tempo real.

### `location`: medição de km da jornada por GPS

**Como funciona no código:** `startBackgroundTracking` (`src/shared/platform/location.ts`) usa `Location.startLocationUpdatesAsync` com `foregroundService`, o que cria o serviço do tipo localização com notificação visível. Só roda com a medição por GPS ligada pelo motorista na jornada. A permissão pedida é só a de localização em primeiro plano (`requestForegroundPermissionsAsync`). `ACCESS_BACKGROUND_LOCATION` está bloqueada em `app.config.ts`. O app guarda só a distância acumulada e o último ponto, que é apagado ao parar (ver `inventario-de-dados.md`).

Texto para a Console (inglês):

> When the driver turns on GPS distance measurement for a shift, the app measures the kilometers driven so it can calculate the real cost per kilometer and the shift profit. The driver starts and stops the measurement explicitly, and a persistent notification is shown while it runs. The app only requests foreground location permission (background location is not requested) and only stores the accumulated distance on the device. The route is not stored and location is never sent off the device.

Texto para a Console (português):

> Quando o motorista liga a medição por GPS na jornada, o app mede os km rodados para calcular o custo real por km e o lucro da jornada. O motorista inicia e encerra a medição de forma explícita, e uma notificação fixa aparece enquanto ela roda. O app pede só a permissão de localização em primeiro plano (não pede localização em segundo plano) e guarda só a distância acumulada no aparelho. O trajeto não é guardado e a localização nunca sai do aparelho.

## Vídeos para as declarações

Um vídeo curto (até uns 30 s) para cada tipo, gravado num aparelho real, com a tela inteira visível:

1. **`specialUse`:** ligar a opção Botão flutuante no Copiloto → iniciar a jornada pelo botão → trocar para um app de corrida mostrando o cronômetro por cima → desligar a opção e o botão e a notificação somem.
2. **`location`:** iniciar uma jornada com a medição por GPS → mostrar a notificação → andar um pouco e os km subindo → encerrar e a notificação some.
