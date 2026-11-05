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
  private var mockReceiver: OfferMockReceiver? = null

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
      record = { evaluation, source -> recordOffer(evaluation, source) },
      markOutcome = { offerId, outcome -> runCatching { store.markOutcome(offerId, outcome) } },
      scheduler = scheduler,
    )
  }

  override fun onServiceConnected() {
    instance = this
    ShiftTimer(this).restoreAlarm()
    if (OfferMockReceiver.isAllowed(this)) mockReceiver = OfferMockReceiver(this).also { it.register(this) }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (!store.enabled && !OfferDiagnostics.enabled) return

    val source = event?.packageName?.toString() ?: return
    if (source !in store.preferences.monitoredPackages) return

    if (event.eventType == AccessibilityEvent.TYPE_VIEW_CLICKED) return handleTap(tapLabel(event), source)

    currentPackage = source
    handler.removeCallbacks(scan)
    handler.postDelayed(scan, SCAN_DELAY_MS)
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    mockReceiver?.let { unregisterReceiver(it) }
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

  fun mockTap(label: String) = handleTap(label, currentPackage)

  fun mockScan(text: String, source: String) {
    currentPackage = source
    process(text)
  }

  private fun recordOffer(evaluation: OfferEvaluation, source: String): Long {
    val timestamp = System.currentTimeMillis()
    runCatching { store.record(evaluation, source, timestamp) }
    return timestamp
  }

  private fun handleTap(label: String, source: String) {
    if (label.isBlank()) return

    OfferDiagnostics.captureTap(label)
    if (store.enabled && store.preferences.estimateEarnings) session.onTap(label, source)
  }

  private fun tapLabel(event: AccessibilityEvent): String {
    val eventText = OfferParser.joinParts(event.text.map { it.toString() })
    if (eventText.isNotBlank()) return eventText
    return event.source?.let { collectText(it, MAX_TAP_NODES) }.orEmpty()
  }

  private fun scanWindow() = process(monitoredRoots().joinToString(" | ", transform = ::collectText))

  private fun process(text: String) {
    if (text.isNotEmpty()) OfferDiagnostics.capture(text)
    if (!store.enabled) return

    if (OfferParser.isPartial(text)) store.registerFailedRead()
    session.onScan(OfferParser.parse(text), currentPackage)
  }

  private fun monitoredRoots(): List<AccessibilityNodeInfo> {
    val roots = windows.mapNotNull { it.root } + listOfNotNull(rootInActiveWindow)
    return roots.filter { it.packageName?.toString() == currentPackage }.distinct()
  }

  private fun collectText(root: AccessibilityNodeInfo, maxNodes: Int = MAX_NODES): String {
    val parts = mutableListOf<String>()
    val pending = ArrayDeque(listOf(root))
    var visited = 0
    while (pending.isNotEmpty() && visited < maxNodes) {
      val node = pending.removeFirst()
      visited++
      if (node.isVisibleToUser) {
        node.text?.let { parts.add(it.toString()) }
        node.contentDescription?.let { parts.add(it.toString()) }
      }
      for (index in 0 until node.childCount) node.getChild(index)?.let { pending.addLast(it) }
    }
    return OfferParser.joinParts(parts)
  }

  companion object {
    private const val SCAN_DELAY_MS = 300L
    private const val MAX_NODES = 1500
    private const val MAX_TAP_NODES = 12

    @Volatile
    var instance: OfferAccessibilityService? = null
      private set
  }
}
