package app.motorista.copilot

import android.accessibilityservice.AccessibilityService
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class OfferAccessibilityService : AccessibilityService() {
  private val handler = Handler(Looper.getMainLooper())
  private val scan = Runnable { scanWindow() }
  private val scheduler = HandlerOfferScheduler()
  private lateinit var store: CopilotStore
  private lateinit var card: OfferCard
  private lateinit var voice: OfferVoice
  private lateinit var notifier: OfferNotifier
  private lateinit var session: OfferSession
  private val floating = FloatingOfferChannel()
  private var currentPackage = ""

  val voiceAvailable: Boolean
    get() = voice.available

  override fun onCreate() {
    super.onCreate()
    store = CopilotStore(this)
    card = OfferCard(this, store)
    voice = OfferVoice(this)
    notifier = OfferNotifier(this)
    session = OfferSession(
      channels = ::activeChannels,
      preferences = { store.preferences },
      evaluate = { offer, source -> OfferEvaluator.evaluate(offer, store.targets, OfferSources.label(source)) },
      record = { evaluation, source -> store.record(evaluation, source, System.currentTimeMillis()) },
      scheduler = scheduler,
    )
  }

  override fun onServiceConnected() {
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (!store.enabled && !OfferDiagnostics.enabled) return

    val source = event?.packageName?.toString() ?: return
    if (source !in store.preferences.monitoredPackages) return

    currentPackage = source
    handler.removeCallbacks(scan)
    handler.postDelayed(scan, SCAN_DELAY_MS)
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    scheduler.cancelAll()
    allChannels().forEach { it.hide() }
    voice.release()
    instance = null
    super.onDestroy()
  }

  fun preview(offer: ParsedOffer, source: String) = session.preview(offer, source)

  private fun allChannels(): List<OfferChannel> = listOf(card, voice, notifier, floating)

  private fun activeChannels(): List<OfferChannel> {
    val preferences = store.preferences
    return buildList {
      val floatingVisible = FloatingTimerService.instance?.visibleOutsideApp == true
      if (preferences.card && !floatingVisible) add(card)
      if (preferences.voice) add(voice)
      if (preferences.notification) add(notifier)
      if (floatingVisible) add(floating)
    }
  }

  private fun scanWindow() {
    val root = rootInActiveWindow ?: return
    val text = collectText(root)
    OfferDiagnostics.capture(text)
    if (!store.enabled) return

    if (OfferParser.isPartial(text)) store.registerFailedRead()
    session.onScan(OfferParser.parse(text), currentPackage)
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
    private const val MAX_NODES = 1500

    @Volatile
    var instance: OfferAccessibilityService? = null
      private set
  }
}
