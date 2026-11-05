package app.motorista.copilot

import kotlin.math.max
import kotlin.math.min

enum class OfferColor(
  val id: String,
  val shape: String,
  val dayBackground: Int,
  val dayText: Int,
  val nightAccent: Int,
) {
  GREEN("green", "▲", 0xFF0B6E3E.toInt(), 0xFFFFFFFF.toInt(), 0xFF4FD08D.toInt()),
  YELLOW("yellow", "■", 0xFFF5C518.toInt(), 0xFF111111.toInt(), 0xFFF5C518.toInt()),
  RED("red", "▼", 0xFFB3261E.toInt(), 0xFFFFFFFF.toInt(), 0xFFFF8A80.toInt()),
  NEUTRAL("neutral", "●", 0xFF404040.toInt(), 0xFFFFFFFF.toInt(), 0xFFA8A8A8.toInt()),
}

data class OfferTargets(val costPerKm: Double, val targetPerKmCents: Double, val targetPerHourCents: Double)

data class OfferEvaluation(
  val offer: ParsedOffer,
  val sourceLabel: String,
  val perKmCents: Double,
  val perHourCents: Double,
  val profitCents: Double?,
  val color: OfferColor,
  val score: Double?,
  val reason: String,
  val kmOnTarget: Boolean? = null,
  val hourOnTarget: Boolean? = null,
)

object OfferEvaluator {
  private const val TARGET_SCORE = 7.0
  private const val MAX_SCORE = 10.0
  private const val SCORE_PER_RATIO_ABOVE_TARGET = 6.0
  private val bands = mapOf(
    OfferColor.GREEN to (7.0 to 10.0),
    OfferColor.YELLOW to (4.0 to 6.9),
    OfferColor.RED to (0.0 to 3.9),
  )

  fun evaluate(offer: ParsedOffer, targets: OfferTargets, sourceLabel: String = ""): OfferEvaluation {
    val perKm = if (offer.km > 0) offer.valueCents / offer.km else 0.0
    val perHour = if (offer.minutes > 0) offer.valueCents.toDouble() / offer.minutes * 60 else 0.0
    if (targets.costPerKm <= 0) {
      return OfferEvaluation(offer, sourceLabel, perKm, perHour, null, OfferColor.NEUTRAL, null, "Cadastre seus custos para ver a nota")
    }

    val profit = offer.valueCents - offer.km * targets.costPerKm
    val color = resolveColor(profit, perKm, perHour, targets)
    return OfferEvaluation(
      offer,
      sourceLabel,
      perKm,
      perHour,
      profit,
      color,
      score(perKm, perHour, targets, color),
      reason(profit, perKm, perHour, targets),
      perKm >= targets.targetPerKmCents,
      perHour >= targets.targetPerHourCents,
    )
  }

  private fun resolveColor(profit: Double, perKm: Double, perHour: Double, targets: OfferTargets): OfferColor {
    if (profit < 0) return OfferColor.RED
    if (perKm < targets.targetPerKmCents) return OfferColor.YELLOW
    if (perHour < targets.targetPerHourCents) return OfferColor.YELLOW
    return OfferColor.GREEN
  }

  private fun partialScore(value: Double, target: Double): Double {
    if (target <= 0) return MAX_SCORE
    val ratio = value / target
    if (ratio <= 1) return TARGET_SCORE * ratio
    return min(MAX_SCORE, TARGET_SCORE + (ratio - 1) * SCORE_PER_RATIO_ABOVE_TARGET)
  }

  private fun score(perKm: Double, perHour: Double, targets: OfferTargets, color: OfferColor): Double {
    val kmScore = partialScore(perKm, targets.targetPerKmCents)
    val hourScore = partialScore(perHour, targets.targetPerHourCents)
    val base = (min(kmScore, hourScore) + (kmScore + hourScore) / 2) / 2
    val (low, high) = bands.getValue(color)
    return Math.round(max(low, min(high, base)) * 10) / 10.0
  }

  private fun reason(profit: Double, perKm: Double, perHour: Double, targets: OfferTargets): String {
    if (profit < 0) return "Não cobre seu custo por km"
    return "km: ${comparison(perKm, targets.targetPerKmCents)} · hora: ${comparison(perHour, targets.targetPerHourCents)}"
  }

  private fun comparison(value: Double, target: Double): String {
    if (target <= 0) return "sem mínimo"
    val percent = Math.round((value / target - 1) * 100)
    if (percent == 0L) return "no mínimo"
    return if (percent > 0) "$percent% acima do mínimo" else "${-percent}% abaixo do mínimo"
  }
}
