package app.motorista.copilot

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

class OfferVoice(private val context: Context) : OfferChannel {
  private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private val attributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
    .build()
  private val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(attributes).build()
  private var engineReady = false
  private var language: Locale? = null
  private var languageReady = false

  private val engine: TextToSpeech = TextToSpeech(context.applicationContext) { status -> onEngineReady(status) }

  val available: Boolean
    get() = engineReady && languageReady

  override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    useLanguage(preferences.regional.language)
    if (!available) return

    requestFocus()
    val params = Bundle()
    engine.speak(OfferFormat.of(context, preferences.regional).spokenPhrase(evaluation, preferences.primaryMetric), TextToSpeech.QUEUE_FLUSH, params, UTTERANCE_ID)
  }

  override fun hide() {
    engine.stop()
    abandonFocus()
  }

  fun release() {
    abandonFocus()
    engine.shutdown()
  }

  private fun onEngineReady(status: Int) {
    if (status != TextToSpeech.SUCCESS) return
    engineReady = true
    useLanguage(CopilotStore.get(context).preferences.regional.language)
    engine.setAudioAttributes(attributes)
    engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String?) = Unit
      override fun onDone(utteranceId: String?) = abandonFocus()

      @Deprecated("Exigido pela classe base")
      override fun onError(utteranceId: String?) = abandonFocus()
    })
  }

  fun useLanguage(locale: Locale) {
    if (!engineReady || locale == language) return
    val result = engine.setLanguage(locale)
    language = locale
    languageReady = result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED
  }

  private fun requestFocus() {
    audioManager.requestAudioFocus(focusRequest)
  }

  private fun abandonFocus() {
    audioManager.abandonAudioFocusRequest(focusRequest)
  }

  private companion object {
    const val UTTERANCE_ID = "offer"
  }
}
