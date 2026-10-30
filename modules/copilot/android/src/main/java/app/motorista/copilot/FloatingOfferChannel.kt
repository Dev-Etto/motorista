package app.motorista.copilot

class FloatingOfferChannel : OfferChannel {
  override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    FloatingTimerService.instance?.showOffer(evaluation, preferences)
  }

  override fun hide() {
    FloatingTimerService.instance?.clearOffer()
  }
}
