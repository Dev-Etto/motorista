package app.motorista.copilot

data class ScreenRect(val x: Int, val y: Int, val width: Int, val height: Int)

data class CardMotionStart(val scaleX: Float, val scaleY: Float, val pivotX: Float, val pivotY: Float)

object OfferCardMotion {
  const val OPEN_MS = 200L
  const val CLOSE_MS = 140L

  fun cardY(preferredY: Int, cardHeight: Int, screenHeight: Int): Int {
    val lowestY = screenHeight * 2 / 3 - cardHeight
    return preferredY.coerceAtMost(lowestY).coerceAtLeast(0)
  }

  fun from(pill: ScreenRect, card: ScreenRect): CardMotionStart {
    val pivotX = pill.x + pill.width / 2f - card.x
    val pivotY = pill.y + pill.height / 2f - card.y
    return CardMotionStart(
      scaleX = (pill.width.toFloat() / card.width).coerceAtMost(1f),
      scaleY = (pill.height.toFloat() / card.height).coerceAtMost(1f),
      pivotX = pivotX.coerceIn(0f, card.width.toFloat()),
      pivotY = pivotY.coerceIn(0f, card.height.toFloat()),
    )
  }
}
