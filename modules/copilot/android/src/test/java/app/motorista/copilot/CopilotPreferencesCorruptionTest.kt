package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Test

class CopilotPreferencesCorruptionTest {
  @Test
  fun jsonQuebradoVoltaAoPadrao() {
    assertEquals(CopilotPreferences(), CopilotPreferences.fromJson("{quebrado"))
  }

  @Test
  fun listaNoLugarDoObjetoVoltaAoPadrao() {
    assertEquals(CopilotPreferences(), CopilotPreferences.fromJson("[]"))
  }

  @Test
  fun pacoteQueNaoETextoVoltaAoPadrao() {
    assertEquals(CopilotPreferences(), CopilotPreferences.fromJson("""{"monitoredPackages":[{"a":1}]}"""))
  }

  @Test
  fun pacoteForaDasPlataformasSuportadasNaoELido() {
    val uber = OfferSources.packages.first()
    val packages = CopilotPreferences.fromJson("""{"monitoredPackages":["$uber","com.whatsapp"]}""").monitoredPackages
    assertEquals(setOf(uber), packages)
  }

  @Test
  fun preferenciaValidaContinuaSendoLida() {
    assertEquals(false, CopilotPreferences.fromJson("""{"voice":false}""").voice)
  }
}
