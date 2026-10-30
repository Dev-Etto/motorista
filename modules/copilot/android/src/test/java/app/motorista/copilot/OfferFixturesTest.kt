package app.motorista.copilot

import java.io.File
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

class OfferFixturesTest {
  private val fixtures = JSONObject(File("../fixtures/offers.json").readText())

  @Test
  fun classificationMatchesSharedFixtures() {
    val cases = fixtures.getJSONArray("classification")
    for (index in 0 until cases.length()) {
      val case = cases.getJSONObject(index)
      val offer = ParsedOffer(case.getLong("valueCents"), case.getDouble("km"), case.getInt("minutes"))
      val targets = OfferTargets(case.getDouble("costPerKm"), case.getDouble("targetPerKmCents"), case.getDouble("targetPerHourCents"))
      val result = OfferEvaluator.evaluate(offer, targets)
      assertEquals(case.getString("color"), result.color.id)
      assertEquals(case.getString("reason"), result.reason)
      if (case.isNull("score")) assertNull(result.score) else assertEquals(case.getDouble("score"), result.score!!, 0.001)
    }
  }

  @Test
  fun parsingMatchesSharedFixtures() {
    val cases = fixtures.getJSONArray("parsing")
    for (index in 0 until cases.length()) {
      val case = cases.getJSONObject(index)
      val parsed = OfferParser.parse(case.getString("text"))
      if (case.optBoolean("none")) {
        assertNull(case.getString("text"), parsed)
        continue
      }
      assertEquals(case.getLong("valueCents"), parsed!!.valueCents)
      assertEquals(case.getDouble("km"), parsed.km, 0.001)
      assertEquals(case.getInt("minutes"), parsed.minutes)
      if (case.isNull("rating")) assertNull(parsed.passengerRating) else assertEquals(case.getDouble("rating"), parsed.passengerRating!!, 0.001)
    }
  }

  @Test
  fun diagnosticsNeverKeepWords() {
    val masked = OfferDiagnostics.mask("Maria Silva R$ 18,40 Rua Augusta 5 km Aceitar")
    assertFalse(masked.contains("Maria"))
    assertFalse(masked.contains("Augusta"))
    assertEquals("xxxxx xxxxx R$ 18,40 xxx xxxxxxx 5 km Aceitar", masked)
  }
}
