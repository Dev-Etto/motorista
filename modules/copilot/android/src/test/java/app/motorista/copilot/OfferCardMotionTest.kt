package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class OfferCardMotionTest {
  private val pill = ScreenRect(x = 100, y = 400, width = 300, height = 120)

  @Test
  fun cartaoComecaNoTamanhoDoBotao() {
    val motion = OfferCardMotion.from(pill, ScreenRect(x = 60, y = 400, width = 1000, height = 600))
    assertEquals(0.3f, motion.scaleX, 0.001f)
    assertEquals(0.2f, motion.scaleY, 0.001f)
  }

  @Test
  fun cresceAPartirDoCentroDoBotao() {
    val motion = OfferCardMotion.from(pill, ScreenRect(x = 60, y = 400, width = 1000, height = 600))
    assertEquals(190f, motion.pivotX, 0.001f)
    assertEquals(60f, motion.pivotY, 0.001f)
  }

  @Test
  fun cartaoLongeDoBotaoCresceDoPontoMaisProximo() {
    val motion = OfferCardMotion.from(pill, ScreenRect(x = 60, y = 1500, width = 1000, height = 600))
    assertEquals(0f, motion.pivotY, 0.001f)
  }

  @Test
  fun escalaNuncaPassaDoTamanhoFinal() {
    val motion = OfferCardMotion.from(ScreenRect(0, 0, 2000, 900), ScreenRect(0, 0, 1000, 600))
    assertEquals(1f, motion.scaleX, 0.001f)
    assertEquals(1f, motion.scaleY, 0.001f)
  }

  @Test
  fun cartaoNaoEntraNoTercoInferior() {
    assertEquals(1300, OfferCardMotion.defaultCardY(pillY = 1900, cardHeight = 700, screenHeight = 3000))
  }

  @Test
  fun cartaoFicaAoLadoDoBotaoQuandoCabe() {
    assertEquals(400, OfferCardMotion.defaultCardY(pillY = 400, cardHeight = 700, screenHeight = 3000))
  }

  @Test
  fun cartaoMaiorQueOEspacoFicaNoTopo() {
    assertEquals(0, OfferCardMotion.defaultCardY(pillY = 400, cardHeight = 2500, screenHeight = 3000))
  }

  @Test
  fun aberturaEFechamentoSaoCurtos() {
    assertTrue(OfferCardMotion.OPEN_MS <= 220)
    assertTrue(OfferCardMotion.CLOSE_MS <= OfferCardMotion.OPEN_MS)
  }
}
