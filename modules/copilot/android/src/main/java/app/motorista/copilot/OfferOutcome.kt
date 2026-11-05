package app.motorista.copilot

enum class OfferStatus(val id: String) {
  ACCEPTED("accepted"),
  DECLINED("declined"),
  COUNTERED("countered"),
  UNANSWERED("unanswered"),
}

data class OfferOutcome(val status: OfferStatus, val counterCents: Long? = null)

object OfferOutcomeReader {
  private val decline = Regex(
    """^(?:recusar|rejeitar|pular|ignorar|dispensar|decline|reject|skip|n[ãa]o\s+aceitar)(?:\s+(?:a\s+)?(?:corrida|viagem|oferta))?$""",
    RegexOption.IGNORE_CASE,
  )

  fun fromTap(label: String): OfferOutcome? {
    val segment = OfferParser.segments(label).singleOrNull() ?: return null
    if (OfferParser.isAcceptAction(segment)) return OfferOutcome(OfferStatus.ACCEPTED)
    if (decline.matches(segment)) return OfferOutcome(OfferStatus.DECLINED)
    return OfferParser.exactValueCents(segment)?.let { OfferOutcome(OfferStatus.COUNTERED, it) }
  }
}
