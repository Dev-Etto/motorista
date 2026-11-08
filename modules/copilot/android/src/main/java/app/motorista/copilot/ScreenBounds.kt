package app.motorista.copilot

import android.content.Context
import android.util.TypedValue

data class ScreenSize(val width: Int, val height: Int)

enum class DockSide { START, END }

object ScreenBounds {
  private const val PILL_AREA_NUMERATOR = 2
  private const val PILL_AREA_DENOMINATOR = 3

  fun clamp(x: Int, y: Int, width: Int, height: Int, screen: ScreenSize): Pair<Int, Int> =
    x.coerceIn(0, maxOf(0, screen.width - width)) to y.coerceIn(0, maxOf(0, screen.height - height))

  fun pillY(y: Int, screenHeight: Int, touchTarget: Int): Int =
    y.coerceIn(0, maxOf(0, screenHeight * PILL_AREA_NUMERATOR / PILL_AREA_DENOMINATOR - touchTarget))

  fun dockX(x: Int, width: Int, screenWidth: Int): Int =
    if (x + width / 2 < screenWidth / 2) 0 else maxOf(0, screenWidth - width)

  fun dockSide(x: Int): DockSide = if (x <= 0) DockSide.START else DockSide.END

  fun of(context: Context): ScreenSize = context.resources.displayMetrics.let { ScreenSize(it.widthPixels, it.heightPixels) }
}

fun Context.dp(value: Int): Int = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()

fun Context.dp(value: Float): Int = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, resources.displayMetrics).toInt()
