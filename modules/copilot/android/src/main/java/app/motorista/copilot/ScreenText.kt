package app.motorista.copilot

data class TextPiece(val text: String, val left: Int, val top: Int, val right: Int, val bottom: Int) {
  fun nestedWith(other: TextPiece): Boolean = contains(other) || other.contains(this)

  private fun contains(other: TextPiece) =
    left <= other.left && top <= other.top && right >= other.right && bottom >= other.bottom
}

object ScreenText {
  fun join(pieces: List<TextPiece>, ignoreAboveY: Int = 0): String {
    val kept = mutableListOf<TextPiece>()
    pieces.filter { it.bottom > ignoreAboveY }.forEach { piece ->
      val repeated = kept.any { it.text == piece.text && it.nestedWith(piece) }
      if (!repeated) kept.add(piece)
    }
    return OfferParser.joinScreenParts(kept.sortedWith(compareBy({ it.top }, { it.left })).map { it.text })
  }
}
