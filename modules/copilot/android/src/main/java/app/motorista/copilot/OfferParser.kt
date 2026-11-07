package app.motorista.copilot

import kotlin.math.abs

data class ParsedOffer(val valueCents: Long, val km: Double, val minutes: Int, val passengerRating: Double? = null, val legs: Int = 1)

private data class RouteLeg(val minutes: Int, val km: Double)

object OfferParser {
  private const val MAX_LEGS = 2
  private const val METERS_PER_KM = 1000
  private const val KM_TOLERANCE = 0.2
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
  private val minutes = Regex("""(?<!há\s)(?<!ha\s)(\d+)\s*min(?:utos?)?\b(?!\.)""", RegexOption.IGNORE_CASE)
  private val routeLeg = Regex("""(\d+)\s*min(?:utos?)?\b[\s(|·•,-]{0,6}(\d+(?:[.,]\d+)?)\s*(km|m)\b""", RegexOption.IGNORE_CASE)
  private val uberProduct = Regex("""\b(?:uber\s?\w+|comfort|black|priority|prioridade|exclusiv[oa]|verificado)\b""", RegexOption.IGNORE_CASE)
  private val pickupOnlyMark = Regex("""de\s+dist[aâ]ncia""", RegexOption.IGNORE_CASE)
  private val tripMark = Regex("""\bviagem\b""", RegexOption.IGNORE_CASE)
  private val imageMoneyMark = Regex("""\bR[S5s]\s*(?=\d)""")
  private val postedAge = Regex("""(?:\b\d{1,2}\s*h\s*)?\b\d+\s*min\.""", RegexOption.IGNORE_CASE)
  private val pickupDistance = Regex("""~\s*\d+(?:[.,]\d+)?\s*km\b""", RegexOption.IGNORE_CASE)
  private val splitUnit = Regex("""(\d) \| (km|m|min|minutos|h)\b""")
  private val splitMoney = Regex("""R\$ \| (?=\d)""")
  private val starredRating = Regex("""(?:★|⭐)\s*([1-5](?:[.,]\d{1,2})?)|([1-5][.,]\d{1,2})\s*(?:★|⭐)""")
  private val countedRating = Regex("""(?<![\d.,+])([1-5][.,]\d{1,2})\s*\(\d+\)""")
  private val acceptAction = Regex(
    """^(?:toque para |deslize para )?(?:aceitar|selecionar|corresponder|reservar|aumentar para|accept|match)(?:\s+(?:a\s+)?(?:corrida|viagem|oferta))?(?:\s+(?:por\s+)?R\$\s*[\d.,]+)?$""",
    RegexOption.IGNORE_CASE,
  )

  fun joinParts(parts: List<String>): String = cleanParts(parts).distinct().joinToString(" $SEPARATOR ")

  fun joinScreenParts(parts: List<String>): String = cleanParts(parts).joinToString(" $SEPARATOR ")

  private fun cleanParts(parts: List<String>) = parts.map { normalize(it).trim() }.filter { it.isNotEmpty() }

  fun fromImageText(text: String): String = imageMoneyMark.replace(text) { "R$ " }

  fun segments(text: String): List<String> = normalize(text).split(SEPARATOR).map { it.trim() }.filter { it.isNotEmpty() }

  fun isAcceptAction(segment: String): Boolean = acceptAction.matches(segment.trim().lineSequence().first().trim())

  fun exactValueCents(text: String): Long? {
    val clean = normalize(text).trim()
    if (!exactMoney.matches(clean)) return null
    return valueOf(segments(clean))
  }

  fun parse(rawText: String): ParsedOffer? {
    val text = normalize(rawText)
    val parts = segments(text)
    if (!looksLikeOffer(text, parts) || isPickupOnly(text)) return null

    val value = acceptedValue(text) ?: valueOf(parts) ?: return null
    val rate = parseRate(text)
    val total = if (rate == null) totalLeg(text) else null
    val km = when {
      rate != null -> totalKmFromRate(value, rate)
      total != null -> total.km
      else -> parseKm(text)
    }
    if (km <= 0.0) return null

    val totalMinutes = total?.minutes ?: if (rate == null) parseMinutes(text) else routeMinutes(text)
    if (totalMinutes <= 0 && rate == null) return null

    return ParsedOffer(value, km, totalMinutes, parseRating(text), maxOf(1, routeLegs(text).size))
  }

  fun isPartial(rawText: String): Boolean {
    val text = normalize(rawText)
    if (!looksLikeOffer(text, segments(text))) return false
    if (!money.containsMatchIn(text)) return false
    return parse(text) == null
  }

