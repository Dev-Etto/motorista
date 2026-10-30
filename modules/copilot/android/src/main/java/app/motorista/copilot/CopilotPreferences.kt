package app.motorista.copilot

import org.json.JSONArray
import org.json.JSONObject

enum class PrimaryMetric(val id: String) {
  PER_KM("perKm"),
  PROFIT("profit");

  companion object {
    fun from(id: String) = entries.firstOrNull { it.id == id } ?: PER_KM
  }
}

enum class CardSize(val id: String, val scale: Float) {
  COMPACT("compact", 0.88f),
  LARGE("large", 1f),
  EXTRA("extra", 1.2f);

  companion object {
    fun from(id: String) = entries.firstOrNull { it.id == id } ?: LARGE
  }
}

enum class CardLayout(val id: String) {
  COMPLETE("complete"),
  SUMMARY("summary");

  companion object {
    fun from(id: String) = entries.firstOrNull { it.id == id } ?: COMPLETE
  }
}

enum class ThemeMode(val id: String) {
  SYSTEM("system"),
  LIGHT("light"),
  DARK("dark");

  companion object {
    fun from(id: String) = entries.firstOrNull { it.id == id } ?: SYSTEM
  }
}

data class CopilotPreferences(
  val voice: Boolean = true,
  val card: Boolean = true,
  val notification: Boolean = false,
  val primaryMetric: PrimaryMetric = PrimaryMetric.PER_KM,
  val cardLayout: CardLayout = CardLayout.COMPLETE,
  val cardSize: CardSize = CardSize.LARGE,
  val theme: ThemeMode = ThemeMode.SYSTEM,
  val durationSeconds: Int = MAX_DURATION_SECONDS,
  val monitoredPackages: Set<String> = DEFAULT_PACKAGES,
) {
  fun toJson(): String = JSONObject()
    .put("voice", voice)
    .put("card", card)
    .put("notification", notification)
    .put("primaryMetric", primaryMetric.id)
    .put("cardLayout", cardLayout.id)
    .put("cardSize", cardSize.id)
    .put("theme", theme.id)
    .put("durationSeconds", durationSeconds)
    .put("monitoredPackages", JSONArray(monitoredPackages.toList()))
    .toString()

  companion object {
    const val MAX_DURATION_SECONDS = 15
    private const val MIN_DURATION_SECONDS = 5
    val DEFAULT_PACKAGES = setOf("com.ubercab.driver", "com.app99.driver", "sinet.startup.inDriver")

    fun fromJson(raw: String?): CopilotPreferences {
      if (raw.isNullOrBlank()) return CopilotPreferences()

      val json = JSONObject(raw)
      val packages = json.optJSONArray("monitoredPackages")
      return CopilotPreferences(
        voice = json.optBoolean("voice", true),
        card = json.optBoolean("card", true),
        notification = json.optBoolean("notification", false),
        primaryMetric = PrimaryMetric.from(json.optString("primaryMetric")),
        cardLayout = CardLayout.from(json.optString("cardLayout")),
        cardSize = CardSize.from(json.optString("cardSize")),
        theme = ThemeMode.from(json.optString("theme")),
        durationSeconds = json.optInt("durationSeconds", MAX_DURATION_SECONDS).coerceIn(MIN_DURATION_SECONDS, MAX_DURATION_SECONDS),
        monitoredPackages = if (packages == null) DEFAULT_PACKAGES else (0 until packages.length()).map { packages.getString(it) }.toSet(),
      )
    }
  }
}
