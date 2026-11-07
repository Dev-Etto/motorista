package app.motorista.copilot

import org.junit.Assert.assertEquals
import org.junit.Test

class OfferChannelsTest {
  private class Named(val name: String) : OfferChannel {
    override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) = Unit
    override fun hide() = Unit
  }

  private val card = Named("card")
  private val voice = Named("voice")
  private val notifier = Named("notifier")
  private val floating = Named("floating")
  private val channels = OfferChannels(card, voice, notifier, floating)

  private fun names(list: List<OfferChannel>) = list.map { (it as Named).name }

  @Test
  fun botaoVisivelSubstituiOCartao() {
    val preferences = CopilotPreferences(card = true, voice = true, notification = false)

    assertEquals(listOf("voice", "floating"), names(channels.active(preferences, floatingVisible = true)))
  }

  @Test
  fun semBotaoUsaOCartao() {
    val preferences = CopilotPreferences(card = true, voice = false, notification = true)

    assertEquals(listOf("card", "notifier"), names(channels.active(preferences, floatingVisible = false)))
  }

  @Test
  fun todosOsCanaisSaoEscondidosNaDesmontagem() {
    assertEquals(listOf("card", "voice", "notifier", "floating"), names(channels.all()))
  }

  @Test
  fun canalFlutuanteSemHostNaoFazNada() {
    val channel = FloatingOfferChannel({ null }) {}

    channel.hide()
  }
}
