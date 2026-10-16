package app.motorista.copilot

object OfferDiagnostics {
  private const val MAX_ENTRIES = 10
  private val keptWords = Regex("""(?i)^(r\$|km|m|min|h|aceitar|selecionar|corresponder|confirmar|accept|match|\+)$""")
  private val token = Regex("""\S+""")
  private val letters = Regex("""\p{L}""")
  private val entries = ArrayDeque<String>()

  var enabled = false
    set(value) {
      field = value
      if (!value) entries.clear()
    }

  @Synchronized
  fun capture(text: String) {
    if (!enabled) return
    val masked = mask(text)
    if (entries.firstOrNull() == masked) return
    entries.addFirst(masked)
    while (entries.size > MAX_ENTRIES) entries.removeLast()
  }

  @Synchronized
  fun snapshot(): List<String> = entries.toList()

  fun mask(text: String): String = token.replace(text) { match ->
    if (keptWords.matches(match.value)) match.value else letters.replace(match.value, "x")
  }
}
