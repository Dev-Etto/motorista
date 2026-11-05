package app.motorista.copilot

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class CopilotStore(context: Context) {
  private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  init {
    if (prefs.contains(KEY_LEGACY_HISTORY)) prefs.edit().remove(KEY_LEGACY_HISTORY).apply()
  }

  var enabled: Boolean
    get() = prefs.getBoolean(KEY_ENABLED, false)
    set(value) = prefs.edit().putBoolean(KEY_ENABLED, value).apply()

  var preferences: CopilotPreferences
    get() = CopilotPreferences.fromJson(prefs.getString(KEY_PREFERENCES, null))
    set(value) = prefs.edit().putString(KEY_PREFERENCES, value.toJson()).apply()

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

  var cardPosition: Pair<Int, Int>?
    get() {
      if (!prefs.contains(KEY_CARD_X)) return null
      return prefs.getInt(KEY_CARD_X, 0) to prefs.getInt(KEY_CARD_Y, 0)
    }
    set(value) {
      val editor = prefs.edit()
      if (value == null) editor.remove(KEY_CARD_X).remove(KEY_CARD_Y)
      if (value != null) editor.putInt(KEY_CARD_X, value.first).putInt(KEY_CARD_Y, value.second)
      editor.apply()
    }

  val failedReads: Int
    get() = prefs.getInt(KEY_FAILED_READS, 0)

  fun registerFailedRead() = prefs.edit().putInt(KEY_FAILED_READS, failedReads + 1).apply()

  fun history(): String = prefs.getString(KEY_HISTORY, "[]") ?: "[]"

  fun replaceHistory(json: String) {
    if (runCatching { JSONArray(json) }.isFailure) return
    prefs.edit().putString(KEY_HISTORY, json).apply()
  }

  fun clearHistory() = prefs.edit().remove(KEY_HISTORY).remove(KEY_FAILED_READS).apply()

  fun record(evaluation: OfferEvaluation, source: String, timestamp: Long) {
    val current = JSONArray(history())
    val updated = JSONArray().put(toJson(evaluation, source, timestamp))
    for (index in 0 until minOf(current.length(), MAX_HISTORY - 1)) updated.put(current.get(index))
    prefs.edit().putString(KEY_HISTORY, updated.toString()).apply()
  }

  private fun toJson(evaluation: OfferEvaluation, source: String, timestamp: Long): JSONObject {
    val json = JSONObject()
      .put("timestamp", timestamp)
      .put("source", evaluation.sourceLabel)
      .put("reason", evaluation.reason)
      .put("valueCents", evaluation.offer.valueCents)
      .put("km", evaluation.offer.km)
      .put("minutes", evaluation.offer.minutes)
      .put("perKmCents", evaluation.perKmCents)
      .put("perHourCents", evaluation.perHourCents)
      .put("color", evaluation.color.id)
    evaluation.score?.let { json.put("score", it) }
    val profit = evaluation.profitCents ?: return json
    return json.put("profitCents", profit)
  }

  private companion object {
    const val FILE = "copilot"
    const val KEY_ENABLED = "enabled"
    const val KEY_PREFERENCES = "preferences"
    const val KEY_COST = "cost_per_km"
    const val KEY_TARGET_KM = "target_per_km"
    const val KEY_TARGET_HOUR = "target_per_hour"
    const val KEY_HISTORY = "history_v2"
    const val KEY_LEGACY_HISTORY = "history"
    const val KEY_FAILED_READS = "failed_reads"
    const val KEY_CARD_X = "card_x"
    const val KEY_CARD_Y = "card_y"
    const val MAX_HISTORY = 100
  }
}
