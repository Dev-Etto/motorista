package app.motorista.copilot

import android.content.Context
import java.text.NumberFormat
import kotlin.math.abs

class OfferFormat(private val regional: RegionalSettings, private val texts: OfferTexts) {
  private val locale = regional.locale
  private val unit = regional.distanceUnit
  private val currencyDigits = regional.currency.defaultFractionDigits.coerceAtLeast(0)
  private val minorPerMajor = Math.pow(10.0, currencyDigits.toDouble()).toLong()

  fun text(resId: Int, vararg args: Any): String = texts.text(resId, *args)

  fun money(cents: Double): String = currencyFormat(currencyDigits).format(cents / CENTS_PER_UNIT).plain()

  fun wholeMoney(cents: Double): String = currencyFormat(0).format(Math.round(cents / CENTS_PER_UNIT).toDouble()).plain()

  fun signedMoney(cents: Double): String = "${if (cents < 0) "-" else "+"} ${money(abs(cents))}"

  fun decimal(value: Double, decimals: Int = 1): String = NumberFormat.getNumberInstance(locale).apply {
    minimumFractionDigits = decimals
    maximumFractionDigits = decimals
  }.format(value).plain()

  fun perDistance(centsPerKm: Double): String = money(centsPerKm * unit.kmPerUnit)

  fun perDistanceLabel(): String = texts.text(R.string.card_per_distance, unit.id)

  fun distanceAndTime(evaluation: OfferEvaluation): String {
    val distance = "${decimal(evaluation.offer.km / unit.kmPerUnit)} ${unit.id}"
    return if (evaluation.offer.minutes > 0) "$distance • ${estimated(evaluation)}${evaluation.offer.minutes} min" else distance
  }

  fun rates(evaluation: OfferEvaluation): String {
    val perDistance = "${perDistance(evaluation.perKmCents)}/${unit.id}"
    return if (evaluation.offer.minutes > 0) "$perDistance • ${perHour(evaluation)}/h" else perDistance
  }

  fun perHour(evaluation: OfferEvaluation): String {
    if (evaluation.offer.minutes <= 0) return NO_VALUE
    return "${estimated(evaluation)}${wholeMoney(evaluation.perHourCents)}"
  }

  private fun estimated(evaluation: OfferEvaluation) = if (evaluation.offer.minutesEstimated) ESTIMATE_MARK else ""

  fun summary(evaluation: OfferEvaluation, metric: PrimaryMetric): String {
    val profit = evaluation.profitCents
    if (metric == PrimaryMetric.PROFIT && profit != null) return signedMoney(profit)
    return "${perDistance(evaluation.perKmCents)}/${unit.id}"
  }

  fun profitLine(evaluation: OfferEvaluation): String = evaluation.profitCents?.let { texts.text(R.string.offer_profit_line, signedMoney(it)) }.orEmpty()

  fun scoreDescription(evaluation: OfferEvaluation): String {
    val score = evaluation.score ?: return texts.text(R.string.offer_no_score)
    return texts.text(R.string.offer_score_of_five, decimal(score))
  }

  fun reason(evaluation: OfferEvaluation): String = when (val reason = evaluation.reason) {
    OfferReason.NoCosts -> texts.text(R.string.reason_no_costs)
    OfferReason.BelowCost -> texts.text(R.string.reason_below_cost, unit.id)
    is OfferReason.Targets -> texts.text(
      R.string.reason_targets,
      unit.id,
      comparison(reason.perKm),
      reason.perHour?.let { comparison(it) } ?: texts.text(R.string.reason_no_time),
    )
  }

  fun spokenPhrase(evaluation: OfferEvaluation, metric: PrimaryMetric): String {
    val source = evaluation.sourceLabel.takeIf { it.isNotEmpty() }?.let { "$it." }
    val score = evaluation.score?.let { texts.text(R.string.spoken_score, decimal(it)) }
    return listOfNotNull(source, score, spokenMetric(evaluation, metric)).joinToString(" ")
  }

  fun notificationTitle(evaluation: OfferEvaluation): String {
    val score = evaluation.score?.let { "${texts.text(R.string.offer_score_short, decimal(it))} • " }.orEmpty()
    return "${evaluation.sourceLabel} • $score${money(evaluation.offer.valueCents.toDouble())}"
  }

  fun notificationText(evaluation: OfferEvaluation) = "${distanceAndTime(evaluation)} • ${rates(evaluation)}"

  fun cardDescription(evaluation: OfferEvaluation) = "${notificationTitle(evaluation)}. ${notificationDetails(evaluation).replace('\n', ' ')}"

