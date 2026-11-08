package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Test

class FloatingClockTest {
  @Test
  fun botaoFechadoMostraHorasEMinutos() = assertEquals("2H:14", OfferFormat.shortClock((2 * 3600 + 14 * 60 + 8) * 1000L))

  @Test
  fun horaCheiaMostraZeroMinutos() = assertEquals("2H:00", OfferFormat.shortClock(2 * 3600 * 1000L))

  @Test
  fun primeiraHoraMostraMinutosESegundos() {
    assertEquals("0M:08", OfferFormat.shortClock(8 * 1000L))
    assertEquals("45M:12", OfferFormat.shortClock((45 * 60 + 12) * 1000L))
  }

  @Test
  fun depoisDeUmDiaMostraMaisDe24h() = assertEquals("24H+", OfferFormat.shortClock(24 * 3600 * 1000L))

  @Test
  fun painelAbertoMantemOsSegundos() = assertEquals("02:14:08", OfferFormat.clock((2 * 3600 + 14 * 60 + 8) * 1000L))
}
