package app.motorista.copilot

enum class OfferStatus(val id: String) {
  ACCEPTED("accepted"),
  DECLINED("declined"),
  COUNTERED("countered"),
  UNANSWERED("unanswered");

  companion object {
    fun from(id: String) = entries.firstOrNull { it.id == id } ?: UNANSWERED
  }
}

data class OfferOutcome(val status: OfferStatus, val counterCents: Long? = null)

object OfferOutcomeReader {
  private val accept = Regex("""aceitar|selecionar|corresponder|confirmar|accept|match""", RegexOption.IGNORE_CASE)
  private val decline = Regex("""recusar|rejeitar|pular|ignorar|dispensar|decline|reject|skip""", RegexOption.IGNORE_CASE)
  private val refusedAccept = Regex("""n[ãa]o\s+aceitar""", RegexOption.IGNORE_CASE)

  fun fromTap(label: String): OfferOutcome? {
    val accepts = accept.containsMatchIn(refusedAccept.replace(label, " "))
    val declines = decline.containsMatchIn(label) || refusedAccept.containsMatchIn(label)
    if (accepts && declines) return null
    if (accepts) return OfferOutcome(OfferStatus.ACCEPTED)
    if (declines) return OfferOutcome(OfferStatus.DECLINED)
    return OfferParser.exactValueCents(label)?.let { OfferOutcome(OfferStatus.COUNTERED, it) }
  }
}
