package app.motorista.copilot

import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import kotlin.math.abs

object WindowDrag {
  private const val TAP_SLOP_PX = 24

  fun attach(
    handle: View,
    window: View,
    params: WindowManager.LayoutParams,
    windowManager: WindowManager,
    clamp: (x: Int, y: Int) -> Pair<Int, Int>,
    onEnd: (x: Int, y: Int) -> Unit = { _, _ -> },
    onTap: () -> Unit = {},
  ) {
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    handle.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          downX = event.rawX
          downY = event.rawY
          startX = params.x
          startY = params.y
        }
        MotionEvent.ACTION_MOVE -> {
          val (x, y) = clamp(startX + (event.rawX - downX).toInt(), startY + (event.rawY - downY).toInt())
          params.x = x
          params.y = y
          windowManager.updateViewLayout(window, params)
        }
        MotionEvent.ACTION_UP -> {
          val moved = abs(event.rawX - downX) + abs(event.rawY - downY)
          if (moved < TAP_SLOP_PX) onTap() else onEnd(params.x, params.y)
        }
      }
      true
    }
  }
}
