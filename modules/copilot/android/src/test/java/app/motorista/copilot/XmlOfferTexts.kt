package app.motorista.copilot

import java.io.File
import java.util.Locale
import javax.xml.parsers.DocumentBuilderFactory
import org.w3c.dom.Element

class XmlOfferTexts(folder: String = "values", private val locale: Locale = Locale.forLanguageTag("pt-BR")) : OfferTexts {
  private val document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(File("src/main/res/$folder/strings.xml"))
  private val strings = elements("string").associate { it.getAttribute("name") to unescape(it.textContent) }
  private val plurals = elements("plurals").associate { plural ->
    plural.getAttribute("name") to children(plural).associate { it.getAttribute("quantity") to unescape(it.textContent) }
  }

  override fun text(resId: Int, vararg args: Any): String = String.format(locale, strings.getValue(nameOf(R.string::class.java, resId)), *args)

  override fun quantity(resId: Int, count: Int, vararg args: Any): String {
    val forms = plurals.getValue(nameOf(R.plurals::class.java, resId))
    val quantity = if (isOne(count)) "one" else "other"
    return String.format(locale, forms[quantity] ?: forms.getValue("other"), *args)
  }

  private fun isOne(count: Int) = count == 1 || (count == 0 && locale.language == "pt")

  private fun elements(tag: String) = document.getElementsByTagName(tag).let { list -> (0 until list.length).map { list.item(it) as Element } }

  private fun children(parent: Element) = parent.getElementsByTagName("item").let { list -> (0 until list.length).map { list.item(it) as Element } }

  private fun nameOf(resources: Class<*>, resId: Int) = resources.fields.first { it.getInt(null) == resId }.name

  private fun unescape(text: String) = text.replace("\\'", "'").replace("\\\"", "\"")
}

fun testFormat(regional: RegionalSettings = RegionalSettings(), folder: String = "values") = OfferFormat(regional, XmlOfferTexts(folder, regional.language))
