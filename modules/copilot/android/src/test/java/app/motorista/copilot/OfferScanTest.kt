package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class OfferScanTest {
  private class ManualScheduler : OfferScheduler {
    val pending = linkedMapOf<String, Pair<Long, () -> Unit>>()

    override fun schedule(key: String, delayMs: Long, action: () -> Unit) {
      pending[key] = delayMs to action
    }

    override fun cancel(key: String) {
      pending.remove(key)
    }

    fun fire(key: String) = pending.remove(key)?.second?.invoke()
  }

  private var clock = 10_000L
  private var scans = 0
  private val scheduler = ManualScheduler()
  private val pacer = ScanPacer(scheduler, { clock }, { 300L }, { scans++ })

  @Test
  fun eventosSeguidosNaoAdiamAVarredura() {
    pacer.request()
    val firstDelay = scheduler.pending.getValue("scan").first
    repeat(50) {
      clock += 100
      pacer.request()
    }
    assertEquals(firstDelay, scheduler.pending.getValue("scan").first)
    scheduler.fire("scan")
    assertEquals(1, scans)
  }

  @Test
  fun respeitaOIntervaloEntreVarreduras() {
    pacer.request()
    scheduler.fire("scan")
    clock += 100
    pacer.request()
    assertEquals(200L, scheduler.pending.getValue("scan").first)
  }

  @Test
  fun rajadaRepeteAteAcabarOPrazo() {
    pacer.startBurst()
    repeat(3) {
      scheduler.fire("scan")
      clock += 300
    }
    assertEquals(3, scans)
    assertTrue(scheduler.pending.containsKey("scan"))
    clock += 9000
    scheduler.fire("scan")
    assertFalse(scheduler.pending.containsKey("scan"))
  }

  @Test
  fun pararARajadaEncerraAsRepeticoes() {
    pacer.startBurst()
    pacer.stopBurst()
    scheduler.fire("scan")
    assertFalse(scheduler.pending.containsKey("scan"))
  }

  @Test
  fun vigiarEncerraARajadaMasAgendaNovaLeitura() {
    pacer.startBurst()
    scheduler.fire("scan")
    pacer.watch()
    assertFalse(pacer.bursting)
    assertTrue(scheduler.pending.containsKey("scan"))
    scheduler.fire("scan")
    assertEquals(2, scans)
    assertFalse(scheduler.pending.containsKey("scan"))
  }

  @Test
  fun textoRepetidoEmPontosDiferentesContinua() {
    val text = ScreenText.join(listOf(TextPiece("5 min", 0, 0, 10, 10), TextPiece("5 min", 0, 50, 10, 60)))
    assertEquals("5 min | 5 min", text)
  }

  @Test
  fun textoDoPaiEDoFilhoContaUmaVez() {
    val text = ScreenText.join(listOf(TextPiece("5 min", 0, 0, 100, 100), TextPiece("5 min", 10, 10, 20, 20)))
    assertEquals("5 min", text)
  }

  @Test
  fun segueAOrdemDaTelaEIgnoraOTopo() {
    val pieces = listOf(TextPiece("Aceitar", 0, 900, 10, 950), TextPiece("R$ 10,00", 0, 500, 10, 550), TextPiece("R$ 120,00", 0, 10, 10, 60))
    assertEquals("R$ 10,00 | Aceitar", ScreenText.join(pieces, ignoreAboveY = 300))
  }

  @Test
  fun leituraDeImagemCorrigeOSimboloDoReal() {
    assertEquals("R$ 18,40 | 5 min", OfferParser.fromImageText("RS 18,40 | 5 min"))
  }

  @Test
  fun soADistanciaAteOPassageiroContaComoParcial() {
    assertTrue(OfferParser.isPartial("~2,2 km | R$ 13 | Aceitar por R$ 13"))
  }

  @Test
  fun leituraSoDaBuscaContaComoParcial() {
    assertTrue(OfferParser.isPartial("UberX | R$ 18,40 | 5 min (2,1 km) de distância | Aceitar"))
  }

  @Test
  fun cartaoDaUberSemBotaoEhOferta() {
    assertEquals(1840L, OfferParser.parse("UberX | R$ 18,40 | 5 min (2,1 km) | 14 min (6,4 km)")?.valueCents)
  }
}
