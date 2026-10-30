package app.motorista.copilot

import android.graphics.Color

data class SourceStyle(val label: String, val background: Int, val text: Int)

object OfferSources {
  private val FALLBACK = SourceStyle("App", 0xFF37474F.toInt(), Color.WHITE)
  private val styles = mapOf(
    "com.ubercab.driver" to SourceStyle("Uber", 0xFF000000.toInt(), Color.WHITE),
    "com.app99.driver" to SourceStyle("99", 0xFFFFDD00.toInt(), 0xFF111111.toInt()),
    "sinet.startup.inDriver" to SourceStyle("inDrive", 0xFFC1F11D.toInt(), 0xFF111111.toInt()),
  )

  fun label(packageName: String): String = (styles[packageName] ?: FALLBACK).label

  fun style(label: String): SourceStyle = styles.values.firstOrNull { it.label == label } ?: FALLBACK
}
