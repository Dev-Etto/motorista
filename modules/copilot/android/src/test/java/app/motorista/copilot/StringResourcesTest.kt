package app.motorista.copilot

import java.io.File
import javax.xml.parsers.DocumentBuilderFactory
import org.junit.Assert.assertEquals
import org.junit.Test
import org.w3c.dom.Element

class StringResourcesTest {
  private val specifier = Regex("%(\\d+\\$)?[sd%]")

  private fun entries(folder: String): Map<String, List<String>> {
    val document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(File("src/main/res/$folder/strings.xml"))
    val strings = document.getElementsByTagName("string").let { list -> (0 until list.length).map { list.item(it) as Element } }
    val plurals = document.getElementsByTagName("item").let { list -> (0 until list.length).map { list.item(it) as Element } }
    val named = strings.associate { it.getAttribute("name") to specifier.findAll(it.textContent).map { match -> match.value }.toList().sorted() }
    val quantities = plurals.associate {
      "${(it.parentNode as Element).getAttribute("name")}:${it.getAttribute("quantity")}" to specifier.findAll(it.textContent).map { match -> match.value }.toList()
    }
    return named + quantities
  }

  @Test
  fun traducoesTemOsMesmosNomesEFormatosDoPortugues() {
    val source = entries("values")
    listOf("values-en", "values-es").forEach { folder -> assertEquals(folder, source, entries(folder)) }
  }

  @Test
  fun vozEmInglesComDolarEMilha() {
    val format = testFormat(RegionalSettings("en", "en-US", "USD", DistanceUnit.MI), "values-en")
    val result = OfferEvaluator.evaluate(ParsedOffer(1600, 1.609344, 0), OfferTargets(90.0, 200.0, 3000.0), "Uber")
    assertEquals("16 dollars per mile.", format.spokenPhrase(result, PrimaryMetric.PER_KM).substringAfter(". ").substringAfter(". "))
  }

  @Test
  fun vozEmEspanholComPeso() {
    val format = testFormat(RegionalSettings("es", "es-MX", "MXN"), "values-es")
    val result = OfferEvaluator.evaluate(ParsedOffer(105, 1.0, 0), OfferTargets(0.5, 10.0, 3000.0), "")
    assertEquals("1 peso con 5 centavos por kilómetro.", format.spokenPhrase(result, PrimaryMetric.PER_KM).substringAfter(". "))
  }
}
