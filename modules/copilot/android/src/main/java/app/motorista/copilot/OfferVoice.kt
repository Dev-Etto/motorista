package app.motorista.copilot

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

class OfferVoice(context: Context) : OfferChannel {
  private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private val attributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
    .build()
  private val focusRequest = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(attributes).build()
  } else {
    null
  }
  private val focusListener = AudioManager.OnAudioFocusChangeListener { }
  private var ready = false
  private val brazil = Locale("pt", "BR")

  private val engine: TextToSpeech = TextToSpeech(context.applicationContext) { status -> onEngineReady(status) }

  val available: Boolean
    get() = ready

  override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    if (!ready) return

    requestFocus()
    val params = Bundle()
    engine.speak(OfferFormat.spokenPhrase(evaluation, preferences.primaryMetric), TextToSpeech.QUEUE_FLUSH, params, UTTERANCE_ID)
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
    val language = engine.setLanguage(brazil)
    ready = language != TextToSpeech.LANG_MISSING_DATA && language != TextToSpeech.LANG_NOT_SUPPORTED
    engine.setAudioAttributes(attributes)
    engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String?) = Unit
      override fun onDone(utteranceId: String?) = abandonFocus()

      @Deprecated("Exigido pela classe base")
      override fun onError(utteranceId: String?) = abandonFocus()
    })
  }

  private fun requestFocus() {
    if (focusRequest != null) {
      audioManager.requestAudioFocus(focusRequest)
      return
    }
    audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
  }

  private fun abandonFocus() {
    if (focusRequest != null) {
      audioManager.abandonAudioFocusRequest(focusRequest)
      return
    }
    audioManager.abandonAudioFocus(focusListener)
  }

  private companion object {
    const val UTTERANCE_ID = "offer"
  }
}
