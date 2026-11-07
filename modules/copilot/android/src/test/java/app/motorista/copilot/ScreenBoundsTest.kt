package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Test

class ScreenBoundsTest {
  private val screen = ScreenSize(1080, 2400)

  @Test
  fun posicaoDentroDaTelaNaoMuda() {
    assertEquals(100 to 200, ScreenBounds.clamp(100, 200, 300, 400, screen))
  }

  @Test
  fun janelaQueSairiaPelaDireitaOuPorBaixoEncostaNaBorda() {
    assertEquals(780 to 2000, ScreenBounds.clamp(5000, 5000, 300, 400, screen))
  }

  @Test
  fun posicaoNegativaVaiParaZero() {
    assertEquals(0 to 0, ScreenBounds.clamp(-50, -10, 300, 400, screen))
  }

  @Test
  fun janelaMaiorQueATelaFicaNoZero() {
    assertEquals(0 to 0, ScreenBounds.clamp(10, 10, 2000, 3000, screen))
  }

  @Test
  fun botaoNaoDesceAbaixoDoTercoInferior() {
    assertEquals(1500, ScreenBounds.pillY(5000, screen.height, touchTarget = 100))
    assertEquals(300, ScreenBounds.pillY(300, screen.height, touchTarget = 100))
  }
}
