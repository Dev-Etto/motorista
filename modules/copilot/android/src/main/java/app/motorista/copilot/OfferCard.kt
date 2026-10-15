package app.motorista.copilot

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView

class OfferCard(private val context: Context) {
  private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val handler = Handler(Looper.getMainLooper())
  private var current: View? = null

  fun show(evaluation: OfferEvaluation) {
    hide()
    val view = build(evaluation)
    windowManager.addView(view, layoutParams())
    current = view
    handler.postDelayed({ hide() }, VISIBLE_MS)
  }

  fun hide() {
    handler.removeCallbacksAndMessages(null)
    val view = current ?: return
    windowManager.removeView(view)
    current = null
  }

  private fun layoutParams() = WindowManager.LayoutParams(
    WindowManager.LayoutParams.MATCH_PARENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
    PixelFormat.TRANSLUCENT,
  ).apply {
    gravity = Gravity.TOP
    y = dp(SCREEN_MARGIN_DP)
  }

  private fun build(evaluation: OfferEvaluation): View {
    val card = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(16), dp(12), dp(16), dp(12))
      background = GradientDrawable().apply {
        setColor(evaluation.color.argb)
        cornerRadius = dp(16).toFloat()
      }
    }
    card.addView(text(OfferFormat.money(evaluation.profitCents) + " de lucro estimado", TITLE_SP))
    card.addView(
      text(
        "${OfferFormat.money(evaluation.perKmCents)}/km  •  ${OfferFormat.money(evaluation.perHourCents)}/h",
        BODY_SP,
      ),
    )
    return LinearLayout(context).apply {
      setPadding(dp(SCREEN_MARGIN_DP), 0, dp(SCREEN_MARGIN_DP), 0)
      addView(card, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
    }
  }

  private fun text(value: String, sizeSp: Float) = TextView(context).apply {
    text = value
    setTextColor(Color.WHITE)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
  }

  private fun dp(value: Int) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP,
    value.toFloat(),
    context.resources.displayMetrics,
  ).toInt()

  private companion object {
    const val VISIBLE_MS = 12000L
    const val SCREEN_MARGIN_DP = 12
    const val TITLE_SP = 18f
    const val BODY_SP = 15f
  }
}
