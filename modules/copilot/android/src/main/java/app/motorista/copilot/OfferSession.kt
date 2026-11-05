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
) {
  private var shown: List<OfferChannel> = emptyList()
  private var lastSignature: String? = null
  private var currentOfferId: Long? = null
  private var currentSource: String? = null
  private var accepted = false
  private var goneArmed = false

  fun onScan(offer: ParsedOffer?, source: String) {
    if (offer == null) return onOfferMissing()

    scheduler.cancel(KEY_GONE)
    goneArmed = false
    val signature = "$source:${offer.valueCents}"
    if (signature == lastSignature) return

    lastSignature = signature
    val evaluation = evaluate(offer, source)
    present(evaluation)
    currentOfferId = record(evaluation, source)
    currentSource = source
    accepted = false
    scheduler.schedule(KEY_TAP_WINDOW, TAP_WINDOW_MS) { forgetCurrentOffer() }
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
    scheduler.schedule(KEY_EXPIRE, current.durationSeconds * MS_PER_SECOND) { finish() }
  }

  private fun onOfferMissing() {
    if (lastSignature == null || goneArmed) return

    goneArmed = true
    scheduler.schedule(KEY_GONE, GONE_GRACE_MS) {
      goneArmed = false
      lastSignature = null
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
    hideShown()
    shown = emptyList()
  }

  private companion object {
    const val KEY_GONE = "gone"
    const val KEY_EXPIRE = "expire"
    const val KEY_TAP_WINDOW = "tap_window"
    const val TAP_WINDOW_MS = 60_000L
    const val GONE_GRACE_MS = 1200L
    const val MS_PER_SECOND = 1000L
  }
}
