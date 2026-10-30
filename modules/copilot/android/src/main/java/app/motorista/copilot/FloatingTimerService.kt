package app.motorista.copilot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

class FloatingTimerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val closeMenu = Runnable { setMenuOpen(false) }
  private val closeOffer = Runnable { clearOffer() }
  private lateinit var windowManager: WindowManager
  private lateinit var timer: ShiftTimer
  private lateinit var store: CopilotStore
  private lateinit var cardView: OfferCardView
  private lateinit var root: FrameLayout
  private lateinit var pill: LinearLayout
  private lateinit var logo: ImageView
  private lateinit var clockLabel: TextView
  private lateinit var toggleLabel: TextView
  private lateinit var lastOfferLabel: TextView
  private lateinit var menu: LinearLayout
  private lateinit var params: WindowManager.LayoutParams
  private var lastOffer: OfferEvaluation? = null
  private var showingOffer = false

  val visibleOutsideApp: Boolean
    get() = !appInForeground

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
    addWindow()
    handler.post(tick)
    instance = this
  }

  override fun onDestroy() {
    instance = null
    handler.removeCallbacksAndMessages(null)
    windowManager.removeView(root)
    super.onDestroy()
  }

  fun showOffer(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    lastOffer = evaluation
    handler.removeCallbacks(closeOffer)
    val shown = if (preferences.card) preferences else preferences.copy(cardLayout = CardLayout.SUMMARY)
    renderCard(evaluation, shown)
  }

  fun clearOffer() {
    handler.removeCallbacks(closeOffer)
    if (!showingOffer) return

    showingOffer = false
    root.removeAllViews()
    root.addView(pill)
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
    logo = ImageView(this).apply {
      setImageResource(R.drawable.ic_stat_motorista)
      val padding = dp(LOGO_PADDING_DP)
      setPadding(padding, padding, padding, padding)
    }
    clockLabel = label("", TIMER_SP)
    toggleLabel = menuRow("Iniciar") { toggleTimer() }
    lastOfferLabel = menuRow("Última oferta") { showLastOffer() }
    menu = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      addView(toggleLabel)
      addView(lastOfferLabel)
      addView(menuRow("Abrir app") { openApp() })
      addView(menuRow("Ocultar") { stopSelf() })
    }
    val handle = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER
      minimumHeight = dp(HANDLE_DP)
      minimumWidth = dp(HANDLE_DP)
      addView(logo, LinearLayout.LayoutParams(dp(LOGO_DP), dp(LOGO_DP)))
      addView(clockLabel)
    }
    pill = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      background = GradientDrawable().apply {
        setColor(PILL_COLOR)
        cornerRadius = dp(CORNER_DP).toFloat()
      }
      addView(handle)
      addView(menu)
    }
    root = FrameLayout(this)
    root.addView(pill)
    params = windowParams()
    WindowDrag.attach(
      handle = handle,
      window = root,
      params = params,
      windowManager = windowManager,
      clamp = { x, y -> x to clampPillY(y) },
      onEnd = { x, y -> getSharedPreferences(FILE, Context.MODE_PRIVATE).edit().putInt(KEY_X, x).putInt(KEY_Y, y).apply() },
      onTap = { setMenuOpen(menu.visibility != View.VISIBLE) },
    )
    windowManager.addView(root, params)
    setMenuOpen(false)
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
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = saved.getInt(KEY_X, dp(INITIAL_OFFSET_DP))
      y = clampPillY(saved.getInt(KEY_Y, dp(INITIAL_OFFSET_DP) * 4))
    }
  }

  private fun setMenuOpen(open: Boolean) {
    handler.removeCallbacks(closeMenu)
    menu.visibility = if (open) View.VISIBLE else View.GONE
    if (open) handler.postDelayed(closeMenu, MENU_CLOSE_MS)
    refresh()
  }

  private fun toggleTimer() {
    if (timer.state().running) timer.pause() else timer.start()
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
    if (showingOffer) return

    val state = timer.state()
    logo.visibility = if (state.started) View.GONE else View.VISIBLE
    clockLabel.visibility = if (state.started) View.VISIBLE else View.GONE
    clockLabel.text = OfferFormat.clock(state.elapsedMs)
    toggleLabel.text = if (state.running) "Pausar" else if (state.started) "Retomar" else "Iniciar cronômetro"
    lastOfferLabel.visibility = if (lastOffer == null) View.GONE else View.VISIBLE
    root.alpha = if (menu.visibility == View.VISIBLE || state.running) 1f else IDLE_ALPHA
  }

  private fun menuRow(value: String, onClick: () -> Unit) = label(value, MENU_SP).apply {
    setOnClickListener { onClick() }
  }

  private fun label(value: String, sizeSp: Float) = TextView(this).apply {
    text = value
    setTextColor(Color.WHITE)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
    typeface = Typeface.DEFAULT_BOLD
    gravity = Gravity.CENTER
    minHeight = dp(TOUCH_TARGET_DP)
    setPadding(dp(PADDING_DP), 0, dp(PADDING_DP), 0)
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
    private const val MENU_CLOSE_MS = 6000L
    private const val PILL_COLOR = 0xFF0B3C49.toInt()
    private const val IDLE_ALPHA = 0.8f
    private const val CORNER_DP = 18
    private const val INITIAL_OFFSET_DP = 24
    private const val TOUCH_TARGET_DP = 64
    private const val HANDLE_DP = 56
    private const val LOGO_DP = 44
    private const val LOGO_PADDING_DP = 8
    private const val PADDING_DP = 14
    private const val TIMER_SP = 20f
    private const val MENU_SP = 18f

    @Volatile
    var instance: FloatingTimerService? = null
      private set

    @Volatile
    private var appInForeground = true

    fun setAppInForeground(value: Boolean) {
      appInForeground = value
      instance?.applyVisibility()
    }
  }
}
