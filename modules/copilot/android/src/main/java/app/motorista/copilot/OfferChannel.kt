package app.motorista.copilot

interface OfferChannel {
  fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences)
  fun hide()
}
