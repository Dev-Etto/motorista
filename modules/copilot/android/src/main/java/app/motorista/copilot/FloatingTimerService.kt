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
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs

class FloatingTimerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var windowManager: WindowManager
  private lateinit var timer: ShiftTimer
  private lateinit var bubble: LinearLayout
  private lateinit var timeLabel: TextView
  private lateinit var toggleLabel: TextView
  private var expanded = false

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
    goForeground()
    addBubble()
    handler.post(tick)
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    windowManager.removeView(bubble)
    super.onDestroy()
  }

  private fun goForeground() {
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, "Botão flutuante", NotificationManager.IMPORTANCE_LOW))
    val notification = Notification.Builder(this, CHANNEL_ID)
      .setContentTitle("Botão flutuante ativo")
      .setContentText("Mostra o cronômetro da jornada sobre os outros apps.")
      .setSmallIcon(android.R.drawable.ic_menu_recent_history)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      return
    }
    startForeground(NOTIFICATION_ID, notification)
  }

  private fun addBubble() {
    timeLabel = label("00:00")
    toggleLabel = label("Pausar").apply { setOnClickListener { toggleTimer() } }
    val openLabel = label("Abrir app").apply { setOnClickListener { openApp() } }
    bubble = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      background = GradientDrawable().apply {
        setColor(BUBBLE_COLOR)
        cornerRadius = dp(CORNER_DP).toFloat()
      }
      addView(timeLabel)
      addView(toggleLabel)
      addView(openLabel)
    }
    val params = bubbleParams()
    attachDrag(params)
    windowManager.addView(bubble, params)
    renderExpanded()
  }

  private fun bubbleParams() = WindowManager.LayoutParams(
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
    PixelFormat.TRANSLUCENT,
  ).apply {
    gravity = Gravity.TOP or Gravity.START
    x = dp(INITIAL_OFFSET_DP)
    y = dp(INITIAL_OFFSET_DP) * 4
  }

  private fun attachDrag(params: WindowManager.LayoutParams) {
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    timeLabel.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          downX = event.rawX
          downY = event.rawY
          startX = params.x
          startY = params.y
        }
        MotionEvent.ACTION_MOVE -> {
          params.x = startX + (event.rawX - downX).toInt()
          params.y = startY + (event.rawY - downY).toInt()
          windowManager.updateViewLayout(bubble, params)
        }
        MotionEvent.ACTION_UP -> {
          val moved = abs(event.rawX - downX) + abs(event.rawY - downY)
          if (moved < dp(TAP_SLOP_DP)) toggleExpanded()
        }
      }
      true
    }
  }

  private fun toggleExpanded() {
    expanded = !expanded
    renderExpanded()
  }

  private fun renderExpanded() {
    val visibility = if (expanded) View.VISIBLE else View.GONE
    toggleLabel.visibility = visibility
    for (index in 2 until bubble.childCount) bubble.getChildAt(index).visibility = visibility
  }

  private fun toggleTimer() {
    val state = timer.state()
    if (state.running) timer.pause() else timer.start()
    refresh()
  }

  private fun openApp() {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
    startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    expanded = false
    renderExpanded()
  }

  private fun refresh() {
    val state = timer.state()
    timeLabel.text = formatElapsed(state.elapsedMs)
    toggleLabel.text = if (state.running) "Pausar" else "Iniciar"
  }

  private fun formatElapsed(elapsedMs: Long): String {
    val totalMinutes = elapsedMs / 60000
    return "%02d:%02d".format(totalMinutes / 60, totalMinutes % 60)
  }

  private fun label(value: String) = TextView(this).apply {
    text = value
    setTextColor(Color.WHITE)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, LABEL_SP)
    gravity = Gravity.CENTER
    minHeight = dp(TOUCH_TARGET_DP)
    minWidth = dp(TOUCH_TARGET_DP)
    setPadding(dp(PADDING_DP), 0, dp(PADDING_DP), 0)
  }

  private fun dp(value: Int) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP,
    value.toFloat(),
    resources.displayMetrics,
  ).toInt()

  private companion object {
    const val CHANNEL_ID = "floating_timer"
    const val NOTIFICATION_ID = 4201
    const val TICK_MS = 1000L
    const val BUBBLE_COLOR = 0xEE0B3C49.toInt()
    const val CORNER_DP = 16
    const val INITIAL_OFFSET_DP = 24
    const val TAP_SLOP_DP = 10
    const val TOUCH_TARGET_DP = 48
    const val PADDING_DP = 12
    const val LABEL_SP = 16f
  }
}
