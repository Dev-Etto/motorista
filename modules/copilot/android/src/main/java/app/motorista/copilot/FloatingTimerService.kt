package app.motorista.copilot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout

class FloatingTimerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val closeMenu = Runnable { setMenuOpen(false) }
  private val closeOffer = Runnable { clearOffer() }
  private lateinit var windowManager: WindowManager
  private lateinit var timer: ShiftTimer
  private lateinit var store: CopilotStore
  private lateinit var cardView: OfferCardView
  private lateinit var root: FrameLayout
  private lateinit var panel: FloatingPanel
  private lateinit var params: WindowManager.LayoutParams
  private var lastOffer: OfferEvaluation? = null
  private var showingOffer = false
  private var menuOpen = false

  val visibleOutsideApp: Boolean
    get() = !appInForeground && Settings.canDrawOverlays(this)

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
    store = CopilotStore(this)
    cardView = OfferCardView(this)
    goForeground()
    if (!Settings.canDrawOverlays(this)) return stopSelf()

    addWindow()
    handler.post(tick)
    instance = this
  }

  override fun onDestroy() {
    instance = null
    handler.removeCallbacksAndMessages(null)
    if (::root.isInitialized && root.isAttachedToWindow) windowManager.removeView(root)
    super.onDestroy()
  }

  fun showOffer(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    lastOffer = evaluation
    handler.removeCallbacks(closeOffer)
    renderCard(evaluation, preferences)
  }

  fun clearOffer() {
    handler.removeCallbacks(closeOffer)
    if (!showingOffer) return

    showingOffer = false
    root.removeAllViews()
    root.addView(panel.view)
    restorePillPosition()
    refresh()
  }

  private fun renderCard(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    setMenuOpen(false)
    root.removeAllViews()
    val card = cardView.build(evaluation, preferences)
    root.addView(card, FrameLayout.LayoutParams(cardView.width(), ViewGroup.LayoutParams.WRAP_CONTENT))
    showingOffer = true
    placeCard()
    WindowDrag.attach(
      handle = card,
      window = root,
      params = params,
      windowManager = windowManager,
      clamp = { x, y -> clampToScreen(x, y) },
      onEnd = { x, y -> store.cardPosition = x to y },
    )
    root.alpha = 1f
    root.background = null
    windowManager.updateViewLayout(root, params)
  }

  private fun placeCard() {
    val saved = store.cardPosition
    val (x, y) = clampToScreen(saved?.first ?: params.x, saved?.second ?: params.y, cardView.width())
    params.x = x
    params.y = y
  }

  private fun restorePillPosition() {
    val saved = getSharedPreferences(FILE, Context.MODE_PRIVATE)
    params.x = saved.getInt(KEY_X, dp(INITIAL_OFFSET_DP))
    params.y = clampPillY(saved.getInt(KEY_Y, dp(INITIAL_OFFSET_DP) * 4))
    windowManager.updateViewLayout(root, params)
  }

  private fun clampToScreen(x: Int, y: Int, width: Int = root.width): Pair<Int, Int> {
    val metrics = resources.displayMetrics
    return x.coerceIn(0, maxOf(0, metrics.widthPixels - width)) to y.coerceIn(0, maxOf(0, metrics.heightPixels - root.height))
  }

  private fun clampPillY(value: Int): Int {
    val maxY = resources.displayMetrics.heightPixels * 2 / 3 - dp(TOUCH_TARGET_DP)
    return value.coerceIn(0, maxY)
  }

  private fun goForeground() {
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, "Botão flutuante", NotificationManager.IMPORTANCE_LOW))
    val notification = Notification.Builder(this, CHANNEL_ID)
      .setContentTitle("Botão flutuante ativo")
      .setContentText("Mostra o cronômetro e as ofertas sobre os outros apps.")
      .setSmallIcon(R.drawable.ic_stat_motorista)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      return
    }
    startForeground(NOTIFICATION_ID, notification)
  }

  private fun addWindow() {
    panel = FloatingPanel(
      context = this,
      onToggle = { toggleTimer() },
      onLastOffer = { showLastOffer() },
      onOpenApp = { openApp() },
      onHide = { stopSelf() },
    )
    root = FrameLayout(this)
    root.addView(panel.view)
    root.setOnTouchListener { _, event ->
      if (event.action == MotionEvent.ACTION_OUTSIDE) setMenuOpen(false)
      false
    }
    params = windowParams()
    WindowDrag.attach(
      handle = panel.handle,
      window = root,
      params = params,
      windowManager = windowManager,
      clamp = { x, y -> clampToScreen(x, y).first to if (menuOpen) clampToScreen(x, y).second else clampPillY(y) },
      onEnd = { x, y -> getSharedPreferences(FILE, Context.MODE_PRIVATE).edit().putInt(KEY_X, x).putInt(KEY_Y, y).apply() },
      onTap = { setMenuOpen(!menuOpen) },
    )
    windowManager.addView(root, params)
    refresh()
    applyVisibility()
  }

  private fun applyVisibility() {
    root.visibility = if (appInForeground) View.GONE else View.VISIBLE
  }

  private fun windowParams(): WindowManager.LayoutParams {
    val saved = getSharedPreferences(FILE, Context.MODE_PRIVATE)
    return WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = saved.getInt(KEY_X, dp(INITIAL_OFFSET_DP))
      y = clampPillY(saved.getInt(KEY_Y, dp(INITIAL_OFFSET_DP) * 4))
    }
  }

  private fun setMenuOpen(open: Boolean) {
    handler.removeCallbacks(closeMenu)
    val changed = menuOpen != open
    menuOpen = open
    if (open) handler.postDelayed(closeMenu, MENU_CLOSE_MS)
    refresh()
    if (!changed) return

    if (open) fitOpenPanel() else restorePillPosition()
  }

  private fun fitOpenPanel() {
    val metrics = resources.displayMetrics
    root.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED)
    params.x = params.x.coerceIn(0, maxOf(0, metrics.widthPixels - root.measuredWidth))
    params.y = params.y.coerceIn(0, maxOf(0, metrics.heightPixels - root.measuredHeight - dp(SCREEN_BOTTOM_DP)))
    windowManager.updateViewLayout(root, params)
  }

  private fun toggleTimer() {
    if (timer.state().running) timer.pause() else timer.start()
    handler.removeCallbacks(closeMenu)
    handler.postDelayed(closeMenu, MENU_CLOSE_MS)
    refresh()
  }

  private fun showLastOffer() {
    val evaluation = lastOffer ?: return
    renderCard(evaluation, store.preferences)
    handler.postDelayed(closeOffer, store.preferences.durationSeconds * MS_PER_SECOND)
  }

  private fun openApp() {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
    startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    setMenuOpen(false)
  }

  private fun refresh() {
    if (showingOffer || root.visibility != View.VISIBLE) return

    val state = timer.state()
    panel.render(state, lastOffer, menuOpen, store.preferences.theme)
    root.alpha = if (menuOpen || state.running) 1f else IDLE_ALPHA
  }

  private fun dp(value: Int) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP,
    value.toFloat(),
    resources.displayMetrics,
  ).toInt()

  companion object {
    private const val CHANNEL_ID = "floating_timer"
    private const val NOTIFICATION_ID = 4201
    private const val FILE = "floating_button"
    private const val KEY_X = "x"
    private const val KEY_Y = "y"
    private const val TICK_MS = 1000L
    private const val MS_PER_SECOND = 1000L
    private const val MENU_CLOSE_MS = 8000L
    private const val IDLE_ALPHA = 0.8f
    private const val INITIAL_OFFSET_DP = 24
    private const val TOUCH_TARGET_DP = 64
    private const val SCREEN_BOTTOM_DP = 48

    @Volatile
    var instance: FloatingTimerService? = null
      private set

    @Volatile
    private var appInForeground = false

    fun setAppInForeground(value: Boolean) {
      appInForeground = value
      instance?.applyVisibility()
    }
  }
}
