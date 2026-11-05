package app.motorista.copilot

import java.util.Locale
import kotlin.math.abs

object OfferFormat {
  private val brazil = Locale("pt", "BR")

  fun money(cents: Double): String = String.format(brazil, "R$ %.2f", cents / 100)

  fun wholeMoney(cents: Double): String = "R$ ${Math.round(cents / 100)}"

  fun signedMoney(cents: Double): String = "${if (cents < 0) "-" else "+"} ${money(abs(cents))}"

  fun clock(elapsedMs: Long): String {
    val totalSeconds = elapsedMs / 1000
    return "%02d:%02d:%02d".format(totalSeconds / 3600, totalSeconds % 3600 / 60, totalSeconds % 60)
  }

  fun decimal(value: Double, decimals: Int = 1): String = String.format(brazil, "%.${decimals}f", value)

  fun scoreDescription(evaluation: OfferEvaluation): String {
    val score = evaluation.score ?: return "Sem nota"
    return "Nota ${decimal(score)} de 5"
  }

  fun distanceAndTime(evaluation: OfferEvaluation): String {
    val km = "${decimal(evaluation.offer.km)} km"
    return if (evaluation.offer.minutes > 0) "$km • ${evaluation.offer.minutes} min" else km
  }

  fun rates(evaluation: OfferEvaluation): String {
    val perKm = "${money(evaluation.perKmCents)}/km"
    return if (evaluation.offer.minutes > 0) "$perKm • ${wholeMoney(evaluation.perHourCents)}/h" else perKm
  }

  fun profitAndRating(evaluation: OfferEvaluation): String {
    val parts = mutableListOf<String>()
    evaluation.profitCents?.let { parts.add("Lucro ${signedMoney(it)}") }
    evaluation.offer.passengerRating?.let { parts.add("★ ${decimal(it, 2)}") }
    return parts.joinToString("   ")
  }

  fun spokenPhrase(evaluation: OfferEvaluation, metric: PrimaryMetric): String {
    val intro = spokenIntro(evaluation)
    val profit = evaluation.profitCents
    if (metric == PrimaryMetric.PROFIT && profit != null) {
      return "$intro ${spokenAmount(abs(profit))} de ${if (profit < 0) "prejuízo" else "lucro"}."
    }
    return "$intro ${spokenAmount(evaluation.perKmCents)} por quilômetro."
  }

  private fun spokenIntro(evaluation: OfferEvaluation): String {
    val source = evaluation.sourceLabel.takeIf { it.isNotEmpty() }?.let { "$it. " }.orEmpty()
    val score = evaluation.score ?: return source.trim()
    return "${source}Nota ${decimal(score)}."
  }

  private fun spokenAmount(cents: Double): String {
    val total = Math.round(cents)
    val reais = total / 100
    val centavos = total % 100
    if (centavos == 0L) return "$reais reais"
    return "$reais e $centavos"
  }

  fun notificationTitle(evaluation: OfferEvaluation): String {
    val score = evaluation.score?.let { "Nota ${decimal(it)} • " }.orEmpty()
    return "${evaluation.sourceLabel} • $score${money(evaluation.offer.valueCents.toDouble())}"
  }

  fun notificationText(evaluation: OfferEvaluation) =
    "${distanceAndTime(evaluation)} • ${rates(evaluation)}"

  fun notificationDetails(evaluation: OfferEvaluation) =
    listOf(notificationText(evaluation), profitAndRating(evaluation), evaluation.reason)
      .filter { it.isNotEmpty() }
      .joinToString("\n")
}
