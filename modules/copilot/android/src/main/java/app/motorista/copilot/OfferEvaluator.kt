package app.motorista.copilot

enum class OfferColor(val id: String, val spoken: String, val argb: Int) {
  GREEN("green", "verde", 0xFF1F7A4D.toInt()),
  YELLOW("yellow", "amarela", 0xFFB7791F.toInt()),
  RED("red", "vermelha", 0xFFB3362B.toInt()),
}

data class OfferTargets(val costPerKm: Double, val targetPerKmCents: Double, val targetPerHourCents: Double)

data class OfferEvaluation(
  val offer: ParsedOffer,
  val perKmCents: Double,
  val perHourCents: Double,
  val profitCents: Double,
  val color: OfferColor,
)

object OfferEvaluator {
  fun evaluate(offer: ParsedOffer, targets: OfferTargets): OfferEvaluation {
    val perKm = if (offer.km > 0) offer.valueCents / offer.km else 0.0
    val perHour = if (offer.minutes > 0) offer.valueCents.toDouble() / offer.minutes * 60 else 0.0
    val profit = offer.valueCents - offer.km * targets.costPerKm
    return OfferEvaluation(offer, perKm, perHour, profit, resolveColor(profit, perKm, perHour, targets))
  }

  private fun resolveColor(profit: Double, perKm: Double, perHour: Double, targets: OfferTargets): OfferColor {
    if (profit < 0) return OfferColor.RED
    if (perKm < targets.targetPerKmCents) return OfferColor.YELLOW
    if (perHour < targets.targetPerHourCents) return OfferColor.YELLOW
    return OfferColor.GREEN
  }
}
