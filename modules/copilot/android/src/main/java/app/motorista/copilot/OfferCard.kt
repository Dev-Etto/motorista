package app.motorista.copilot

import android.content.Context
import android.graphics.PixelFormat
import android.view.Gravity
import android.view.View
import android.view.WindowManager

class OfferCard(
  private val context: Context,
  private val store: CopilotStore,
  private val onDismiss: () -> Unit,
) : OfferChannel {
  private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val cardView = OfferCardView(context)
  private val dismissZone = DismissZone(context, windowManager, WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY, context.getString(R.string.drop_to_close))
  private var current: View? = null

  override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    hide()
    val view = cardView.build(evaluation, preferences)
    val params = layoutParams(view)
    WindowDrag.attach(
      handle = view,
      window = view,
      params = params,
      windowManager = windowManager,
      clamp = { x, y -> clampToScreen(x, y, view) },
      onEnd = { x, y -> store.cardPosition = x to y },
      onTap = onDismiss,
      dismissZone = dismissZone,
      onDismiss = onDismiss,
    )
    windowManager.addView(view, params)
    current = view
  }

  override fun hide() {
    dismissZone.hide()
    val view = current ?: return
    windowManager.removeView(view)
    current = null
  }

  private fun keepInsideScreen(position: Pair<Int, Int>, width: Int, view: View): Pair<Int, Int> {
    view.measure(
      View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
      View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
    )
    return ScreenBounds.clamp(position.first, position.second, width, view.measuredHeight, ScreenBounds.of(context))
  }

  private fun clampToScreen(x: Int, y: Int, view: View): Pair<Int, Int> = ScreenBounds.clamp(x, y, view.width, view.height, ScreenBounds.of(context))

  private fun layoutParams(view: View): WindowManager.LayoutParams {
    val width = cardView.width()
    val saved = store.cardPosition?.let { keepInsideScreen(it, width, view) }
    return WindowManager.LayoutParams(
      width,
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = saved?.first ?: ((context.resources.displayMetrics.widthPixels - width) / 2)
      y = saved?.second ?: context.dp(DEFAULT_TOP_DP)
    }
  }

  private companion object {
    const val DEFAULT_TOP_DP = 56f
  }
}
