package app.motorista.copilot

import android.graphics.Color

data class SourceStyle(val label: String, val background: Int, val text: Int)

object OfferSources {
  const val UBER = "com.ubercab.driver"
  const val NINETY_NINE = "com.app99.driver"
  const val INDRIVE = "sinet.startup.inDriver"
  val packages = setOf(UBER, NINETY_NINE, INDRIVE)

  private val FALLBACK = SourceStyle("App", 0xFF404040.toInt(), Color.WHITE)
  private val styles = mapOf(
    UBER to SourceStyle("Uber", 0xFF000000.toInt(), Color.WHITE),
    NINETY_NINE to SourceStyle("99", 0xFFFFDD00.toInt(), 0xFF111111.toInt()),
    INDRIVE to SourceStyle("inDrive", 0xFFC1F11D.toInt(), 0xFF111111.toInt()),
  )

  fun label(packageName: String): String = (styles[packageName] ?: FALLBACK).label

  fun style(label: String): SourceStyle = styles.values.firstOrNull { it.label == label } ?: FALLBACK
}
