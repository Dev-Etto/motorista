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
  private var accepted = false

  fun onScan(offer: ParsedOffer?, source: String) {
    if (offer == null) return onOfferMissing()

    scheduler.cancel(KEY_GONE)
    val signature = "$source:${offer.valueCents}:${offer.km}"
    if (signature == lastSignature) return

    lastSignature = signature
    val evaluation = evaluate(offer, source)
    present(evaluation)
    currentOfferId = record(evaluation, source)
    accepted = false
  }

  fun onTap(label: String) {
    val offerId = currentOfferId ?: return
    if (accepted) return

    val outcome = OfferOutcomeReader.fromTap(label) ?: return
    accepted = outcome.status == OfferStatus.ACCEPTED
    markOutcome(offerId, outcome)
  }

  fun preview(offer: ParsedOffer, source: String) = present(evaluate(offer, source))

  private fun present(evaluation: OfferEvaluation) {
    val current = preferences()
    shown.forEach { it.hide() }
    shown = channels()
    shown.forEach { it.show(evaluation, current) }
    scheduler.schedule(KEY_EXPIRE, current.durationSeconds * MS_PER_SECOND) { finish() }
  }

  private fun onOfferMissing() {
    if (lastSignature == null) return

    scheduler.schedule(KEY_GONE, GONE_GRACE_MS) {
      lastSignature = null
      currentOfferId = null
      finish()
    }
  }

  private fun finish() {
    scheduler.cancel(KEY_EXPIRE)
    shown.forEach { it.hide() }
    shown = emptyList()
  }

  private companion object {
    const val KEY_GONE = "gone"
    const val KEY_EXPIRE = "expire"
    const val GONE_GRACE_MS = 1200L
    const val MS_PER_SECOND = 1000L
  }
}
