package app.motorista.copilot

import android.accessibilityservice.AccessibilityService
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import java.util.concurrent.Executor
import java.util.concurrent.atomic.AtomicBoolean

class OfferAccessibilityService : AccessibilityService() {
  private val handler = Handler(Looper.getMainLooper())
  private val scheduler = HandlerOfferScheduler()
  private val scanThread = HandlerThread("OfferScan").apply { start() }
  private val scanHandler = Handler(scanThread.looper)
  private val scanning = AtomicBoolean(false)
  private val textTracker = OfferTextTracker()
  private val imageTracker = OfferTextTracker()
  private val windowGate = WindowEventGate(System::currentTimeMillis)
  private val treeReader = OfferTreeReader(this)
  private lateinit var store: CopilotStore
  private lateinit var card: OfferCard
  private lateinit var voice: OfferVoice
  private lateinit var notifier: OfferNotifier
  private lateinit var session: OfferSession
  private lateinit var pacer: ScanPacer
  private lateinit var imageReader: OfferImageReader
  private val floating = FloatingOfferChannel { session.dismiss() }
  private var mockReceiver: OfferMockReceiver? = null
  private var inTrip = false
  private var offerOnScreen = false

  @Volatile
  private var currentPackage = ""

  @Volatile
  private var imageSource = ""

  @Volatile
  private var monitoredPackages: Set<String> = CopilotPreferences.DEFAULT_PACKAGES

  private var lastEventAt = 0L

  val voiceAvailable: Boolean
    get() = voice.available

  override fun onCreate() {
    super.onCreate()
    store = CopilotStore.get(this)
    card = OfferCard(this, store) { session.dismiss() }
    voice = OfferVoice(this)
    notifier = OfferNotifier(this)
    session = OfferSession(
      channels = ::activeChannels,
      preferences = { store.preferences },
      evaluate = { offer, source -> OfferEvaluator.evaluate(offer, store.targets, OfferSources.label(source)) },
      record = { evaluation, source -> recordOffer(evaluation, source) },
      markOutcome = { offerId, outcome -> scanHandler.post { runCatching { store.markOutcome(offerId, outcome) } } },
      scheduler = scheduler,
      refine = { offerId, evaluation -> scanHandler.post { runCatching { store.refine(offerId, evaluation) } } },
      onPresentationChange = windowGate::noteOwnWindowChange,
    )
    pacer = ScanPacer(
      scheduler = scheduler,
      now = System::currentTimeMillis,
      intervalMs = { OfferReadPolicy.scanIntervalMs(session.presenting, inTrip, offerOnScreen) },
      scan = ::requestScan,
    )
    imageReader = OfferImageReader(this, Executor { scanHandler.post(it) }, ::onImageText)
  }

  override fun onServiceConnected() {
    instance = this
    ShiftTimer(this).restoreAlarm()
    if (OfferMockReceiver.isAllowed(this)) mockReceiver = OfferMockReceiver(this).also { it.register(this) }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || (!store.enabled && !OfferDiagnostics.enabled)) return

    monitoredPackages = store.preferences.monitoredPackages
    if (event.eventType == AccessibilityEvent.TYPE_WINDOWS_CHANGED) return onWindowsChanged()

    val source = event.packageName?.toString() ?: return
    if (source !in monitoredPackages) return

    if (event.eventType == AccessibilityEvent.TYPE_VIEW_CLICKED) return handleTap(tapLabel(event), source)

    currentPackage = source
    lastEventAt = System.currentTimeMillis()
    if (event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) pacer.request() else pacer.startBurst()
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    mockReceiver?.let { unregisterReceiver(it) }
    handler.removeCallbacksAndMessages(null)
    scheduler.cancelAll()
    allChannels().forEach { runCatching { it.hide() } }
    voice.release()
    imageReader.release()
    scanThread.quitSafely()
    instance = null
    super.onDestroy()
  }

  fun preview(offer: ParsedOffer, source: String) = session.preview(offer, source)

  fun mockTap(label: String) = handleTap(label, currentPackage)

  fun mockScan(text: String, source: String) {
    currentPackage = source
    lastEventAt = System.currentTimeMillis()
    scanHandler.post { runCatching { readScan(ScreenScan(source, visible = true, text = text, simulated = true)) } }
  }

  private fun onWindowsChanged() {
    if (windowGate.allowsBurst()) pacer.startBurst()
  }

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

  private fun recordOffer(evaluation: OfferEvaluation, source: String): Long {
    val timestamp = System.currentTimeMillis()
    scanHandler.post { runCatching { store.record(evaluation, source, timestamp) } }
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
    return event.source?.let(treeReader::tapText).orEmpty()
  }

  private fun requestScan() {
    if (!scanning.compareAndSet(false, true)) return

    scanHandler.post {
      runCatching { readScan(treeReader.scan(monitoredPackages, currentPackage)) }
      scanning.set(false)
    }
  }

  private fun readScan(scan: ScreenScan) {
    if (scan.visible) currentPackage = scan.source else imageTracker.reset()
    val read = textTracker.read(scan.text)
    if (read.changed && scan.text.isNotEmpty()) OfferDiagnostics.capture(scan.text)
    handler.post { onTextRead(read, scan) }
  }

  private fun onTextRead(read: TextRead, scan: ScreenScan) {
    inTrip = read.inTrip
    offerOnScreen = read.offer != null
    if (!scan.visible) session.onSourceGone()
    if (!scan.visible && !recentlyActive()) pacer.stopBurst()
    if (!store.enabled) return

    if (read.countFailure) store.registerFailedRead()
    if (read.changed || read.offer != null) session.onScan(read.offer, scan.source)
    if (read.offer != null && !scan.simulated) pacer.watch()
    if (shouldReadImage(read, scan.source)) {
      imageSource = scan.source
      imageReader.capture()
    }
  }

  private fun shouldReadImage(read: TextRead, source: String) = OfferReadPolicy.shouldReadImage(
    ImageReadRequest(
      enabled = store.preferences.imageReading,
      source = source,
      offerFound = read.offer != null,
      changed = read.changed,
      bursting = pacer.bursting,
      presenting = session.presenting,
      recentlyActive = recentlyActive(),
      inTrip = read.inTrip,
    ),
  )

  private fun recentlyActive() = System.currentTimeMillis() - lastEventAt < RECENT_EVENT_MS

  private fun onImageText(text: String) {
    if (text.isEmpty()) return

    OfferDiagnostics.captureImage(text)
    val read = runCatching { imageTracker.read(text) }.getOrNull() ?: return
    val source = imageSource
    handler.post { onImageRead(read, source) }
  }

  private fun onImageRead(read: TextRead, source: String) {
    if (!store.enabled || !read.changed) return

    if (read.countFailure) store.registerFailedRead()
    val offer = read.offer ?: return
    session.onImageScan(offer, source)
    pacer.stopBurst()
  }

  companion object {
    private const val RECENT_EVENT_MS = 3000L

    @Volatile
    var instance: OfferAccessibilityService? = null
      private set
  }
}
