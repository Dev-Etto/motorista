package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

private class FakeChannel : OfferChannel {
  var shown = 0
  var hidden = 0

  override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    shown++
  }

  override fun hide() {
    hidden++
  }
}

private class FakeScheduler : OfferScheduler {
  val pending = linkedMapOf<String, () -> Unit>()

  override fun schedule(key: String, delayMs: Long, action: () -> Unit) {
    pending[key] = action
  }

  override fun cancel(key: String) {
    pending.remove(key)
  }

  fun fire(key: String) = pending.remove(key)?.invoke()
}

class OfferSessionTest {
  private val channel = FakeChannel()
  private val scheduler = FakeScheduler()
  private val recorded = mutableListOf<String>()
  private val targets = OfferTargets(100.0, 200.0, 3000.0)
  private val offer = ParsedOffer(2000, 10.0, 20)
  private val session = OfferSession(
    channels = { listOf(channel) },
    preferences = { CopilotPreferences() },
    evaluate = { offer, source -> OfferEvaluator.evaluate(offer, targets, source) },
    record = { _, source -> recorded.add(source) },
    scheduler = scheduler,
  )

  @Test
  fun mesmaOfertaNaoRepete() {
    session.onScan(offer, "uber")
    session.onScan(offer, "uber")
    assertEquals(1, channel.shown)
    assertEquals(listOf("uber"), recorded)
  }

  @Test
  fun tempoQueDiminuiNaoRepeteAOferta() {
    session.onScan(offer, "uber")
    session.onScan(offer.copy(minutes = 19), "uber")
    assertEquals(1, channel.shown)
    assertEquals(listOf("uber"), recorded)
  }

  @Test
  fun leituraFalhaRapidaNaoFechaOCartao() {
    session.onScan(offer, "uber")
    session.onScan(null, "uber")
    session.onScan(offer, "uber")
    assertEquals(0, channel.hidden)
    assertTrue("gone" !in scheduler.pending)
  }

  @Test
  fun fechaQuandoAOfertaSome() {
    session.onScan(offer, "uber")
    session.onScan(null, "uber")
    scheduler.fire("gone")
    assertEquals(1, channel.hidden)
    session.onScan(offer, "uber")
    assertEquals(2, channel.shown)
  }

  @Test
  fun tempoLimiteFechaSemMostrarDeNovoAMesmaOferta() {
    session.onScan(offer, "uber")
    scheduler.fire("expire")
    assertEquals(1, channel.hidden)
    session.onScan(offer, "uber")
    assertEquals(1, channel.shown)
  }

  @Test
  fun fechaOsCanaisQueMostraramMesmoSeACondicaoMudar() {
    val outro = FakeChannel()
    var canais = listOf<OfferChannel>(channel)
    val sessao = OfferSession({ canais }, { CopilotPreferences() }, { o, s -> OfferEvaluator.evaluate(o, targets, s) }, { _, _ -> }, scheduler)
    sessao.onScan(offer, "uber")
    canais = listOf(outro)
    scheduler.fire("expire")
    assertEquals(1, channel.hidden)
    assertEquals(0, outro.hidden)
  }

  @Test
  fun testeNaoEntraNoHistorico() {
    session.preview(offer, "uber")
    assertEquals(1, channel.shown)
    assertTrue(recorded.isEmpty())
  }

  @Test
  fun semCustoFicaNeutroESemLucro() {
    val result = OfferEvaluator.evaluate(offer, OfferTargets(0.0, 200.0, 3000.0))
    assertEquals(OfferColor.NEUTRAL, result.color)
    assertEquals(null, result.profitCents)
  }

  @Test
  fun fraseDeVozCurta() {
    val result = OfferEvaluator.evaluate(ParsedOffer(1840, 8.5, 19), targets, "Uber")
    assertEquals("Uber. Nota 4,1. 2 e 16 por quilômetro.", OfferFormat.spokenPhrase(result, PrimaryMetric.PER_KM))
    assertEquals("Uber. Nota 4,1. 9 e 90 de lucro.", OfferFormat.spokenPhrase(result, PrimaryMetric.PROFIT))
  }

  @Test
  fun semTempoAHoraNaoEntraNaAvaliacao() {
    val result = OfferEvaluator.evaluate(ParsedOffer(1300, 4.3, 0), targets, "inDrive")
    assertEquals(null, result.hourOnTarget)
    assertEquals(OfferColor.GREEN, result.color)
    assertEquals("4,3 km", OfferFormat.distanceAndTime(result))
    assertEquals(false, OfferFormat.rates(result).contains("/h"))
  }

  @Test
  fun preferenciasSobrevivemAoJson() {
    val original = CopilotPreferences(voice = false, notification = true, primaryMetric = PrimaryMetric.PROFIT, cardSize = CardSize.EXTRA, theme = ThemeMode.DARK, durationSeconds = 8, monitoredPackages = setOf("a"))
    assertEquals(original, CopilotPreferences.fromJson(original.toJson()))
  }

  @Test
  fun leituraParcialEIdentificada() {
    assertTrue(OfferParser.isPartial("R$ 15,00 | Aceitar"))
    assertEquals(false, OfferParser.isPartial("R$ 15,00 | saldo"))
  }

  @Test
  fun cronometroMostraSegundos() {
    assertEquals("00:00:07", OfferFormat.clock(7000))
    assertEquals("01:02:03", OfferFormat.clock(3723000))
  }

  @Test
  fun notificacaoMostraOrigemENota() {
    val result = OfferEvaluator.evaluate(ParsedOffer(1840, 8.5, 19, 4.92), targets, "99")
    assertEquals("99 • Nota 4,1 • R$ 18,40", OfferFormat.notificationTitle(result).replace('\u00a0', ' '))
    assertTrue(OfferFormat.notificationDetails(result).contains("★ 4,92"))
    assertTrue(OfferFormat.notificationDetails(result).contains("8% acima do mínimo"))
  }

  @Test
  fun rotuloDaOrigemVemDoPacote() {
    assertEquals("Uber", OfferSources.label("com.ubercab.driver"))
    assertEquals("99", OfferSources.label("com.app99.driver"))
    assertEquals("inDrive", OfferSources.label("sinet.startup.inDriver"))
    assertEquals("App", OfferSources.label("outro"))
  }
}
