package app.motorista.copilot

interface OfferScheduler {
  fun schedule(key: String, delayMs: Long, action: () -> Unit)
  fun cancel(key: String)
}

class OfferSession(
  private val channels: () -> List<OfferChannel>,
  private val preferences: () -> CopilotPreferences,
  private val evaluate: (ParsedOffer, String) -> OfferEvaluation,
  private val record: (OfferEvaluation, String) -> Long,
  private val markOutcome: (Long, OfferOutcome) -> Unit,
  private val scheduler: OfferScheduler,
  private val refine: (Long, OfferEvaluation) -> Unit = { _, _ -> },
  private val onPresentationChange: () -> Unit = {},
  private val now: () -> Long = System::currentTimeMillis,
) {
  private var shown: List<OfferChannel> = emptyList()
  private var lastSignature: String? = null
  private var lastOffer: ParsedOffer? = null
  private var currentOfferId: Long? = null
  private var currentSource: String? = null
  private var accepted = false
  private var goneArmed = false
  private var imageHold = false
  private var lastSeenAt = 0L

  val presenting: Boolean
    get() = shown.isNotEmpty()

  fun onScan(offer: ParsedOffer?, source: String) {
    if (offer == null) return onOfferMissing()

    scheduler.cancel(KEY_GONE)
    goneArmed = false
    val signature = "$source:${offer.valueCents}"
    val seenRecently = now() - lastSeenAt <= SAME_OFFER_GAP_MS
    lastSeenAt = now()
    if (signature == lastSignature && seenRecently) return refineWithMoreLegs(offer, source)

    lastSignature = signature
    lastOffer = offer
    val evaluation = evaluate(offer, source)
    present(evaluation)
    currentOfferId = record(evaluation, source)
    currentSource = source
    accepted = false
    scheduler.schedule(KEY_TAP_WINDOW, TAP_WINDOW_MS) { forgetCurrentOffer() }
  }

  fun onImageScan(offer: ParsedOffer, source: String) {
    imageHold = true
    scheduler.schedule(KEY_IMAGE_HOLD, IMAGE_HOLD_MS) { releaseImageHold() }
    onScan(offer, source)
  }

  fun dismiss() = finish()

  fun onSourceGone() {
    if (imageHold) releaseImageHold()
  }

  private fun refineWithMoreLegs(offer: ParsedOffer, source: String) {
    if (!addsDetail(offer, lastOffer)) return

    lastOffer = offer
    val evaluation = evaluate(offer, source)
    present(evaluation)
    currentOfferId?.let { refine(it, evaluation) }
  }

  private fun addsDetail(offer: ParsedOffer, last: ParsedOffer?): Boolean {
    if (last == null) return true
    return offer.legs > last.legs || (last.minutes == 0 && offer.minutes > 0)
  }

  private fun releaseImageHold() {
    imageHold = false
    scheduler.cancel(KEY_IMAGE_HOLD)
    lastSignature = null
    lastOffer = null
    forgetCurrentOffer()
    finish()
  }

  fun onTap(label: String, source: String) {
    val offerId = currentOfferId ?: return
    if (accepted || source != currentSource) return

    val outcome = OfferOutcomeReader.fromTap(label) ?: return
    accepted = outcome.status == OfferStatus.ACCEPTED
    markOutcome(offerId, outcome)
  }

  fun preview(offer: ParsedOffer, source: String) = present(evaluate(offer, source))

  private fun present(evaluation: OfferEvaluation) {
    val current = preferences()
    hideShown()
    shown = channels()
    shown.forEach { channel -> runCatching { channel.show(evaluation, current) } }
    onPresentationChange()
    scheduler.schedule(KEY_EXPIRE, current.durationSeconds * MS_PER_SECOND) { finish() }
  }

  private fun onOfferMissing() {
    if (lastSignature == null || goneArmed || imageHold) return

    goneArmed = true
    scheduler.schedule(KEY_GONE, GONE_GRACE_MS) {
      goneArmed = false
      lastSignature = null
      lastOffer = null
      forgetCurrentOffer()
      finish()
    }
  }

  private fun forgetCurrentOffer() {
    scheduler.cancel(KEY_TAP_WINDOW)
    currentOfferId = null
    currentSource = null
  }

  private fun hideShown() = shown.forEach { channel -> runCatching { channel.hide() } }

  private fun finish() {
    scheduler.cancel(KEY_EXPIRE)
    val wasPresenting = presenting
    hideShown()
    shown = emptyList()
    if (wasPresenting) onPresentationChange()
  }

  private companion object {
    const val KEY_GONE = "gone"
    const val KEY_EXPIRE = "expire"
    const val KEY_TAP_WINDOW = "tap_window"
    const val KEY_IMAGE_HOLD = "image_hold"
    const val IMAGE_HOLD_MS = 20_000L
    const val SAME_OFFER_GAP_MS = 3000L
    const val TAP_WINDOW_MS = 60_000L
    const val GONE_GRACE_MS = 1200L
    const val MS_PER_SECOND = 1000L
  }
}
