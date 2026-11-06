package app.motorista.copilot

import android.content.Context
import android.content.res.Configuration
import android.graphics.Color

data class CardPalette(
  val surface: Int,
  val text: Int,
  val muted: Int,
  val positive: Int,
  val negative: Int,
)

private val DAY_PALETTE = CardPalette(Color.WHITE, 0xFF171717.toInt(), 0xFF5E5E5E.toInt(), 0xFF0B6E3E.toInt(), 0xFFB3261E.toInt())
private val NIGHT_PALETTE = CardPalette(0xFF1C1C1C.toInt(), 0xFFF5F5F5.toInt(), 0xFFA8A8A8.toInt(), 0xFF4FD08D.toInt(), 0xFFFF8A80.toInt())

class CardTheme(private val context: Context) {
  fun isNight(theme: ThemeMode): Boolean {
    if (theme != ThemeMode.SYSTEM) return theme == ThemeMode.DARK
    val mode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    return mode == Configuration.UI_MODE_NIGHT_YES
  }

  fun palette(theme: ThemeMode) = if (isNight(theme)) NIGHT_PALETTE else DAY_PALETTE
}
