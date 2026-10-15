package app.motorista.copilot

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class CopilotStore(context: Context) {
  private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  var enabled: Boolean
    get() = prefs.getBoolean(KEY_ENABLED, false)
    set(value) = prefs.edit().putBoolean(KEY_ENABLED, value).apply()

  var voiceEnabled: Boolean
    get() = prefs.getBoolean(KEY_VOICE, false)
    set(value) = prefs.edit().putBoolean(KEY_VOICE, value).apply()

  var targets: OfferTargets
    get() = OfferTargets(
      prefs.getFloat(KEY_COST, 0f).toDouble(),
      prefs.getFloat(KEY_TARGET_KM, 0f).toDouble(),
      prefs.getFloat(KEY_TARGET_HOUR, 0f).toDouble(),
    )
    set(value) = prefs.edit()
      .putFloat(KEY_COST, value.costPerKm.toFloat())
      .putFloat(KEY_TARGET_KM, value.targetPerKmCents.toFloat())
      .putFloat(KEY_TARGET_HOUR, value.targetPerHourCents.toFloat())
      .apply()

  fun history(): String = prefs.getString(KEY_HISTORY, "[]") ?: "[]"

  fun clearHistory() = prefs.edit().remove(KEY_HISTORY).apply()

  fun record(evaluation: OfferEvaluation, source: String, timestamp: Long) {
    val current = JSONArray(history())
    val updated = JSONArray().put(toJson(evaluation, source, timestamp))
    for (index in 0 until minOf(current.length(), MAX_HISTORY - 1)) updated.put(current.get(index))
    prefs.edit().putString(KEY_HISTORY, updated.toString()).apply()
  }

  private fun toJson(evaluation: OfferEvaluation, source: String, timestamp: Long) = JSONObject()
    .put("timestamp", timestamp)
    .put("source", source)
    .put("valueCents", evaluation.offer.valueCents)
    .put("km", evaluation.offer.km)
    .put("minutes", evaluation.offer.minutes)
    .put("perKmCents", evaluation.perKmCents)
    .put("perHourCents", evaluation.perHourCents)
    .put("profitCents", evaluation.profitCents)
    .put("color", evaluation.color.id)

  private companion object {
    const val FILE = "copilot"
    const val KEY_ENABLED = "enabled"
    const val KEY_VOICE = "voice"
    const val KEY_COST = "cost_per_km"
    const val KEY_TARGET_KM = "target_per_km"
    const val KEY_TARGET_HOUR = "target_per_hour"
    const val KEY_HISTORY = "history"
    const val MAX_HISTORY = 100
  }
}
