package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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
  private val format = testFormat()
  private val channel = FakeChannel()
  private val scheduler = FakeScheduler()
  private val recorded = mutableListOf<String>()
  private val outcomes = mutableListOf<Pair<Long, OfferOutcome>>()
  private val targets = OfferTargets(100.0, 200.0, 3000.0)
  private val offer = ParsedOffer(2000, 10.0, 20)
  private var presentationChanges = 0
  private var clock = 1_000_000L
  private val session = OfferSession(
    channels = { listOf(channel) },
    preferences = { CopilotPreferences() },
    evaluate = { offer, source -> OfferEvaluator.evaluate(offer, targets, source) },
    record = { _, source ->
      recorded.add(source)
      recorded.size.toLong()
    },
    markOutcome = { offerId, outcome -> outcomes.add(offerId to outcome) },
    scheduler = scheduler,
    onPresentationChange = { presentationChanges++ },
    now = { clock },
  )

  @Test
  fun mesmoValorDepoisDeUmIntervaloSemLeituraEhOutraOferta() {
    session.onScan(offer, "uber")
    clock += 3100
    session.onScan(offer, "uber")
    assertEquals(2, channel.shown)
    assertEquals(listOf("uber", "uber"), recorded)
  }

  @Test
  fun leiturasSeguidasMantemAMesmaOferta() {
    repeat(10) {
      session.onScan(offer, "uber")
      clock += 900
    }
    assertEquals(1, channel.shown)
    assertEquals(listOf("uber"), recorded)
  }

  @Test
  fun motoristaFechaOCartaoEEleNaoVolta() {
    session.onScan(offer, "uber")
    session.dismiss()
    assertEquals(1, channel.hidden)
    assertFalse(session.presenting)
    repeat(5) {
      clock += 900
      session.onScan(offer, "uber")
    }
    assertEquals(1, channel.shown)
    assertEquals(listOf("uber"), recorded)
  }

  @Test
  fun depoisDeFecharOToqueEmAceitarContinuaRegistrando() {
    session.onScan(offer, "uber")
    session.dismiss()
    session.onTap("Aceitar", "uber")
    assertEquals(OfferStatus.ACCEPTED, outcomes.single().second.status)
  }

  @Test
  fun semToqueOCartaoFechaSozinho() {
    session.onScan(offer, "uber")
    scheduler.fire("expire")
    assertEquals(1, channel.hidden)
    assertFalse(session.presenting)
  }

  @Test
  fun avisaQuandoOCartaoAbreEFecha() {
    session.onScan(offer, "uber")
    assertEquals(1, presentationChanges)
    scheduler.fire("expire")
    assertEquals(2, presentationChanges)
  }

  @Test
  fun sairDoAppLiberaAOfertaLidaPorImagem() {
    session.onImageScan(offer, "uber")
    session.onSourceGone()
    session.onImageScan(offer, "uber")
    assertEquals(2, channel.shown)
    assertEquals(listOf("uber", "uber"), recorded)
  }

  @Test
  fun sairDoAppSemImagemNaoFechaAOferta() {
    session.onScan(offer, "uber")
    session.onSourceGone()
    assertEquals(0, channel.hidden)
  }

  @Test
  fun textoDoLucroNaoMostraANota() {
    val rated = OfferEvaluator.evaluate(offer.copy(passengerRating = 4.7), targets, "Uber")
    val line = format.profitLine(rated)
    assertTrue(line.startsWith("Lucro"))
    assertFalse(line.contains("★"))
  }

  @Test
  fun maisPernasAtualizaAOferta() {
    session.onScan(offer.copy(km = 2.0, legs = 1), "uber")
    session.onScan(offer.copy(km = 8.0, legs = 2), "uber")
    assertEquals(2, channel.shown)
    assertEquals(listOf("uber"), recorded)
  }

  @Test
  fun ofertaLidaPorImagemNaoFechaComLeituraVazia() {
    session.onImageScan(offer, "uber")
    session.onScan(null, "uber")
    assertFalse(scheduler.pending.containsKey("gone"))
    scheduler.fire("image_hold")
    assertEquals(1, channel.hidden)
  }

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
    val sessao = OfferSession({ canais }, { CopilotPreferences() }, { o, s -> OfferEvaluator.evaluate(o, targets, s) }, { _, _ -> 1L }, { _, _ -> }, scheduler)
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
    assertEquals("Uber. Nota 4,1. 2 e 16 por quilômetro.", format.spokenPhrase(result, PrimaryMetric.PER_KM))
    assertEquals("Uber. Nota 4,1. 9 e 90 de lucro.", format.spokenPhrase(result, PrimaryMetric.PROFIT))
  }

  @Test
  fun semTempoAHoraNaoEntraNaAvaliacao() {
    val result = OfferEvaluator.evaluate(ParsedOffer(1300, 4.3, 0), targets, "inDrive")
    assertEquals(null, result.hourOnTarget)
    assertEquals(OfferColor.GREEN, result.color)
    assertEquals("4,3 km", format.distanceAndTime(result))
    assertEquals(false, format.rates(result).contains("/h"))
  }

  @Test
  fun toqueEmAceitarRegistraAOfertaAtual() {
    session.onScan(offer, "uber")
    session.onTap("Aceitar por R$ 13", "uber")
    assertEquals(listOf(1L to OfferOutcome(OfferStatus.ACCEPTED)), outcomes)
  }

  @Test
  fun aceiteNaoMudaDepoisDeOutrosToques() {
    session.onScan(offer, "uber")
    session.onTap("Aceitar", "uber")
    session.onTap("Pular", "uber")
    assertEquals(1, outcomes.size)
  }

  @Test
  fun toqueSemOfertaNaoRegistra() {
    session.onTap("Aceitar", "uber")
    session.onScan(offer, "uber")
    session.onScan(null, "uber")
    scheduler.fire("gone")
    session.onTap("Aceitar", "uber")
    assertTrue(outcomes.isEmpty())
  }

  @Test
  fun recusaEDepoisAceiteFicaComOAceite() {
    session.onScan(offer, "uber")
    session.onTap("R$ 14,50", "uber")
    session.onTap("Aceitar", "uber")
    assertEquals(OfferStatus.ACCEPTED, outcomes.last().second.status)
  }

  @Test
  fun toqueEmOutroAppNaoRegistra() {
    session.onScan(offer, "uber")
    session.onTap("Aceitar", "99")
    assertTrue(outcomes.isEmpty())
  }

  @Test
  fun leiturasVaziasNaoAdiamOFimDaOferta() {
    session.onScan(offer, "uber")
    session.onScan(null, "uber")
    val firstTimer = scheduler.pending.getValue("gone")
    session.onScan(null, "uber")
    assertTrue(firstTimer === scheduler.pending.getValue("gone"))
  }

  @Test
  fun depoisDoPrazoOToqueNaoContaMais() {
    session.onScan(offer, "uber")
    scheduler.fire("tap_window")
    session.onTap("Aceitar", "uber")
    assertTrue(outcomes.isEmpty())
  }

  @Test
  fun kmQueMudaNaoRepeteAOferta() {
    session.onScan(offer, "uber")
    session.onScan(offer.copy(km = 12.0), "uber")
    assertEquals(1, channel.shown)
  }

  @Test
  fun umCanalComErroNaoDerrubaOsOutros() {
    val outro = FakeChannel()
    val quebrado = object : OfferChannel {
      override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) = throw IllegalStateException()
      override fun hide() = throw IllegalStateException()
    }
    val sessao = OfferSession({ listOf(quebrado, outro) }, { CopilotPreferences() }, { o, s -> OfferEvaluator.evaluate(o, targets, s) }, { _, _ -> 1L }, { _, _ -> }, scheduler)
    sessao.onScan(offer, "uber")
    assertEquals(1, outro.shown)
  }

  @Test
  fun toquesQueNaoSaoAceite() {
    listOf("Aceitar automaticamente", "Confirmar chegada", "Confirmar recusa", "Confirmar", "R$ 20,00 | 5 km | Aceitar").forEach {
      assertEquals(it, null, OfferOutcomeReader.fromTap(it))
    }
  }

  @Test
  fun vozFalaCentavosSemAmbiguidade() {
    val result = OfferEvaluator.evaluate(ParsedOffer(1025, 5.0, 19), targets, "")
    assertTrue(format.spokenPhrase(result, PrimaryMetric.PER_KM).contains("2 e 5").not())
    assertTrue(format.spokenPhrase(OfferEvaluator.evaluate(ParsedOffer(1025, 5.0, 19), targets, ""), PrimaryMetric.PER_KM).contains("2 reais e 5 centavos"))
  }

  @Test
  fun textosRepetidosNaoDobramOsNumeros() {
    assertEquals("R$ 20,00 | 5 km | 12 min | Aceitar", OfferParser.joinParts(listOf("R$ 20,00", "5 km", "5 km", "12 min", "12 min", " ", "Aceitar")))
  }

  @Test
  fun leituraDoToque() {
    assertEquals(OfferStatus.ACCEPTED, OfferOutcomeReader.fromTap("Aceitar por R$ 13")?.status)
    assertEquals(OfferStatus.DECLINED, OfferOutcomeReader.fromTap("Pular")?.status)
    assertEquals(OfferStatus.DECLINED, OfferOutcomeReader.fromTap("Não aceitar")?.status)
    assertEquals(OfferOutcome(OfferStatus.COUNTERED, 1450), OfferOutcomeReader.fromTap("R$ 14,50"))
    assertEquals(null, OfferOutcomeReader.fromTap("Aceitar | Pular"))
    assertEquals(null, OfferOutcomeReader.fromTap("R$ 3/km"))
    assertEquals(null, OfferOutcomeReader.fromTap("Mapa"))
  }

  @Test
  fun preferenciasSobrevivemAoJson() {
    val original = CopilotPreferences(voice = false, notification = true, primaryMetric = PrimaryMetric.PROFIT, cardSize = CardSize.EXTRA, theme = ThemeMode.DARK, durationSeconds = 8, monitoredPackages = setOf("a"), estimateEarnings = false)
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
  fun notificacaoMostraOrigemENossaNotaSemADoPassageiro() {
    val result = OfferEvaluator.evaluate(ParsedOffer(1840, 8.5, 19, 4.92), targets, "99")
    assertEquals("99 • Nota 4,1 • R$ 18,40", format.notificationTitle(result))
    assertFalse(format.notificationDetails(result).contains("★"))
    assertTrue(format.notificationDetails(result).contains("8% acima do mínimo"))
  }

  @Test
  fun rotuloDaOrigemVemDoPacote() {
    assertEquals("Uber", OfferSources.label("com.ubercab.driver"))
    assertEquals("99", OfferSources.label("com.app99.driver"))
    assertEquals("inDrive", OfferSources.label("sinet.startup.inDriver"))
    assertEquals("App", OfferSources.label("outro"))
  }
}
