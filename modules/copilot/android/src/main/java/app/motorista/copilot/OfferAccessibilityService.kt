package app.motorista.copilot

import android.accessibilityservice.AccessibilityService
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class OfferAccessibilityService : AccessibilityService() {
  private val handler = Handler(Looper.getMainLooper())
  private val scan = Runnable { scanWindow() }
  private lateinit var store: CopilotStore
  private lateinit var card: OfferCard
  private lateinit var voice: OfferVoice
  private var lastSignature: String? = null
  private var lastSignatureAt = 0L
  private var currentPackage = ""

  override fun onServiceConnected() {
    store = CopilotStore(this)
    card = OfferCard(this)
    voice = OfferVoice(this)
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (!store.enabled && !OfferDiagnostics.enabled) return
    currentPackage = event?.packageName?.toString() ?: return
    handler.removeCallbacks(scan)
    handler.postDelayed(scan, SCAN_DELAY_MS)
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    card.hide()
    voice.release()
    instance = null
    super.onDestroy()
  }

  fun present(offer: ParsedOffer, source: String, remember: Boolean) {
    val evaluation = OfferEvaluator.evaluate(offer, store.targets)
    card.show(evaluation)
    if (store.voiceEnabled) voice.announce(evaluation)
    if (remember) store.record(evaluation, source, System.currentTimeMillis())
  }

  private fun scanWindow() {
    val root = rootInActiveWindow ?: return
    val text = collectText(root)
    OfferDiagnostics.capture(text)
    if (!store.enabled) return

    val offer = OfferParser.parse(text) ?: return
    val now = System.currentTimeMillis()
    val signature = "$currentPackage:${offer.valueCents}:${offer.km}:${offer.minutes}"
    if (signature == lastSignature && now - lastSignatureAt < REPEAT_WINDOW_MS) return

    lastSignature = signature
    lastSignatureAt = now
    present(offer, currentPackage, true)
  }

  private fun collectText(root: AccessibilityNodeInfo): String {
    val parts = mutableListOf<String>()
    val pending = ArrayDeque(listOf(root))
    var visited = 0
    while (pending.isNotEmpty() && visited < MAX_NODES) {
      val node = pending.removeFirst()
      visited++
      node.text?.let { parts.add(it.toString()) }
      node.contentDescription?.let { parts.add(it.toString()) }
      for (index in 0 until node.childCount) node.getChild(index)?.let { pending.addLast(it) }
    }
    return parts.joinToString(" | ")
  }

  companion object {
    private const val SCAN_DELAY_MS = 300L
    private const val REPEAT_WINDOW_MS = 60000L
    private const val MAX_NODES = 1500

    @Volatile
    var instance: OfferAccessibilityService? = null
      private set
  }
}
