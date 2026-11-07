package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class OfferParserLimitsTest {
  @Test
  fun trechoComMinutosGrandesDemaisDescartaAOfertaSemQuebrar() {
    assertNull(OfferParser.parse("UberX | R$ 18,40 | 99999999999 min (2,1 km) | 14 min (6,4 km)"))
  }

  @Test
  fun trechoValidoContinuaSendoLido() {
    assertEquals(1840L, OfferParser.parse("UberX | R$ 18,40 | 5 min (2,1 km) | 14 min (6,4 km)")?.valueCents)
  }

  @Test
  fun minutosGrandesDemaisSemTrechoNaoViramTempo() {
    assertNull(OfferParser.parse("Aceitar | R$ 20,00 | 99999999999 min | 5 km"))
  }
}
