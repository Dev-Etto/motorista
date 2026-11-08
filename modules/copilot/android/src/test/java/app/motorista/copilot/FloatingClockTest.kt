package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Test

class FloatingClockTest {
  @Test
  fun botaoFechadoMostraHorasEMinutos() = assertEquals("2:14", OfferFormat.shortClock((2 * 3600 + 14 * 60 + 8) * 1000L))

  @Test
  fun menosDeUmaHoraComecaEmZero() = assertEquals("0:45", OfferFormat.shortClock(45 * 60 * 1000L))

  @Test
  fun painelAbertoMantemOsSegundos() = assertEquals("02:14:08", OfferFormat.clock((2 * 3600 + 14 * 60 + 8) * 1000L))
}
