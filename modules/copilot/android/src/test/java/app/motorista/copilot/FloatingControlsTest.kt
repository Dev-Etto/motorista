package app.motorista.copilot

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FloatingVisibilityTest {
  private val visibility = FloatingVisibility()

  @Test
  fun foraDoAppOBotaoAparece() = assertTrue(visibility.visible)

  @Test
  fun dentroDoAppOBotaoSome() {
    visibility.onAppForeground(true)
    assertFalse(visibility.visible)
  }

  @Test
  fun ocultarEscondeForaDoApp() {
    visibility.hideForNow()
    assertFalse(visibility.visible)
  }

  @Test
  fun continuaOcultoSemEntrarNoApp() {
    visibility.hideForNow()
    visibility.onAppForeground(false)
    assertFalse(visibility.visible)
  }

  @Test
  fun voltaDepoisDeEntrarESairDoApp() {
    visibility.hideForNow()
    visibility.onAppForeground(true)
    assertFalse(visibility.visible)
    visibility.onAppForeground(false)
    assertTrue(visibility.visible)
  }
}

class DismissZoneRuleTest {
  private val height = 2000

  @Test
  fun dedoNaParteDeBaixoEstaNaArea() = assertTrue(DismissZoneRule.contains(rawY = 1800f, screenHeight = height))

  @Test
  fun dedoNoRestoDaTelaEstaFora() = assertFalse(DismissZoneRule.contains(rawY = 1000f, screenHeight = height))

  @Test
  fun limiteDaAreaContaComoDentro() = assertTrue(DismissZoneRule.contains(rawY = 1640f, screenHeight = height))
}
