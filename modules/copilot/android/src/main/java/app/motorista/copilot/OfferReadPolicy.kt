package app.motorista.copilot

data class ImageReadRequest(
  val enabled: Boolean,
  val source: String,
  val offerFound: Boolean,
  val changed: Boolean,
  val bursting: Boolean,
  val presenting: Boolean,
  val recentlyActive: Boolean,
  val inTrip: Boolean,
)

object OfferReadPolicy {
  private const val SCAN_INTERVAL_MS = 300L
  private const val PRESENTING_INTERVAL_MS = 900L
  private const val IN_TRIP_INTERVAL_MS = 1000L
  private const val IGNORED_TOP_FRACTION = 0.15
  private val imageSources = setOf(OfferSources.UBER, OfferSources.NINETY_NINE)
  private val inTripAction = Regex(
    """\b(?:iniciar|finalizar|concluir|encerrar)\s+(?:a\s+)?(?:corrida|viagem|entrega)\b|\bcheguei\b|\bchegou ao destino\b""",
    RegexOption.IGNORE_CASE,
  )

  fun shouldReadImage(request: ImageReadRequest): Boolean {
    if (!request.enabled || request.source !in imageSources) return false
    if (request.offerFound || request.presenting || request.inTrip || !request.recentlyActive) return false
    return request.changed || request.bursting
  }

  fun scanIntervalMs(presenting: Boolean, inTrip: Boolean, offerOnScreen: Boolean = false): Long = when {
    inTrip -> IN_TRIP_INTERVAL_MS
    presenting || offerOnScreen -> PRESENTING_INTERVAL_MS
    else -> SCAN_INTERVAL_MS
  }

  fun ignoredTextTopY(source: String, screenHeight: Int): Int = if (source == OfferSources.UBER) imageTopY(screenHeight) else 0

  fun imageTopY(screenHeight: Int): Int = (screenHeight * IGNORED_TOP_FRACTION).toInt()

  fun isInTrip(text: String): Boolean = inTripAction.containsMatchIn(text)
}

data class TextRead(val offer: ParsedOffer?, val changed: Boolean, val countFailure: Boolean, val inTrip: Boolean)

class OfferTextTracker {
  private var lastText: String? = null
  private var lastOffer: ParsedOffer? = null
  private var lastPartial = false
  private var lastInTrip = false

  fun reset() {
    lastText = null
    lastOffer = null
    lastPartial = false
    lastInTrip = false
  }

  fun read(text: String): TextRead {
    if (text == lastText) return TextRead(lastOffer, changed = false, countFailure = false, inTrip = lastInTrip)

    val offer = OfferParser.parse(text)
    val partial = offer == null && OfferParser.isPartial(text)
    val countFailure = partial && !lastPartial
    lastText = text
    lastOffer = offer
    lastPartial = partial
    lastInTrip = offer == null && OfferReadPolicy.isInTrip(text)
    return TextRead(offer, changed = true, countFailure = countFailure, inTrip = lastInTrip)
  }
}

class WindowEventGate(private val now: () -> Long) {
  private var ownChangeAt = -OWN_CHANGE_WINDOW_MS

  fun noteOwnWindowChange() {
    ownChangeAt = now()
  }

  fun allowsBurst(): Boolean = now() - ownChangeAt >= OWN_CHANGE_WINDOW_MS

  private companion object {
    const val OWN_CHANGE_WINDOW_MS = 1000L
  }
}
