package app.motorista.copilot

import android.content.Context

class PillPositionStore(private val context: Context) {
  private val prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  fun load(): Pair<Int, Int> {
    val offset = context.dp(INITIAL_OFFSET_DP)
    return prefs.getInt(KEY_X, ScreenBounds.of(context).width) to clampY(prefs.getInt(KEY_Y, offset * INITIAL_Y_FACTOR))
  }

  fun save(x: Int, y: Int) = prefs.edit().putInt(KEY_X, x).putInt(KEY_Y, y).apply()

  fun clampY(y: Int): Int = ScreenBounds.pillY(y, ScreenBounds.of(context).height, context.dp(TOUCH_TARGET_DP))

  private companion object {
    const val FILE = "floating_button"
    const val KEY_X = "x"
    const val KEY_Y = "y"
    const val INITIAL_OFFSET_DP = 24
    const val INITIAL_Y_FACTOR = 4
    const val TOUCH_TARGET_DP = 64
  }
}
