package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class OfferReadPolicyTest {
  private val uber = OfferSources.UBER
  private val ninetyNine = OfferSources.NINETY_NINE
  private val indrive = OfferSources.INDRIVE
  private val allowed = ImageReadRequest(
    enabled = true,
    source = uber,
    offerFound = false,
    changed = true,
    bursting = false,
    presenting = false,
    recentlyActive = true,
    inTrip = false,
  )

  @Test
  fun imagemLigadaESemOfertaPodeLer() = assertTrue(OfferReadPolicy.shouldReadImage(allowed))

  @Test
  fun opcaoDesligadaNaoLeImagem() = assertFalse(OfferReadPolicy.shouldReadImage(allowed.copy(enabled = false)))

  @Test
  fun imagemValeSoParaUberE99() {
    assertTrue(OfferReadPolicy.shouldReadImage(allowed.copy(source = ninetyNine)))
    assertFalse(OfferReadPolicy.shouldReadImage(allowed.copy(source = indrive)))
    assertFalse(OfferReadPolicy.shouldReadImage(allowed.copy(source = "")))
  }

  @Test
  fun ofertaNoTextoDispensaImagem() = assertFalse(OfferReadPolicy.shouldReadImage(allowed.copy(offerFound = true)))

  @Test
  fun cartaoAbertoDispensaImagem() = assertFalse(OfferReadPolicy.shouldReadImage(allowed.copy(presenting = true)))

  @Test
  fun appInativoDispensaImagem() = assertFalse(OfferReadPolicy.shouldReadImage(allowed.copy(recentlyActive = false)))

  @Test
  fun viagemDispensaImagem() = assertFalse(OfferReadPolicy.shouldReadImage(allowed.copy(inTrip = true)))

  @Test
  fun semMudancaSoLeDentroDaRajada() {
    assertFalse(OfferReadPolicy.shouldReadImage(allowed.copy(changed = false)))
    assertTrue(OfferReadPolicy.shouldReadImage(allowed.copy(changed = false, bursting = true)))
  }

  @Test
  fun intervaloDependeDaTela() {
    assertEquals(300L, OfferReadPolicy.scanIntervalMs(presenting = false, inTrip = false))
    assertEquals(900L, OfferReadPolicy.scanIntervalMs(presenting = true, inTrip = false))
    assertEquals(900L, OfferReadPolicy.scanIntervalMs(presenting = false, inTrip = false, offerOnScreen = true))
    assertEquals(1000L, OfferReadPolicy.scanIntervalMs(presenting = false, inTrip = true))
    assertEquals(1000L, OfferReadPolicy.scanIntervalMs(presenting = true, inTrip = true))
  }

  @Test
  fun topoIgnoradoSoNaUberNaLeituraDeTexto() {
    assertEquals(300, OfferReadPolicy.ignoredTextTopY(uber, 2000))
    assertEquals(0, OfferReadPolicy.ignoredTextTopY(ninetyNine, 2000))
  }

  @Test
  fun recorteDaImagemUsaOMesmoTopo() = assertEquals(300, OfferReadPolicy.imageTopY(2000))

  @Test
  fun reconheceTelaDeViagem() {
    listOf("Iniciar corrida", "Finalizar corrida", "Concluir viagem", "Cheguei", "Chegou ao destino", "Encerrar a viagem").forEach {
      assertTrue(it, OfferReadPolicy.isInTrip(it))
    }
    listOf("Nova corrida", "Viagem de 14 min (6,4 km)", "Aceitar", "Procurando viagens").forEach {
      assertFalse(it, OfferReadPolicy.isInTrip(it))
    }
  }
}

class OfferTextTrackerTest {
  private val tracker = OfferTextTracker()
  private val complete = "R$ 18,40 | 5 min (2,1 km) | Viagem de 14 min (6,4 km) | Aceitar"
  private val partialA = "15 | R$ 18,40 | 5 min (2,1 km) de distância | Aceitar"
  private val partialB = "14 | R$ 18,40 | 5 min (2,1 km) de distância | Aceitar"

  @Test
  fun textoRepetidoMantemAOferta() {
    assertEquals(1840L, tracker.read(complete).offer?.valueCents)
    val repeated = tracker.read(complete)
    assertFalse(repeated.changed)
    assertEquals(1840L, repeated.offer?.valueCents)
  }

  @Test
  fun textoNovoSemOfertaLimpaAOferta() {
    tracker.read(complete)
    val next = tracker.read("Procurando viagens")
    assertTrue(next.changed)
    assertNull(next.offer)
  }

  @Test
  fun incompletaContaUmaVezMesmoComContador() {
    assertTrue(tracker.read(partialA).countFailure)
    assertFalse(tracker.read(partialB).countFailure)
    assertFalse(tracker.read(partialA).countFailure)
  }

  @Test
  fun voltaAContarDepoisDeOutraTela() {
    assertTrue(tracker.read(partialA).countFailure)
    assertFalse(tracker.read("Procurando viagens").countFailure)
    assertTrue(tracker.read(partialB).countFailure)
  }

  @Test
  fun ofertaTemPrioridadeSobreAMarcaDeViagem() {
    assertTrue(tracker.read("Finalizar corrida | 12 min").inTrip)
    assertFalse(tracker.read("Finalizar corrida | $complete").inTrip)
  }

  @Test
  fun depoisDeLimparOMesmoTextoContaComoNovo() {
    tracker.read(complete)
    tracker.reset()
    assertTrue(tracker.read(complete).changed)
  }
}

class WindowEventGateTest {
  private var clock = 10_000L
  private val gate = WindowEventGate { clock }

  @Test
  fun semMudancaPropriaAbreRajada() = assertTrue(gate.allowsBurst())

  @Test
  fun mudancaDoProprioCartaoNaoAbreRajada() {
    gate.noteOwnWindowChange()
    clock += 500
    assertFalse(gate.allowsBurst())
    clock += 600
    assertTrue(gate.allowsBurst())
  }
}

class CopilotPreferencesTest {
  @Test
  fun leituraPorImagemNasceDesligada() {
    assertFalse(CopilotPreferences().imageReading)
    assertFalse(CopilotPreferences.fromJson(null).imageReading)
    assertFalse(CopilotPreferences.fromJson("""{"voice":true}""").imageReading)
  }

  @Test
  fun leituraPorImagemFicaSalva() {
    val saved = CopilotPreferences(imageReading = true).toJson()
    assertTrue(CopilotPreferences.fromJson(saved).imageReading)
  }

  @Test
  fun botaoFlutuanteNasceLigado() {
    assertTrue(CopilotPreferences().floatingButton)
    assertTrue(CopilotPreferences.fromJson(null).floatingButton)
    assertTrue(CopilotPreferences.fromJson("""{"voice":true}""").floatingButton)
  }

  @Test
  fun botaoFlutuanteDesligadoFicaSalvo() {
    val saved = CopilotPreferences(floatingButton = false).toJson()
    assertFalse(CopilotPreferences.fromJson(saved).floatingButton)
  }

  @Test
  fun pacotesPadraoVemDasFontes() = assertEquals(OfferSources.packages, CopilotPreferences.DEFAULT_PACKAGES)
}
