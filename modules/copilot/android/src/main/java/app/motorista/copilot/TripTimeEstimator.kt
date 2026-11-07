package app.motorista.copilot

data class TripSample(val km: Double, val minutes: Int)

object TripTimeEstimator {
  const val DEFAULT_KMH = 25.0
  private const val MIN_SAMPLES = 5
  private const val MIN_KMH = 10.0
  private const val MAX_KMH = 60.0
  private const val MINUTES_PER_HOUR = 60.0

  fun speedKmh(samples: List<TripSample>): Double {
    val speeds = samples.filter { it.km > 0 && it.minutes > 0 }.map { it.km / it.minutes * MINUTES_PER_HOUR }.sorted()
    if (speeds.size < MIN_SAMPLES) return DEFAULT_KMH
    return median(speeds).coerceIn(MIN_KMH, MAX_KMH)
  }

  fun withEstimatedTime(offer: ParsedOffer, speedKmh: Double): ParsedOffer {
    if (offer.minutes > 0 || offer.km <= 0 || speedKmh <= 0) return offer

    val minutes = Math.round(offer.km / speedKmh * MINUTES_PER_HOUR).toInt().coerceAtLeast(1)
    return offer.copy(minutes = minutes, minutesEstimated = true)
  }

  private fun median(sorted: List<Double>): Double {
    val middle = sorted.size / 2
    if (sorted.size % 2 == 1) return sorted[middle]
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
}
