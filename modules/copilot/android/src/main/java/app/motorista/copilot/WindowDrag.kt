package app.motorista.copilot

import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import kotlin.math.abs

object WindowDrag {
  private const val SLOP_FACTOR = 2
  private const val OVER_ZONE_SCALE = 0.8f
  private const val OVER_ZONE_MS = 120L

  fun attach(
    handle: View,
    window: View,
    params: WindowManager.LayoutParams,
    windowManager: WindowManager,
    clamp: (x: Int, y: Int) -> Pair<Int, Int>,
    onEnd: (x: Int, y: Int) -> Unit = { _, _ -> },
    onTap: () -> Unit = {},
    dismissZone: DismissZone? = null,
    onDismiss: () -> Unit = {},
  ) {
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    var dragging = false
    var overZone = false
    val setOverZone = { over: Boolean ->
      if (over != overZone) {
        overZone = over
        val scale = if (over) OVER_ZONE_SCALE else 1f
        window.animate().scaleX(scale).scaleY(scale).setDuration(OVER_ZONE_MS)
      }
    }
    val settle = {
      overZone = false
      window.animate().cancel()
      window.scaleX = 1f
      window.scaleY = 1f
    }
    val slop = ViewConfiguration.get(handle.context).scaledTouchSlop * SLOP_FACTOR
    handle.isClickable = true
    handle.setOnClickListener { onTap() }
    handle.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          downX = event.rawX
          downY = event.rawY
          startX = params.x
          startY = params.y
          dragging = false
        }
        MotionEvent.ACTION_MOVE -> {
          val deltaX = event.rawX - downX
          val deltaY = event.rawY - downY
          if (!dragging && (abs(deltaX) >= slop || abs(deltaY) >= slop)) {
            dragging = true
            dismissZone?.show()
          }
          if (dragging) {
            dismissZone?.let { setOverZone(it.hover(event.rawY)) }
            val (x, y) = clamp(startX + deltaX.toInt(), startY + deltaY.toInt())
            params.x = x
            params.y = y
            windowManager.updateViewLayout(window, params)
          }
        }
        MotionEvent.ACTION_UP -> {
          settle()
          when {
            !dragging -> handle.performClick()
            dismissZone?.release(event.rawY) == true -> onDismiss()
            else -> onEnd(params.x, params.y)
          }
        }
        MotionEvent.ACTION_CANCEL -> if (dragging) {
          settle()
          dismissZone?.hide()
          onEnd(params.x, params.y)
        }
      }
      true
    }
  }
}
