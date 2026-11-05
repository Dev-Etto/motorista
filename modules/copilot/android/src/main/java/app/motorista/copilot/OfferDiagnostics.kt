package app.motorista.copilot

object OfferDiagnostics {
  private const val MAX_ENTRIES = 10
  private const val MAX_OTHER_ENTRIES = 5
  private const val TAP_PREFIX = "Toque: "
  private val keptWords = Regex("""(?i)^(r\$|km|m|min|h|aceitar|selecionar|corresponder|confirmar|accept|match|recusar|rejeitar|pular|ignorar|dispensar|decline|reject|skip|\+)$""")
  private val token = Regex("""\S+""")
  private val letters = Regex("""\p{L}""")
  private val digits = Regex("""\d""")
  private val measure = Regex("""(?i)^(?:R\$\d+(?:[.,]\d+)?|[~(]*\d+(?:[.,]\d+)?(?:km|m|min|h))[).,]*$""")
  private val rating = Regex("""^[1-5][.,]\d{1,2}$""")
  private val unit = Regex("""(?i)^\(?(?:km|m|min|h)\b""")
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

  fun mask(text: String): String {
    val tokens = token.findAll(text).map { it.value }.toList()
    return tokens.mapIndexed { index, value -> maskToken(value, tokens.getOrNull(index - 1), tokens.getOrNull(index + 1)) }.joinToString(" ")
  }

  private fun maskToken(value: String, previous: String?, next: String?): String {
    if (keptWords.matches(value)) return value

    val hidden = letters.replace(value, "x")
    if (!digits.containsMatchIn(value)) return hidden
    if (measure.matches(value) || rating.matches(value)) return hidden
    if (previous?.equals("R$", ignoreCase = true) == true || next?.let { unit.containsMatchIn(it) } == true) return hidden
    return digits.replace(hidden, "#")
  }
}
