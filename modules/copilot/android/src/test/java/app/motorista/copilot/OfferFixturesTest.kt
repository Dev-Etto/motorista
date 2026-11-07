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
      assertEquals(case.getString("reason"), testFormat().reason(result))
      if (case.isNull("score")) assertNull(result.score) else assertEquals(case.getDouble("score"), result.score!!, 0.001)
      assertEquals(case.getDouble("perKm"), result.perKmCents, 0.001)
      assertEquals(case.getDouble("perHour"), result.perHourCents, 0.001)
      if (case.isNull("profitCents")) assertNull(result.profitCents) else assertEquals(case.getDouble("profitCents"), result.profitCents!!, 0.001)
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
  fun telasSemValorNaoApagamAsLeiturasDeOferta() {
    OfferDiagnostics.enabled = true
    OfferDiagnostics.capture("R$ 13 Aceitar")
    repeat(20) { OfferDiagnostics.capture("tela".padEnd(it + 5, 'a')) }
    assertEquals("R$ 13 Aceitar", OfferDiagnostics.snapshot().first())
    assertEquals(6, OfferDiagnostics.snapshot().size)
    OfferDiagnostics.enabled = false
    assertEquals(0, OfferDiagnostics.snapshot().size)
  }

  @Test
  fun jornadaEsquecidaAvisaDepoisDoLimite() {
    val limit = 14 * 60 * 60 * 1000L
    assertEquals(1000L + limit, ForgottenShiftAlarm.triggerAt(0, 1000L))
    assertEquals(1000L + 1, ForgottenShiftAlarm.triggerAt(limit - 1, 1000L))
    assertNull(ForgottenShiftAlarm.triggerAt(limit, 1000L))
  }

  @Test
  fun diagnosticosEscondemNumerosPessoais() {
    val masked = OfferDiagnostics.mask("Maria (11) 91234-5678 Rua Augusta 1500 CPF 123.456.789-00 R$ 18,40 5 km 12 min 4,92")
    listOf("91234", "5678", "1500", "123.456").forEach { assertFalse(it, masked.contains(it)) }
    listOf("R$ 18,40", "5 km", "12 min", "4,92").forEach { assertEquals(it, true, masked.contains(it)) }
  }

  @Test
  fun diagnosticsNeverKeepWords() {
    val masked = OfferDiagnostics.mask("Maria Silva R$ 18,40 Rua Augusta 5 km Aceitar")
    assertFalse(masked.contains("Maria"))
    assertFalse(masked.contains("Augusta"))
    assertEquals("xxxxx xxxxx R$ 18,40 xxx xxxxxxx 5 km Aceitar", masked)
  }
}
