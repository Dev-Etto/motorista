package app.motorista.copilot

object OfferDiagnostics {
  private const val MAX_ENTRIES = 10
  private const val MAX_OTHER_ENTRIES = 5
  private const val TAP_PREFIX = "Toque: "
  private val keptWords = Regex("""(?i)^(r\$|km|m|min|h|aceitar|selecionar|corresponder|confirmar|accept|match|recusar|rejeitar|pular|ignorar|dispensar|decline|reject|skip|\+)$""")
  private val token = Regex("""\S+""")
  private val letters = Regex("""\p{L}""")
  private val moneyMark = Regex("""R\$""")
  private val entries = ArrayDeque<String>()
  private val otherEntries = ArrayDeque<String>()

  var enabled = false
    set(value) {
      field = value
      if (!value) {
        entries.clear()
        otherEntries.clear()
      }
    }

  @Synchronized
  fun capture(text: String) {
    if (!enabled) return
    val masked = mask(text)
    if (moneyMark.containsMatchIn(masked)) add(entries, masked, MAX_ENTRIES) else add(otherEntries, masked, MAX_OTHER_ENTRIES)
  }

  @Synchronized
  fun captureTap(label: String) {
    if (!enabled) return
    add(entries, "$TAP_PREFIX${mask(label)}", MAX_ENTRIES)
  }

  @Synchronized
  fun snapshot(): List<String> = entries.toList() + otherEntries.toList()

  private fun add(target: ArrayDeque<String>, line: String, limit: Int) {
    if (target.firstOrNull() == line) return
    target.addFirst(line)
    while (target.size > limit) target.removeLast()
  }

  fun mask(text: String): String = token.replace(text) { match ->
    if (keptWords.matches(match.value)) match.value else letters.replace(match.value, "x")
  }
}