  private fun looksLikeOffer(text: String, parts: List<String>) = parts.any(::isAcceptAction) || isUberCard(text)

  private fun isUberCard(text: String) = uberProduct.containsMatchIn(text) && routeLegs(text).size >= MAX_LEGS

  private fun isPickupOnly(text: String) =
    pickupOnlyMark.containsMatchIn(text) && !tripMark.containsMatchIn(text) && routeLegs(text).size < MAX_LEGS

  private fun routeLegs(text: String): List<RouteLeg> = routeLeg.findAll(road.replace(text, " ")).mapNotNull { match ->
    val minutes = match.groupValues[1].toIntOrNull() ?: return@mapNotNull null
    val distance = toDecimal(match.groupValues[2])
    RouteLeg(minutes, if (match.groupValues[3].equals("m", ignoreCase = true)) distance / METERS_PER_KM else distance)
  }.toList()

  private fun totalLeg(text: String): RouteLeg? {
    if (hours.containsMatchIn(text)) return null

    val legs = routeLegs(text)
    if (legs.size <= MAX_LEGS) return null
    return legs.firstOrNull { candidate ->
      val others = legs - candidate
      others.size == MAX_LEGS && abs(others.sumOf { it.minutes } - candidate.minutes) <= 1 && abs(others.sumOf { it.km } - candidate.km) <= KM_TOLERANCE
    }
  }

  private fun normalize(text: String): String {
    val clean = text.replace('\u00A0', ' ')
    return splitMoney.replace(splitUnit.replace(clean) { "${it.groupValues[1]} ${it.groupValues[2]}" }) { "R$ " }
  }

  private fun parseRating(text: String): Double? {
    val starred = starredRating.find(text)
    if (starred != null) return toDecimal(starred.groupValues[1].ifEmpty { starred.groupValues[2] })
    return countedRating.find(text)?.groupValues?.get(1)?.let(::toDecimal)
  }

  private fun acceptedValue(text: String): Long? = acceptedPrice.find(text)?.groupValues?.get(1)?.let(::centsInRange)

  private fun valueOf(parts: List<String>): Long? {
    parts.forEachIndexed { index, part ->
      val previous = parts.getOrNull(index - 1).orEmpty()
      val labeled = !money.containsMatchIn(previous) && notRideValue.containsMatchIn(previous)
      if (notRideValue.containsMatchIn(part) || previous == BONUS_MARK || labeled) return@forEachIndexed

      val cents = money.find(part)?.groupValues?.get(1)?.let(::centsInRange)
      if (cents != null) return cents
    }
    return null
  }

  private fun centsInRange(raw: String): Long? = Math.round(toDecimal(raw) * 100).takeIf { it in MIN_VALUE_CENTS..MAX_VALUE_CENTS }

  private fun parseRate(text: String): Double? =
    perKmRate.find(text)?.groupValues?.get(1)?.let(::toDecimal)?.takeIf { it > 0 }

  private fun totalKmFromRate(valueCents: Long, rate: Double): Double = Math.round(valueCents / rate / 10.0) / 10.0

  private fun routeMinutes(text: String): Int {
    val legs = routeLegs(text)
    if (legs.isEmpty()) return parseMinutes(text)
    if (legs.size < MAX_LEGS || legs.any { it.minutes <= 0 }) return 0
    return legs.take(MAX_LEGS).sumOf { it.minutes }
  }

  private fun parseKm(text: String): Double {
    val clean = road.replace(pickupDistance.replace(text, " "), " ")
    val legs = kilometers.findAll(clean).map { toDecimal(it.groupValues[1]) } +
      meters.findAll(clean).map { toDecimal(it.groupValues[1]) / 1000 }
    return legs.take(MAX_LEGS).sum()
  }

  private fun parseMinutes(rawText: String): Int {
    val text = postedAge.replace(rawText, " ")
    val hourLegs = hours.findAll(text).filter { it.groupValues[1].toInt() < MAX_LEG_HOURS }.take(MAX_LEGS).toList()
    val fromHours = hourLegs.sumOf { hourMatch ->
      val extra = hourMatch.groupValues[2].toIntOrNull() ?: 0
      hourMatch.groupValues[1].toInt() * 60 + extra
    }
    val remaining = hours.replace(text, " ")
    val fromMinutes = minutes.findAll(remaining).take(MAX_LEGS).sumOf { it.groupValues[1].toIntOrNull() ?: 0 }
    return fromHours + fromMinutes
  }

  private fun toDecimal(raw: String): Double {
    if (raw.contains(',')) return raw.replace(".", "").replace(',', '.').toDouble()
    return raw.toDouble()
  }
}
