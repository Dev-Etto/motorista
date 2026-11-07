package app.motorista.copilot

import android.content.Context
import android.content.res.Configuration
import java.util.Currency
import java.util.Locale
import org.json.JSONObject

enum class DistanceUnit(val id: String, val kmPerUnit: Double) {
  KM("km", 1.0),
  MI("mi", 1.609344);

  companion object {
    fun from(id: String) = entries.firstOrNull { it.id == id } ?: KM
  }
}

data class RegionalSettings(
  val languageTag: String = DEFAULT_LANGUAGE,
  val formatLocale: String = DEFAULT_LANGUAGE,
  val currencyCode: String = DEFAULT_CURRENCY,
  val distanceUnit: DistanceUnit = DistanceUnit.KM,
) {
  val language: Locale
    get() = Locale.forLanguageTag(languageTag)

  val locale: Locale
    get() = Locale.forLanguageTag(formatLocale)

  val currency: Currency
    get() = runCatching { Currency.getInstance(currencyCode) }.getOrDefault(Currency.getInstance(DEFAULT_CURRENCY))

  fun toJson(): JSONObject = JSONObject()
    .put("languageTag", languageTag)
    .put("formatLocale", formatLocale)
    .put("currencyCode", currencyCode)
    .put("distanceUnit", distanceUnit.id)

  companion object {
    private const val DEFAULT_LANGUAGE = "pt-BR"
    private const val DEFAULT_CURRENCY = "BRL"
    private val CURRENCY_CODE = Regex("^[A-Z]{3}$")

    fun parse(raw: String?): RegionalSettings = from(runCatching { JSONObject(raw.orEmpty()) }.getOrNull())

    fun from(json: JSONObject?): RegionalSettings {
      if (json == null) return RegionalSettings()

      return RegionalSettings(
        languageTag = json.optString("languageTag").ifBlank { DEFAULT_LANGUAGE },
        formatLocale = json.optString("formatLocale").ifBlank { DEFAULT_LANGUAGE },
        currencyCode = json.optString("currencyCode").takeIf { CURRENCY_CODE.matches(it) } ?: DEFAULT_CURRENCY,
        distanceUnit = DistanceUnit.from(json.optString("distanceUnit")),
      )
    }
  }
}

fun Context.localized(regional: RegionalSettings): Context {
  val configuration = Configuration(resources.configuration).apply { setLocale(regional.language) }
  return createConfigurationContext(configuration)
}

fun Context.copilotText(resId: Int): String = localized(CopilotStore.get(this).preferences.regional).getString(resId)
