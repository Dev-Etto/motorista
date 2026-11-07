package app.motorista.copilot

import android.content.res.Resources

interface OfferTexts {
  fun text(resId: Int, vararg args: Any): String

  fun quantity(resId: Int, count: Int, vararg args: Any): String
}

class ResourceOfferTexts(private val resources: Resources) : OfferTexts {
  override fun text(resId: Int, vararg args: Any): String = if (args.isEmpty()) resources.getString(resId) else resources.getString(resId, *args)

  override fun quantity(resId: Int, count: Int, vararg args: Any): String = resources.getQuantityString(resId, count, *args)
}
