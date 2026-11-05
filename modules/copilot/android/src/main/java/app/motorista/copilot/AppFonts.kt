package app.motorista.copilot

import android.content.Context
import android.graphics.Typeface

object AppFonts {
  private var cached: Map<String, Typeface> = emptyMap()

  fun bold(context: Context) = load(context, "Manrope-Bold", Typeface.DEFAULT_BOLD)

  fun regular(context: Context) = load(context, "Manrope-Regular", Typeface.DEFAULT)

  private fun load(context: Context, name: String, fallback: Typeface): Typeface {
    cached[name]?.let { return it }

    val face = runCatching { Typeface.createFromAsset(context.applicationContext.assets, "fonts/$name.ttf") }.getOrDefault(fallback)
    cached = cached + (name to face)
    return face
  }
}
