package app.motorista.copilot

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

object DismissZoneRule {
  private const val TOP_FRACTION = 0.82f

  fun contains(rawY: Float, screenHeight: Int): Boolean = rawY >= screenHeight * TOP_FRACTION
}

class DismissZone(
  private val context: Context,
  private val windowManager: WindowManager,
  private val windowType: Int,
  private val label: String,
) {
  private val circleBackground = GradientDrawable().apply {
    shape = GradientDrawable.OVAL
    setColor(IDLE_COLOR)
    setStroke(dp(1), STROKE_COLOR)
  }
  private val circle = FrameLayout(context).apply {
    background = circleBackground
    elevation = dp(ELEVATION_DP).toFloat()
    addView(
      ImageView(context).apply {
        setImageResource(R.drawable.ic_panel_close)
        imageTintList = ColorStateList.valueOf(Color.WHITE)
      },
      FrameLayout.LayoutParams(dp(ICON_DP), dp(ICON_DP), Gravity.CENTER),
    )
  }
  private val caption = TextView(context).apply {
    text = label
    gravity = Gravity.CENTER
    setTextColor(Color.WHITE)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, LABEL_SP)
    typeface = AppFonts.bold(context)
    setPadding(dp(LABEL_PADDING_H_DP), dp(LABEL_PADDING_V_DP), dp(LABEL_PADDING_H_DP), dp(LABEL_PADDING_V_DP))
    background = GradientDrawable().apply {
      setColor(IDLE_COLOR)
      cornerRadius = dp(LABEL_CORNER_DP).toFloat()
    }
  }
  private val view: View = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    gravity = Gravity.CENTER_HORIZONTAL
    clipChildren = false
    clipToPadding = false
    setPadding(0, dp(PADDING_TOP_DP), 0, dp(PADDING_BOTTOM_DP))
    background = GradientDrawable(GradientDrawable.Orientation.BOTTOM_TOP, intArrayOf(SCRIM_COLOR, Color.TRANSPARENT))
    addView(circle, LinearLayout.LayoutParams(dp(CIRCLE_DP), dp(CIRCLE_DP)))
    addView(
      caption,
      LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(LABEL_GAP_DP) },
    )
  }
  private var hovering = false

  fun show() {
    if (view.parent != null) return

    hovering = false
    paint()
    windowManager.addView(view, layoutParams())
    view.alpha = 0f
    view.translationY = dp(ENTER_OFFSET_DP).toFloat()
    view.animate().alpha(1f).translationY(0f).setDuration(ENTER_MS).setInterpolator(DecelerateInterpolator())
  }

  fun hover(rawY: Float): Boolean {
    val over = contains(rawY)
    if (over == hovering) return over

    hovering = over
    paint()
    if (over) view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
    return over
  }

  fun release(rawY: Float): Boolean {
    val over = contains(rawY)
    hide()
    return over
  }

  fun hide() {
    if (view.parent == null) return

    view.animate().cancel()
    runCatching { windowManager.removeView(view) }
  }

  private fun contains(rawY: Float) = DismissZoneRule.contains(rawY, context.resources.displayMetrics.heightPixels)

  private fun paint() {
    circleBackground.setColor(if (hovering) ACTIVE_COLOR else IDLE_COLOR)
    val scale = if (hovering) ACTIVE_SCALE else 1f
    circle.animate().scaleX(scale).scaleY(scale).setDuration(HOVER_MS).setInterpolator(OvershootInterpolator())
  }

  private fun layoutParams() = WindowManager.LayoutParams(
    WindowManager.LayoutParams.MATCH_PARENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    windowType,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
    PixelFormat.TRANSLUCENT,
  ).apply { gravity = Gravity.BOTTOM }

  private fun dp(value: Int) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP,
    value.toFloat(),
    context.resources.displayMetrics,
  ).toInt()

  private companion object {
    const val IDLE_COLOR = 0xF2171717.toInt()
    const val ACTIVE_COLOR = 0xFFB3261E.toInt()
    const val STROKE_COLOR = 0x3DFFFFFF
    const val SCRIM_COLOR = 0xCC000000.toInt()
    const val ACTIVE_SCALE = 1.2f
    const val CIRCLE_DP = 64
    const val ICON_DP = 28
    const val ELEVATION_DP = 6
    const val PADDING_TOP_DP = 72
    const val PADDING_BOTTOM_DP = 40
    const val LABEL_GAP_DP = 14
    const val LABEL_SP = 14f
    const val LABEL_PADDING_H_DP = 14
    const val LABEL_PADDING_V_DP = 6
    const val LABEL_CORNER_DP = 14
    const val ENTER_OFFSET_DP = 24
    const val ENTER_MS = 160L
    const val HOVER_MS = 120L
  }
}
