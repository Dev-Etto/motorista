package app.motorista.copilot

import android.content.Context
import android.graphics.PixelFormat
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout

class FloatingWindow(private val context: Context, private val windowManager: WindowManager, onOutsideTouch: () -> Unit) {
  val root = FrameLayout(context).apply {
    clipToPadding = false
    clipChildren = false
    setOnTouchListener { _, event ->
      if (event.action == MotionEvent.ACTION_OUTSIDE) onOutsideTouch()
      false
    }
  }

  val params = WindowManager.LayoutParams(
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
    PixelFormat.TRANSLUCENT,
  ).apply { gravity = Gravity.TOP or Gravity.START }

  val attached: Boolean
    get() = root.isAttachedToWindow

  fun moveTo(position: Pair<Int, Int>) {
    params.x = position.first
    params.y = position.second
  }

  fun place(position: Pair<Int, Int>) {
    moveTo(position)
    update()
  }

  fun showOnly(view: View) {
    root.removeAllViews()
    root.setPadding(0, 0, 0, 0)
    root.addView(view)
  }

  fun sizeWhileShowing(view: View): Pair<Int, Int>? {
    if (root.getChildAt(0) !== view || root.width == 0) return null
    return root.width to root.height
  }

  fun attach() = windowManager.addView(root, params)

  fun detach() {
    if (attached) windowManager.removeView(root)
  }

  fun update() = windowManager.updateViewLayout(root, params)

  fun clamp(x: Int, y: Int): Pair<Int, Int> = ScreenBounds.clamp(x, y, root.width, root.height, ScreenBounds.of(context))

  fun fitMeasured(bottomMargin: Int) {
    root.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED)
    val screen = ScreenBounds.of(context)
    moveTo(ScreenBounds.clamp(params.x, params.y, root.measuredWidth, root.measuredHeight + bottomMargin, screen))
    update()
  }
}
