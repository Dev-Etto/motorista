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
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout

class FloatingTimerService : Service(), FloatingHost {
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
  private var offerDismiss: () -> Unit = {}
  private lateinit var dismissZone: DismissZone
  private lateinit var hideZone: DismissZone
  private var motionStart: CardMotionStart? = null
  private var pillWidth = 0
  private var pillHeight = 0

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
    cardView = OfferCardView(this)
    dismissZone = DismissZone(this, windowManager, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, "Solte aqui para fechar")
    hideZone = DismissZone(this, windowManager, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, "Solte aqui para ocultar")
    goForeground()
    if (!Settings.canDrawOverlays(this)) return stopSelf()

    addWindow()
    instance = this
  }

  override fun onDestroy() {
    instance = null
    handler.removeCallbacksAndMessages(null)
    if (::dismissZone.isInitialized) dismissZone.hide()
    if (::hideZone.isInitialized) hideZone.hide()
    if (::root.isInitialized && root.isAttachedToWindow) windowManager.removeView(root)
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
    if (!showingOffer) return

    dismissZone.hide()
    showingOffer = false
    val card = root.getChildAt(0)
    val start = motionStart ?: return showPill()
    card.setOnTouchListener(null)
    card.animate()
      .scaleX(start.scaleX)
      .scaleY(start.scaleY)
      .alpha(0f)
      .setDuration(OfferCardMotion.CLOSE_MS)
      .setInterpolator(AccelerateInterpolator())
      .withEndAction { if (!showingOffer && root.isAttachedToWindow) showPill() }
  }

  private fun showPill() {
    root.removeAllViews()
    root.setPadding(0, 0, 0, 0)
    root.addView(panel.view)
    restorePillPosition()
    refresh()
  }

  private fun renderCard(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    setMenuOpen(false)
    val cameFromPill = !showingOffer
    rememberPillSize()
    root.getChildAt(0)?.animate()?.cancel()
    root.removeAllViews()
    val margin = dp(SHADOW_MARGIN_DP)
    root.setPadding(margin, margin, margin, margin)
    val card = cardView.build(evaluation, preferences)
    root.addView(card, FrameLayout.LayoutParams(cardView.width(), ViewGroup.LayoutParams.WRAP_CONTENT))
    showingOffer = true
    card.measure(
      View.MeasureSpec.makeMeasureSpec(cardView.width(), View.MeasureSpec.EXACTLY),
      View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
    )
    placeCard(card.measuredHeight + margin * 2)
    WindowDrag.attach(
      handle = card,
      window = root,
      params = params,
      windowManager = windowManager,
      clamp = { x, y -> clampToScreen(x, y) },
      onEnd = { x, y -> store.cardPosition = x to y },
      onTap = { offerDismiss() },
      dismissZone = dismissZone,
      onDismiss = { offerDismiss() },
    )
    root.alpha = 1f
    root.background = null
    windowManager.updateViewLayout(root, params)
    if (cameFromPill) animateOpening(card, margin)
  }

  private fun rememberPillSize() {
    if (root.getChildAt(0) !== panel.view || root.width == 0) return

    pillWidth = root.width
    pillHeight = root.height
  }

  private fun animateOpening(card: View, margin: Int) {
    val saved = getSharedPreferences(FILE, Context.MODE_PRIVATE)
    val pill = ScreenRect(
      saved.getInt(KEY_X, dp(INITIAL_OFFSET_DP)),
      clampPillY(saved.getInt(KEY_Y, dp(INITIAL_OFFSET_DP) * 4)),
      pillWidth.coerceAtLeast(1),
      pillHeight.coerceAtLeast(1),
    )
    val start = OfferCardMotion.from(pill, ScreenRect(params.x + margin, params.y + margin, card.measuredWidth, card.measuredHeight))
    motionStart = start
    card.pivotX = start.pivotX
    card.pivotY = start.pivotY
    card.scaleX = start.scaleX
    card.scaleY = start.scaleY
    card.alpha = 0f
    card.animate()
      .scaleX(1f)
      .scaleY(1f)
      .alpha(1f)
      .setDuration(OfferCardMotion.OPEN_MS)
      .setInterpolator(DecelerateInterpolator())
  }

  private fun placeCard(height: Int) {
    val saved = store.cardPosition
    val metrics = resources.displayMetrics
    val width = cardView.width() + dp(SHADOW_MARGIN_DP) * 2
    val x = (saved?.first ?: params.x).coerceIn(0, maxOf(0, metrics.widthPixels - width))
    val preferredY = saved?.second ?: OfferCardMotion.defaultCardY(params.y, height, metrics.heightPixels)
    val y = preferredY.coerceIn(0, maxOf(0, metrics.heightPixels - height))
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
      onHide = { hideButton() },
    )
    root = FrameLayout(this).apply {
      clipToPadding = false
      clipChildren = false
    }
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
      clamp = { x, y -> clampToScreen(x, y) },
      onEnd = { x, y -> settlePill(x, y) },
      onTap = { setMenuOpen(!menuOpen) },
      dismissZone = hideZone,
      onDismiss = { hideButton() },
    )
    windowManager.addView(root, params)
    refresh()
    applyVisibility()
  }

  private fun settlePill(x: Int, y: Int) {
    val settledY = if (menuOpen) y else clampPillY(y)
    getSharedPreferences(FILE, Context.MODE_PRIVATE).edit().putInt(KEY_X, x).putInt(KEY_Y, settledY).apply()
    params.y = settledY
    windowManager.updateViewLayout(root, params)
  }

  private fun applyVisibility() {
    root.visibility = if (visibility.visible) View.VISIBLE else View.GONE
    handler.removeCallbacks(tick)
    if (visibility.visible) handler.post(tick)
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
    offerDismiss = ::clearOffer
    renderCard(evaluation, store.preferences)
    handler.postDelayed(closeOffer, store.preferences.durationSeconds * MS_PER_SECOND)
  }

  private fun hideButton() {
    setMenuOpen(false)
    visibility.hideForNow()
    applyVisibility()
    restorePillPosition()
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
    private const val SHADOW_MARGIN_DP = 20

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
