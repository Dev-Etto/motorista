package app.motorista.copilot

data class ParsedOffer(val valueCents: Long, val km: Double, val minutes: Int, val passengerRating: Double? = null)

object OfferParser {
  private const val MAX_LEGS = 2
  private const val MIN_VALUE_CENTS = 200L
  private const val MAX_VALUE_CENTS = 200000L
  private val money = Regex("""(?<!\+)(?<!\+\s)R\$\s*(\d{1,3}(?:\.\d{3})+,\d{2}|\d+(?:[.,]\d{1,2})?)(?![.,]?\d)(?!\s*(?:/|por\s)\s*(?:km|h\b|hora|min))""", RegexOption.IGNORE_CASE)
  private val perKmRate = Regex("""R\$\s*(\d+(?:[.,]\d{1,2})?)\s*(?:/|por\s)\s*km\b""", RegexOption.IGNORE_CASE)
  private val kilometers = Regex("""(\d+(?:[.,]\d+)?)\s*km\b""", RegexOption.IGNORE_CASE)
  private val meters = Regex("""(?<![\d.,])(\d+)\s*m\b""", RegexOption.IGNORE_CASE)
  private val hours = Regex("""(\d+)\s*h(?:\s*(\d+)\s*min)?\b""", RegexOption.IGNORE_CASE)
  private val minutes = Regex("""(\d+)\s*min\b(?!\.)""", RegexOption.IGNORE_CASE)
  private val starredRating = Regex("""(?:★|⭐)\s*([1-5](?:[.,]\d{1,2})?)|([1-5][.,]\d{1,2})\s*(?:★|⭐)""")
  private val plainRating = Regex("""(?<![\d.,+])([1-5][.,]\d{2})(?![\d.,]|\s*x)""", RegexOption.IGNORE_CASE)
  private val allMoney = Regex("""\+?\s*R\$\s*[\d.,]+""")
  private val action = Regex("""aceitar|selecionar|corresponder|confirmar|accept|match""", RegexOption.IGNORE_CASE)

  fun parse(text: String): ParsedOffer? {
    if (!action.containsMatchIn(text)) return null

    val value = parseValue(text) ?: return null
    val rate = parseRate(text)
    val km = if (rate == null) parseKm(text) else totalKmFromRate(value, rate)
    if (km <= 0.0) return null

    val totalMinutes = parseMinutes(text)
    if (totalMinutes <= 0 && rate == null) return null

    return ParsedOffer(value, km, totalMinutes, parseRating(text))
  }

  fun isPartial(text: String): Boolean {
    if (!action.containsMatchIn(text)) return false
    if (!money.containsMatchIn(text)) return false
    return parse(text) == null
  }

  private fun parseRating(text: String): Double? {
    val starred = starredRating.find(text)
    if (starred != null) return toDecimal(starred.groupValues[1].ifEmpty { starred.groupValues[2] })

    val withoutMeasures = listOf(allMoney, kilometers, meters, hours, minutes).fold(text) { current, pattern -> pattern.replace(current, " ") }
    return plainRating.find(withoutMeasures)?.groupValues?.get(1)?.let(::toDecimal)
  }

  private fun parseValue(text: String): Long? {
    val raw = money.find(text)?.groupValues?.get(1) ?: return null
    val cents = Math.round(toDecimal(raw) * 100)
    if (cents < MIN_VALUE_CENTS || cents > MAX_VALUE_CENTS) return null
    return cents
  }

  private fun parseRate(text: String): Double? =
    perKmRate.find(text)?.groupValues?.get(1)?.let(::toDecimal)?.takeIf { it > 0 }

  private fun totalKmFromRate(valueCents: Long, rate: Double): Double = Math.round(valueCents / rate / 10.0) / 10.0

  private fun parseKm(text: String): Double {
    val legs = kilometers.findAll(text).map { toDecimal(it.groupValues[1]) } +
      meters.findAll(text).map { toDecimal(it.groupValues[1]) / 1000 }
    return legs.take(MAX_LEGS).sum()
  }

  private fun parseMinutes(text: String): Int {
    val hourLegs = hours.findAll(text).toList()
    val fromHours = hourLegs.sumOf { hourMatch ->
      val extra = hourMatch.groupValues[2].toIntOrNull() ?: 0
      hourMatch.groupValues[1].toInt() * 60 + extra
    }
    val remaining = hours.replace(text, " ")
    val fromMinutes = minutes.findAll(remaining).take(MAX_LEGS).sumOf { it.groupValues[1].toInt() }
    return fromHours + fromMinutes
  }

  private fun toDecimal(raw: String): Double {
    if (raw.contains(',')) return raw.replace(".", "").replace(',', '.').toDouble()
    return raw.toDouble()
  }
}
