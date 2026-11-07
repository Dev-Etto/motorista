package app.motorista.copilot

class FloatingOfferChannel(private val host: () -> FloatingHost?, private val onDismiss: () -> Unit) : OfferChannel {
  override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    host()?.showOffer(evaluation, preferences, onDismiss)
  }

  override fun hide() {
    host()?.clearOffer()
  }
}
