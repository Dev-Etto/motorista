package app.motorista.copilot

interface FloatingHost {
  val visibleOutsideApp: Boolean
  fun showOffer(evaluation: OfferEvaluation, preferences: CopilotPreferences, onDismiss: () -> Unit)
  fun clearOffer()
}

class OfferChannels(
  private val card: OfferChannel,
  private val voice: OfferChannel,
  private val notifier: OfferChannel,
  private val floating: OfferChannel,
) {
  fun all(): List<OfferChannel> = listOf(card, voice, notifier, floating)

  fun active(preferences: CopilotPreferences, floatingVisible: Boolean): List<OfferChannel> = buildList {
    if (preferences.card && !floatingVisible) add(card)
    if (preferences.voice) add(voice)
    if (preferences.notification) add(notifier)
    if (floatingVisible) add(floating)
  }
}
