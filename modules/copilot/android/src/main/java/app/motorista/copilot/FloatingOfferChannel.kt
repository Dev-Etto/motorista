package app.motorista.copilot

class FloatingOfferChannel(private val onDismiss: () -> Unit) : OfferChannel {
  override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    FloatingTimerService.instance?.showOffer(evaluation, preferences, onDismiss)
  }

  override fun hide() {
    FloatingTimerService.instance?.clearOffer()
  }
}
