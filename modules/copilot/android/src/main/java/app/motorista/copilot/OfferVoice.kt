package app.motorista.copilot

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

class OfferVoice(context: Context) {
  private var ready = false
  private val engine: TextToSpeech = TextToSpeech(context.applicationContext) { status ->
    ready = status == TextToSpeech.SUCCESS
    if (ready) engine.language = Locale("pt", "BR")
  }

  fun announce(evaluation: OfferEvaluation) {
    if (!ready) return
    val message = "Oferta ${evaluation.color.spoken}. " +
      "${OfferFormat.spokenMoney(evaluation.perKmCents)} por quilômetro. " +
      "${OfferFormat.spokenMoney(evaluation.perHourCents)} por hora."
    engine.speak(message, TextToSpeech.QUEUE_FLUSH, null, UTTERANCE_ID)
  }

  fun release() = engine.shutdown()

  private companion object {
    const val UTTERANCE_ID = "offer"
  }
}
