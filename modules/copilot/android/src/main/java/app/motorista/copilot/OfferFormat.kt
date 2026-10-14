package app.motorista.copilot

import java.util.Locale

object OfferFormat {
  private val brazil = Locale("pt", "BR")

  fun money(cents: Double): String = String.format(brazil, "R$ %.2f", cents / 100)

  fun spokenMoney(cents: Double): String {
    val total = Math.round(cents)
    val reais = total / 100
    val centavos = total % 100
    if (centavos == 0L) return "$reais reais"
    return "$reais reais e $centavos"
  }
}
