package app.motorista.copilot

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.View
import android.view.WindowManager

class FloatingTimerService : Service(), FloatingHost {
  private val handler = Handler(Looper.getMainLooper())
  private val closeMenu = Runnable { setMenuOpen(false) }
  private val closeOffer = Runnable { clearOffer() }
  private lateinit var windowManager: WindowManager
  private lateinit var timer: ShiftTimer
  private lateinit var store: CopilotStore
  private lateinit var pill: PillPositionStore
  private lateinit var window: FloatingWindow
  private lateinit var panel: FloatingPanel
  private lateinit var cards: FloatingCardPresenter
  private lateinit var dismissZone: DismissZone
  private lateinit var hideZone: DismissZone
  private var lastOffer: OfferEvaluation? = null
  private var menuOpen = false
  private var offerDismiss: () -> Unit = {}
  private var pillSize = 0 to 0

  override val visibleOutsideApp: Boolean
    get() = visibility.visible && Settings.canDrawOverlays(this)

  private val tick = object : Runnable {
    override fun run() {
      refresh()
      handler.postDelayed(this, TICK_MS)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    timer = ShiftTimer(this)
    store = CopilotStore.get(this)
    pill = PillPositionStore(this)
    dismissZone = DismissZone(this, windowManager, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, copilotText(R.string.drop_to_close))
    hideZone = DismissZone(this, windowManager, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, copilotText(R.string.drop_to_hide))
    ForegroundNotification.start(this)
    if (!Settings.canDrawOverlays(this)) return stopSelf()

    addWindow()
    instance = this
  }

  override fun onDestroy() {
    instance = null
    handler.removeCallbacksAndMessages(null)
    if (::dismissZone.isInitialized) dismissZone.hide()
    if (::hideZone.isInitialized) hideZone.hide()
    if (::window.isInitialized) window.detach()
    super.onDestroy()
  }

  override fun showOffer(evaluation: OfferEvaluation, preferences: CopilotPreferences, onDismiss: () -> Unit) {
    lastOffer = evaluation
    offerDismiss = onDismiss
    handler.removeCallbacks(closeOffer)
    renderCard(evaluation, preferences)
  }

  override fun clearOffer() {
    handler.removeCallbacks(closeOffer)
    cards.hide(::showPill)
  }

  private fun renderCard(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    setMenuOpen(false)
    pillSize = window.sizeWhileShowing(panel.view) ?: pillSize
    cards.show(evaluation, preferences, pillSize) { offerDismiss() }
  }

  private fun showPill() {
    window.showOnly(panel.view)
    window.place(pill.load())
    refresh()
  }

  private fun addWindow() {
    panel = FloatingPanel(
      context = this,
      onToggle = { toggleTimer() },
      onLastOffer = { showLastOffer() },
      onOpenApp = { openApp() },
      onHide = { hideButton() },
    )
    window = FloatingWindow(this, windowManager) { setMenuOpen(false) }
    cards = FloatingCardPresenter(this, window, windowManager, store, pill, dismissZone)
    window.root.addView(panel.view)
    window.moveTo(pill.load())
    WindowDrag.attach(
      handle = panel.handle,
      window = window.root,
      params = window.params,
      windowManager = windowManager,
      clamp = { x, y -> window.clamp(x, y) },
      onEnd = { x, y -> settlePill(x, y) },
      onTap = { setMenuOpen(!menuOpen) },
      dismissZone = hideZone,
      onDismiss = { hideButton() },
    )
    window.attach()
    refresh()
    applyVisibility()
  }

  private fun settlePill(x: Int, y: Int) {
    val settledY = if (menuOpen) y else pill.clampY(y)
    pill.save(x, settledY)
    window.params.y = settledY
    window.update()
  }

  private fun applyVisibility() {
    window.root.visibility = if (visibility.visible) View.VISIBLE else View.GONE
    handler.removeCallbacks(tick)
    if (visibility.visible) handler.post(tick)
  }

  private fun setMenuOpen(open: Boolean) {
    handler.removeCallbacks(closeMenu)
    val changed = menuOpen != open
    menuOpen = open
    if (open) handler.postDelayed(closeMenu, MENU_CLOSE_MS)
    refresh()
    if (!changed) return
    if (open) return window.fitMeasured(dp(SCREEN_BOTTOM_DP))

    window.place(pill.load())
  }

  private fun toggleTimer() {
    if (timer.state().running) timer.pause() else timer.start()
    handler.removeCallbacks(closeMenu)
    handler.postDelayed(closeMenu, MENU_CLOSE_MS)
    refresh()
  }

  private fun showLastOffer() {
    val evaluation = lastOffer ?: return
    offerDismiss = ::clearOffer
    renderCard(evaluation, store.preferences)
    handler.postDelayed(closeOffer, store.preferences.durationSeconds * MS_PER_SECOND)
  }

  private fun hideButton() {
    setMenuOpen(false)
    visibility.hideForNow()
    applyVisibility()
    window.place(pill.load())
  }

  private fun openApp() {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
    startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    setMenuOpen(false)
  }

  private fun refresh() {
    if (cards.showing || window.root.visibility != View.VISIBLE) return

    val state = timer.state()
    panel.render(state, lastOffer, menuOpen, store.preferences.theme, OfferFormat.of(this, store.preferences.regional))
    window.root.alpha = if (menuOpen || state.running) 1f else IDLE_ALPHA
  }

  companion object {
    private const val TICK_MS = 1000L
    private const val MS_PER_SECOND = 1000L
    private const val MENU_CLOSE_MS = 8000L
    private const val IDLE_ALPHA = 0.8f
    private const val SCREEN_BOTTOM_DP = 48

    @Volatile
    var instance: FloatingTimerService? = null
      private set

    private val visibility = FloatingVisibility()

    fun setAppInForeground(value: Boolean) {
      visibility.onAppForeground(value)
      instance?.applyVisibility()
    }
  }
}
