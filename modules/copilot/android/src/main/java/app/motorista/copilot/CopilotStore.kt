package app.motorista.copilot

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class CopilotStore private constructor(private val context: Context) {
  private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  private val log = OfferLogDatabase.get(context)
  @Volatile
  private var cachedPreferences: Pair<String?, CopilotPreferences>? = null

  init {
    if (prefs.contains(KEY_LEGACY_HISTORY)) prefs.edit().remove(KEY_LEGACY_HISTORY).apply()
    migrateHistoryFromPreferences()
  }

  var enabled: Boolean
    get() = prefs.getBoolean(KEY_ENABLED, false)
    set(value) = prefs.edit().putBoolean(KEY_ENABLED, value).apply()

  var preferences: CopilotPreferences
    get() {
      val raw = prefs.getString(KEY_PREFERENCES, null)
      val cached = cachedPreferences
      if (cached != null && cached.first == raw) return cached.second
      return CopilotPreferences.fromJson(raw).also { cachedPreferences = raw to it }
    }
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
      if (value == null) return prefs.edit().remove(KEY_CARD_X).remove(KEY_CARD_Y).apply()

      prefs.edit().putInt(KEY_CARD_X, value.first).putInt(KEY_CARD_Y, value.second).apply()
    }

  val failedReads: Int
    get() = prefs.getInt(KEY_FAILED_READS, 0)

  fun registerFailedRead() = prefs.edit().putInt(KEY_FAILED_READS, failedReads + 1).apply()

  private fun migrateHistoryFromPreferences() {
    val stored = prefs.getString(KEY_HISTORY, null) ?: return
    runCatching { if (log.isEmpty()) replaceHistory(stored) }
    prefs.edit().remove(KEY_HISTORY).apply()
  }

  fun history(): String = log.all()

  fun offers(from: Long, to: Long): String = log.between(from, to)

  fun recentOffers(limit: Int): String = log.recent(limit)

  fun replaceHistory(json: String) {
    val entries = runCatching { JSONArray(json) }.getOrNull() ?: return
    log.replaceAll(entries)
  }

  fun clearHistory() {
    log.clear()
    prefs.edit().remove(KEY_FAILED_READS).apply()
  }

  fun record(evaluation: OfferEvaluation, source: String, timestamp: Long): Long {
    log.insert(toJson(evaluation, source, timestamp), timestamp - RETENTION_MS)
    return timestamp
  }

  fun markOutcome(offerId: Long, outcome: OfferOutcome) = log.update(offerId) { entry ->
    entry.put("status", outcome.status.id)
    if (outcome.counterCents == null) entry.remove("counterCents") else entry.put("counterCents", outcome.counterCents)
  }

  fun refine(offerId: Long, evaluation: OfferEvaluation) = log.update(offerId) { entry -> putEvaluation(entry, evaluation) }

  private fun toJson(evaluation: OfferEvaluation, source: String, timestamp: Long): JSONObject {
    val json = JSONObject()
      .put("timestamp", timestamp)
      .put("source", evaluation.sourceLabel)
      .put("status", OfferStatus.UNANSWERED.id)
    return putEvaluation(json, evaluation)
  }

  private fun putEvaluation(json: JSONObject, evaluation: OfferEvaluation): JSONObject {
    json.put("reason", OfferFormat.of(context, preferences.regional).reason(evaluation))
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

  companion object {
    @Volatile
    private var instance: CopilotStore? = null

    fun get(context: Context): CopilotStore = instance ?: synchronized(this) {
      instance ?: CopilotStore(context.applicationContext).also { instance = it }
    }

    private const val FILE = "copilot"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_PREFERENCES = "preferences"
    private const val KEY_COST = "cost_per_km"
    private const val KEY_TARGET_KM = "target_per_km"
    private const val KEY_TARGET_HOUR = "target_per_hour"
    private const val KEY_HISTORY = "history_v2"
    private const val KEY_LEGACY_HISTORY = "history"
    private const val KEY_FAILED_READS = "failed_reads"
    private const val KEY_CARD_X = "card_x"
    private const val KEY_CARD_Y = "card_y"
    private const val RETENTION_MS = 365L * 24 * 60 * 60 * 1000
  }
}
