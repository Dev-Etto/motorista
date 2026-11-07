package app.motorista.copilot

import kotlin.math.max
import kotlin.math.min

enum class OfferColor(
  val id: String,
  val dayBackground: Int,
  val dayText: Int,
  val nightAccent: Int,
  val nightText: Int,
) {
  GREEN("green", 0xFF0B6E3E.toInt(), 0xFFFFFFFF.toInt(), 0xFF4FD08D.toInt(), 0xFF06281A.toInt()),
  YELLOW("yellow", 0xFFF5C518.toInt(), 0xFF111111.toInt(), 0xFFF5C518.toInt(), 0xFF111111.toInt()),
  RED("red", 0xFFB3261E.toInt(), 0xFFFFFFFF.toInt(), 0xFFFF8A80.toInt(), 0xFF3B0906.toInt()),
  NEUTRAL("neutral", 0xFF404040.toInt(), 0xFFFFFFFF.toInt(), 0xFFA8A8A8.toInt(), 0xFF171717.toInt()),
}

sealed interface TargetComparison {
  data object NoTarget : TargetComparison
  data object AtTarget : TargetComparison
  data class Above(val percent: Long) : TargetComparison
  data class Below(val percent: Long) : TargetComparison
}

sealed interface OfferReason {
  data object NoCosts : OfferReason
  data object BelowCost : OfferReason
  data class Targets(val perKm: TargetComparison, val perHour: TargetComparison?) : OfferReason
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
  val reason: OfferReason,
  val kmOnTarget: Boolean? = null,
  val hourOnTarget: Boolean? = null,
)

object OfferEvaluator {
  private const val NO_TIME_MAX_SCORE = 4.0
  private const val TARGET_SCORE = 3.5
  private const val MAX_SCORE = 5.0
  private const val SCORE_PER_RATIO_ABOVE_TARGET = 3.0
  private val bands = mapOf(
    OfferColor.GREEN to (3.5 to 5.0),
    OfferColor.YELLOW to (2.0 to 3.4),
    OfferColor.RED to (0.0 to 1.9),
  )

  fun evaluate(offer: ParsedOffer, targets: OfferTargets, sourceLabel: String = ""): OfferEvaluation {
    val perKm = if (offer.km > 0) offer.valueCents / offer.km else 0.0
    val perHour = if (offer.minutes > 0) offer.valueCents.toDouble() / offer.minutes * 60 else 0.0
    if (targets.costPerKm <= 0) {
      return OfferEvaluation(offer, sourceLabel, perKm, perHour, null, OfferColor.NEUTRAL, null, OfferReason.NoCosts)
    }

    val profit = offer.valueCents - offer.km * targets.costPerKm
    val hasTime = offer.minutes > 0
    val color = resolveColor(profit, perKm, perHour, hasTime, targets)
    return OfferEvaluation(
      offer,
      sourceLabel,
      perKm,
      perHour,
      profit,
      color,
      score(perKm, perHour, hasTime, targets, color),
      reason(profit, perKm, perHour, hasTime, targets),
      perKm >= targets.targetPerKmCents,
      if (hasTime) perHour >= targets.targetPerHourCents else null,
    )
  }

  private fun resolveColor(profit: Double, perKm: Double, perHour: Double, hasTime: Boolean, targets: OfferTargets): OfferColor {
    if (profit < 0) return OfferColor.RED
    if (perKm < targets.targetPerKmCents) return OfferColor.YELLOW
    if (hasTime && perHour < targets.targetPerHourCents) return OfferColor.YELLOW
    return OfferColor.GREEN
  }

  private fun partialScore(value: Double, target: Double): Double {
    if (target <= 0) return MAX_SCORE
    val ratio = value / target
    if (ratio <= 1) return TARGET_SCORE * ratio
    return min(MAX_SCORE, TARGET_SCORE + (ratio - 1) * SCORE_PER_RATIO_ABOVE_TARGET)
  }

  private fun score(perKm: Double, perHour: Double, hasTime: Boolean, targets: OfferTargets, color: OfferColor): Double {
    val kmScore = partialScore(perKm, targets.targetPerKmCents)
    val hourScore = partialScore(perHour, targets.targetPerHourCents)
    val base = if (hasTime) (min(kmScore, hourScore) + (kmScore + hourScore) / 2) / 2 else kmScore
    val (low, bandHigh) = bands.getValue(color)
    val high = if (hasTime) bandHigh else min(bandHigh, NO_TIME_MAX_SCORE)
    return Math.round(max(low, min(high, base)) * 10) / 10.0
  }

  private fun reason(profit: Double, perKm: Double, perHour: Double, hasTime: Boolean, targets: OfferTargets): OfferReason {
    if (profit < 0) return OfferReason.BelowCost
    return OfferReason.Targets(comparison(perKm, targets.targetPerKmCents), if (hasTime) comparison(perHour, targets.targetPerHourCents) else null)
  }

  private fun comparison(value: Double, target: Double): TargetComparison {
    if (target <= 0) return TargetComparison.NoTarget
    val percent = Math.round((value / target - 1) * 100)
    if (percent == 0L) return TargetComparison.AtTarget
    return if (percent > 0) TargetComparison.Above(percent) else TargetComparison.Below(-percent)
  }
}