  fun notificationDetails(evaluation: OfferEvaluation) =
    listOf(notificationText(evaluation), profitLine(evaluation), reason(evaluation))
      .filter { it.isNotEmpty() }
      .joinToString("\n")

  private fun comparison(comparison: TargetComparison): String = when (comparison) {
    TargetComparison.NoTarget -> texts.text(R.string.reason_no_target)
    TargetComparison.AtTarget -> texts.text(R.string.reason_at_target)
    is TargetComparison.Above -> texts.text(R.string.reason_above, comparison.percent)
    is TargetComparison.Below -> texts.text(R.string.reason_below, comparison.percent)
  }

  private fun spokenMetric(evaluation: OfferEvaluation, metric: PrimaryMetric): String {
    val profit = evaluation.profitCents
    if (metric == PrimaryMetric.PROFIT && profit != null) {
      return texts.text(if (profit < 0) R.string.spoken_loss else R.string.spoken_profit, spokenAmount(abs(profit)))
    }
    val perDistance = if (unit == DistanceUnit.MI) R.string.spoken_per_mi else R.string.spoken_per_km
    return texts.text(perDistance, spokenAmount(evaluation.perKmCents * unit.kmPerUnit))
  }

  private fun spokenAmount(cents: Double): String {
    val names = CURRENCY_NAMES[regional.currency.currencyCode]
    if (names == null || currencyDigits != CENT_DIGITS) return money(cents)

    val total = Math.round(cents)
    val major = total / minorPerMajor
    val minor = total % minorPerMajor
    val majorText = texts.quantity(names.first, major.toInt(), major)
    if (minor == 0L) return majorText
    if (minor < SHORT_MINOR_FROM) return texts.text(R.string.spoken_amount_with_minor, majorText, texts.quantity(names.second, minor.toInt(), minor))
    return texts.text(R.string.spoken_amount_short, major, minor)
  }

  private fun currencyFormat(digits: Int): NumberFormat = NumberFormat.getCurrencyInstance(locale).apply {
    currency = regional.currency
    minimumFractionDigits = digits
    maximumFractionDigits = digits
  }

  private fun String.plain() = replace(WIDE_SPACES, " ")

  companion object {
    private const val CENTS_PER_UNIT = 100.0
    private const val NO_VALUE = "—"
    private const val ESTIMATE_MARK = "~"
    private const val CENT_DIGITS = 2
    private const val SHORT_MINOR_FROM = 10
    private const val MS_PER_SECOND = 1000
    private const val SECONDS_PER_MINUTE = 60
    private const val SECONDS_PER_HOUR = 3600
    private const val HOURS_PER_DAY = 24
    private val WIDE_SPACES = Regex("[\\u00A0\\u202F]")
    private val CURRENCY_NAMES = mapOf(
      "BRL" to (R.plurals.currency_brl_major to R.plurals.currency_brl_minor),
      "USD" to (R.plurals.currency_usd_major to R.plurals.currency_usd_minor),
      "EUR" to (R.plurals.currency_eur_major to R.plurals.currency_eur_minor),
      "MXN" to (R.plurals.currency_mxn_major to R.plurals.currency_mxn_minor),
    )

    @Volatile private var cached: Pair<RegionalSettings, OfferFormat>? = null

    fun of(context: Context, regional: RegionalSettings): OfferFormat {
      cached?.takeIf { it.first == regional }?.let { return it.second }
      val format = OfferFormat(regional, ResourceOfferTexts(context.localized(regional).resources))
      cached = regional to format
      return format
    }

    fun clock(elapsedMs: Long): String {
      val totalSeconds = elapsedMs / MS_PER_SECOND
      return "%02d:%02d:%02d".format(totalSeconds / SECONDS_PER_HOUR, totalSeconds % SECONDS_PER_HOUR / SECONDS_PER_MINUTE, totalSeconds % SECONDS_PER_MINUTE)
    }

    fun shortClock(elapsedMs: Long): String {
      val totalSeconds = maxOf(0L, elapsedMs / MS_PER_SECOND)
      val hours = totalSeconds / SECONDS_PER_HOUR
      val minutes = totalSeconds % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
      if (hours >= HOURS_PER_DAY) return "${HOURS_PER_DAY}H+"
      if (hours == 0L) return "%dM:%02d".format(minutes, totalSeconds % SECONDS_PER_MINUTE)
      return "%dH:%02d".format(hours, minutes)
    }
  }
}
