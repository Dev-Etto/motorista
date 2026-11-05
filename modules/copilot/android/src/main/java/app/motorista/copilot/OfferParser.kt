package app.motorista.copilot

data class ParsedOffer(val valueCents: Long, val km: Double, val minutes: Int, val passengerRating: Double? = null)

object OfferParser {
  private const val MAX_LEGS = 2
  private const val MAX_LEG_HOURS = 12
  private const val MIN_VALUE_CENTS = 200L
  private const val MAX_VALUE_CENTS = 200000L
  private const val SEPARATOR = "|"
  private const val BONUS_MARK = "+"
  private const val NUMBER = """\d{1,3}(?:\.\d{3})+,\d{2}|\d+(?:[.,]\d{1,2})?"""
  private val money = Regex("""(?<!\+)(?<!\+\s)R\$\s*($NUMBER)(?![.,]?\d)(?!\s*(?:/|por\s)\s*(?:km|h\b|hora|min))""", RegexOption.IGNORE_CASE)
  private val exactMoney = Regex("""R\$\s*[\d.,]+""")
  private val acceptedPrice = Regex("""(?:aceitar|accept)\s+por\s+R\$\s*($NUMBER)""", RegexOption.IGNORE_CASE)
  private val notRideValue = Regex("""b[oô]nus|promo|ganhos?|saldo|total|hoje|semana|gorjeta""", RegexOption.IGNORE_CASE)
  private val perKmRate = Regex("""R\$\s*(\d+(?:[.,]\d{1,2})?)\s*(?:/|por\s)\s*km\b""", RegexOption.IGNORE_CASE)
  private val road = Regex("""\b[A-Za-z]{2,3}-\d+""")
  private val kilometers = Regex("""(\d+(?:[.,]\d+)?)\s*km\b(?!/)""", RegexOption.IGNORE_CASE)
  private val meters = Regex("""(?<![\d.,])(\d+)\s*m\b""", RegexOption.IGNORE_CASE)
  private val hours = Regex("""(?<!às\s)(?<!as\s)(?<![\d.,])(\d{1,2})\s*h(?:\s*(\d{1,2})(?:\s*min)?)?\b""", RegexOption.IGNORE_CASE)
  private val minutes = Regex("""(?<!há\s)(?<!ha\s)(\d+)\s*min\b(?!\.)""", RegexOption.IGNORE_CASE)
  private val starredRating = Regex("""(?:★|⭐)\s*([1-5](?:[.,]\d{1,2})?)|([1-5][.,]\d{1,2})\s*(?:★|⭐)""")
  private val plainRating = Regex("""(?<![\d.,+])([1-5][.,]\d{2})(?![\d.,]|\s*x)""", RegexOption.IGNORE_CASE)
  private val allMoney = Regex("""\+?\s*R\$\s*[\d.,]+""")
  private val acceptAction = Regex(
    """^(?:toque para |deslize para )?(?:aceitar|selecionar|corresponder|accept|match)(?:\s+(?:a\s+)?(?:corrida|viagem|oferta))?(?:\s+(?:por\s+)?R\$\s*[\d.,]+)?$""",
    RegexOption.IGNORE_CASE,
  )

  fun joinParts(parts: List<String>): String = parts.map { normalize(it).trim() }.filter { it.isNotEmpty() }.distinct().joinToString(" $SEPARATOR ")

  fun segments(text: String): List<String> = normalize(text).split(SEPARATOR).map { it.trim() }.filter { it.isNotEmpty() }

  fun isAcceptAction(segment: String): Boolean = acceptAction.matches(segment.trim())

  fun exactValueCents(text: String): Long? {
    val clean = normalize(text).trim()
    if (!exactMoney.matches(clean)) return null
    return valueOf(segments(clean))
  }

  fun parse(rawText: String): ParsedOffer? {
    val text = normalize(rawText)
    val parts = segments(text)
    if (parts.none(::isAcceptAction)) return null

    val value = acceptedValue(text) ?: valueOf(parts) ?: return null
    val rate = parseRate(text)
    val km = if (rate == null) parseKm(text) else totalKmFromRate(value, rate)
    if (km <= 0.0) return null

    val totalMinutes = parseMinutes(text)
    if (totalMinutes <= 0 && rate == null) return null

    return ParsedOffer(value, km, totalMinutes, parseRating(text))
  }

  fun isPartial(rawText: String): Boolean {
    val text = normalize(rawText)
    if (segments(text).none(::isAcceptAction)) return false
    if (!money.containsMatchIn(text)) return false
    return parse(text) == null
  }

  private fun normalize(text: String) = text.replace(' ', ' ')

  private fun parseRating(text: String): Double? {
    val starred = starredRating.find(text)
    if (starred != null) return toDecimal(starred.groupValues[1].ifEmpty { starred.groupValues[2] })

    val withoutMeasures = listOf(allMoney, kilometers, meters, hours, minutes).fold(text) { current, pattern -> pattern.replace(current, " ") }
    return plainRating.find(withoutMeasures)?.groupValues?.get(1)?.let(::toDecimal)
  }

  private fun acceptedValue(text: String): Long? = acceptedPrice.find(text)?.groupValues?.get(1)?.let(::centsInRange)

  private fun valueOf(parts: List<String>): Long? {
    parts.forEachIndexed { index, part ->
      if (notRideValue.containsMatchIn(part) || parts.getOrNull(index - 1) == BONUS_MARK) return@forEachIndexed

      val cents = money.find(part)?.groupValues?.get(1)?.let(::centsInRange)
      if (cents != null) return cents
    }
    return null
  }

  private fun centsInRange(raw: String): Long? = Math.round(toDecimal(raw) * 100).takeIf { it in MIN_VALUE_CENTS..MAX_VALUE_CENTS }

  private fun parseRate(text: String): Double? =
    perKmRate.find(text)?.groupValues?.get(1)?.let(::toDecimal)?.takeIf { it > 0 }

  private fun totalKmFromRate(valueCents: Long, rate: Double): Double = Math.round(valueCents / rate / 10.0) / 10.0

  private fun parseKm(text: String): Double {
    val clean = road.replace(text, " ")
    val legs = kilometers.findAll(clean).map { toDecimal(it.groupValues[1]) } +
      meters.findAll(clean).map { toDecimal(it.groupValues[1]) / 1000 }
    return legs.take(MAX_LEGS).sum()
  }

  private fun parseMinutes(text: String): Int {
    val hourLegs = hours.findAll(text).filter { it.groupValues[1].toInt() < MAX_LEG_HOURS }.take(MAX_LEGS).toList()
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
