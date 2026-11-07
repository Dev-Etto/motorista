package app.motorista.copilot

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test

class OfferFormatRegionalTest {
  private val targets = OfferTargets(90.0, 200.0, 3000.0)
  private val offer = ParsedOffer(184000, 8.5, 19)

  @Test
  fun preferenciasAntigasFicamEmPortuguesRealEKm() {
    val preferences = CopilotPreferences.fromJson("""{"voice":true}""")
    assertEquals(RegionalSettings(), preferences.regional)
    assertEquals("pt-BR", preferences.regional.formatLocale)
    assertEquals("BRL", preferences.regional.currencyCode)
    assertEquals(DistanceUnit.KM, preferences.regional.distanceUnit)
  }

  @Test
  fun preferenciasLevamOPerfilDeIdaEVolta() {
    val regional = RegionalSettings("en", "en-US", "USD", DistanceUnit.MI)
    val read = CopilotPreferences.fromJson(CopilotPreferences(regional = regional).toJson())
    assertEquals(regional, read.regional)
  }

  @Test
  fun moedaInvalidaVoltaParaReal() {
    val read = RegionalSettings.from(JSONObject("""{"currencyCode":"real","distanceUnit":"léguas"}"""))
    assertEquals("BRL", read.currencyCode)
    assertEquals(DistanceUnit.KM, read.distanceUnit)
  }

  @Test
  fun dinheiroEmCadaRegiao() {
    val cases = listOf(
      RegionalSettings("pt-BR", "pt-BR", "BRL") to listOf("R$ 1.840,00", "R$ 92", "-R$ 12,34"),
      RegionalSettings("en", "en-US", "USD") to listOf("$1,840.00", "$92", "-$12.34"),
      RegionalSettings("es", "es-MX", "MXN") to listOf("$1,840.00", "$92", "-$12.34"),
      RegionalSettings("es", "es-ES", "EUR") to listOf("1.840,00 €", "92 €", "-12,34 €"),
    )
    cases.forEach { (regional, expected) ->
      val format = testFormat(regional)
      assertEquals(regional.formatLocale, expected, listOf(format.money(184000.0), format.wholeMoney(9150.0), format.money(-1234.0)))
    }
  }

  @Test
  fun distanciaEPrecoPorMilha() {
    val format = testFormat(RegionalSettings("pt-BR", "en-US", "USD", DistanceUnit.MI))
    val result = OfferEvaluator.evaluate(offer, targets, "Uber")
    assertEquals("5.3 mi • 19 min", format.distanceAndTime(result))
    assertEquals("$348.38/mi", format.summary(result, PrimaryMetric.PER_KM))
    assertEquals("Por mi", format.perDistanceLabel())
  }

  @Test
  fun motivoEVozSeguemAUnidade() {
    val format = testFormat(RegionalSettings(distanceUnit = DistanceUnit.MI))
    val belowCost = OfferEvaluator.evaluate(ParsedOffer(500, 10.0, 19), targets, "")
    assertEquals("Não cobre seu custo por mi", format.reason(belowCost))
    val result = OfferEvaluator.evaluate(ParsedOffer(1600, 1.609344, 0), targets, "")
    assertEquals("16 reais por milha.", format.spokenPhrase(result, PrimaryMetric.PER_KM).substringAfter(". "))
  }

  @Test
  fun moedaSemNomeFaladoLeOValorFormatado() {
    val format = testFormat(RegionalSettings("pt-BR", "pt-BR", "GBP"))
    val result = OfferEvaluator.evaluate(ParsedOffer(1000, 5.0, 0), targets, "")
    assertEquals("£ 2,00 por quilômetro.", format.spokenPhrase(result, PrimaryMetric.PER_KM).substringAfter(". "))
  }

  @Test
  fun umRealNoSingular() {
    val format = testFormat()
    val result = OfferEvaluator.evaluate(ParsedOffer(100, 1.0, 0), OfferTargets(0.5, 10.0, 3000.0), "")
    assertEquals("1 real por quilômetro.", format.spokenPhrase(result, PrimaryMetric.PER_KM).substringAfter(". "))
  }

  @Test
  fun preferenciasSemPerfilMantemOPerfilAtual() {
    val current = CopilotPreferences(regional = RegionalSettings("en", "en-US", "USD", DistanceUnit.MI))
    val merged = CopilotPreferences.merge("""{"voice":false}""", current)
    assertEquals(current.regional, merged.regional)
    assertEquals(false, merged.voice)
  }

  @Test
  fun perfilIlegivelVoltaAoPadrao() {
    assertEquals(RegionalSettings(), RegionalSettings.parse("{quebrado"))
  }
}
