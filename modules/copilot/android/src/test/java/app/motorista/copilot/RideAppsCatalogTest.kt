package app.motorista.copilot

import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.File

class RideAppsCatalogTest {
  private val catalog = JSONArray(File("../rideApps.json").readText())

  private fun color(hex: String) = (0xFF000000 or hex.removePrefix("#").toLong(16)).toInt()

  @Test
  fun catalogoDoAppEDoCopilotSaoOMesmo() {
    assertEquals(catalog.length(), OfferSources.packages.size)
    for (index in 0 until catalog.length()) {
      val app = catalog.getJSONObject(index)
      val packageName = app.getString("packageName")
      val style = OfferSources.style(app.getString("label"))
      assertEquals(app.getString("label"), OfferSources.label(packageName))
      assertEquals(color(app.getString("background")), style.background)
      assertEquals(color(app.getString("text")), style.text)
    }
  }
}
