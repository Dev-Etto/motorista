package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TripTimeEstimatorTest {
  private val targets = OfferTargets(100.0, 200.0, 3000.0)
  private val format = testFormat()

  @Test
  fun poucasAmostrasUsamAVelocidadePadrao() {
    val samples = List(4) { TripSample(10.0, 20) }
    assertEquals(TripTimeEstimator.DEFAULT_KMH, TripTimeEstimator.speedKmh(samples), 0.001)
  }

  @Test
  fun velocidadeEhAMedianaDoHistorico() {
    val samples = listOf(TripSample(10.0, 30), TripSample(10.0, 20), TripSample(10.0, 15), TripSample(5.0, 10), TripSample(20.0, 60), TripSample(0.0, 10), TripSample(4.0, 0))
    assertEquals(30.0, TripTimeEstimator.speedKmh(samples), 0.001)
  }

  @Test
  fun velocidadeForaDoRazoavelFicaNoLimite() {
    assertEquals(60.0, TripTimeEstimator.speedKmh(List(5) { TripSample(100.0, 10) }), 0.001)
    assertEquals(10.0, TripTimeEstimator.speedKmh(List(5) { TripSample(1.0, 60) }), 0.001)
  }

  @Test
  fun ofertaSemTempoGanhaTempoEstimado() {
    val estimated = TripTimeEstimator.withEstimatedTime(ParsedOffer(1300, 4.3, 0), 25.0)
    assertEquals(10, estimated.minutes)
    assertTrue(estimated.minutesEstimated)
  }

  @Test
  fun ofertaComTempoNaoMuda() {
    val offer = ParsedOffer(1300, 4.3, 12)
    assertEquals(offer, TripTimeEstimator.withEstimatedTime(offer, 25.0))
  }

  @Test
  fun tempoEstimadoApareceComTil() {
    val offer = TripTimeEstimator.withEstimatedTime(ParsedOffer(1300, 4.3, 0), 25.0)
    val result = OfferEvaluator.evaluate(offer, targets, "inDrive")
    assertEquals("4,3 km • ~10 min", format.distanceAndTime(result))
    assertEquals("~R$ 78", format.perHour(result))
    assertTrue(format.rates(result).endsWith("~R$ 78/h"))
    assertFalse(result.hourOnTarget == null)
  }

  @Test
  fun tempoEstimadoLimitaANotaComoOfertaSemTempo() {
    val offer = ParsedOffer(3000, 8.0, 0)
    val estimated = OfferEvaluator.evaluate(TripTimeEstimator.withEstimatedTime(offer, 25.0), targets)
    val read = OfferEvaluator.evaluate(offer.copy(minutes = 19), targets)
    assertEquals(OfferColor.GREEN, estimated.color)
    assertEquals(4.0, estimated.score!!, 0.001)
    assertEquals(5.0, read.score!!, 0.001)
  }

  @Test
  fun cartaoTemUmaDescricaoSemSetas() {
    val result = OfferEvaluator.evaluate(ParsedOffer(1300, 4.3, 12), targets, "inDrive")
    val description = format.cardDescription(result)
    assertTrue(description.startsWith("inDrive"))
    assertTrue(description.contains("R$ 13,00"))
    assertFalse(description.contains("▲") || description.contains("▼") || description.contains("\n"))
  }

  @Test
  fun tempoLidoNaoTemTil() {
    val result = OfferEvaluator.evaluate(ParsedOffer(1300, 4.3, 12), targets, "inDrive")
    assertEquals("4,3 km • 12 min", format.distanceAndTime(result))
    assertEquals("R$ 65", format.perHour(result))
  }
}
