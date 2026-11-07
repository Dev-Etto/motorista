package app.motorista.copilot

import android.app.LocaleManager
import android.content.Context
import android.os.Build
import android.os.LocaleList

object AppLanguage {
  private val supported: Boolean
    get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

  fun get(context: Context): String? {
    if (!supported) return null
    return context.getSystemService(LocaleManager::class.java).applicationLocales.toLanguageTags().ifBlank { null }
  }

  fun set(context: Context, tag: String?): Boolean {
    if (!supported) return false
    val locales = if (tag.isNullOrBlank()) LocaleList.getEmptyLocaleList() else LocaleList.forLanguageTags(tag)
    context.getSystemService(LocaleManager::class.java).applicationLocales = locales
    return true
  }
}
