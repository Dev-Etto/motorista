package app.motorista.copilot

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CopilotModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("Copilot")

    Function("getStatus") {
      val store = CopilotStore.get(context)
      mapOf(
        "enabled" to store.enabled,
        "accessibilityGranted" to isAccessibilityGranted(),
        "overlayGranted" to Settings.canDrawOverlays(context),
        "floatingRunning" to (FloatingTimerService.instance != null),
        "voiceAvailable" to (OfferAccessibilityService.instance?.voiceAvailable ?: false),
        "failedReads" to store.failedReads,
        "shortcutEnabled" to isShortcutEnabled(),
        "batteryRestricted" to isBatteryRestricted(),
      )
    }

    Function("setEnabled") { value: Boolean -> CopilotStore.get(context).enabled = value }
    Function("getPreferences") { CopilotStore.get(context).preferences.toJson() }
    Function("setPreferences") { json: String ->
      val store = CopilotStore.get(context)
      store.preferences = CopilotPreferences.merge(json, store.preferences)
    }
    Function("setRegional") { json: String ->
      val store = CopilotStore.get(context)
      store.preferences = store.preferences.copy(regional = RegionalSettings.parse(json))
    }
    Function("getAppLanguage") { AppLanguage.get(context) }
    Function("setAppLanguage") { tag: String? -> AppLanguage.set(context, tag) }
    Function("setTargets") { costPerKm: Double, targetPerKmCents: Double, targetPerHourCents: Double ->
      CopilotStore.get(context).targets = OfferTargets(costPerKm, targetPerKmCents, targetPerHourCents)
    }
    Function("resetCardPosition") { CopilotStore.get(context).cardPosition = null }
    AsyncFunction("getHistory") { CopilotStore.get(context).history() }
    AsyncFunction("getOffers") { from: Double, to: Double -> CopilotStore.get(context).offers(from.toLong(), to.toLong()) }
    AsyncFunction("getRecentOffers") { limit: Int -> CopilotStore.get(context).recentOffers(limit) }
    AsyncFunction("setHistory") { json: String -> CopilotStore.get(context).replaceHistory(json) }
    Function("clearHistory") { CopilotStore.get(context).clearHistory() }
    AsyncFunction("setOfferStatus") { timestamp: Long, status: String ->
      val outcome = OfferStatus.entries.firstOrNull { it.id == status } ?: return@AsyncFunction
      CopilotStore.get(context).markOutcome(timestamp, OfferOutcome(outcome))
    }

    Function("openAccessibilitySettings") { openIntent(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
    Function("openAppSettings") {
      openIntent(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
    }
    Function("openOverlaySettings") {
      openIntent(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}")))
    }
    Function("openShortcutSettings") { openIntent(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
    Function("openBatterySettings") { openIntent(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)) }
    Function("openVoiceSettings") { openIntent(Intent(TTS_SETTINGS_ACTION)) }

    Function("testOffer") { text: String, source: String, delayMs: Double ->
      val offer = OfferParser.parse(text) ?: return@Function false
      val service = OfferAccessibilityService.instance ?: return@Function false
      Handler(Looper.getMainLooper()).postDelayed({ if (OfferAccessibilityService.instance === service) service.preview(offer, source) }, delayMs.toLong())
      true
    }

    Function("testNotification") { text: String, source: String ->
      val offer = OfferParser.parse(text) ?: return@Function false
      val notifier = OfferNotifier(context)
      if (!notifier.enabled) return@Function false
      val store = CopilotStore.get(context)
      notifier.show(OfferEvaluator.evaluate(offer, store.targets, OfferSources.label(source)), store.preferences)
      true
    }

    Function("setDiagnosticsEnabled") { value: Boolean -> OfferDiagnostics.enabled = value }
    Function("getDiagnostics") { OfferDiagnostics.snapshot() }

    Function("getTimer") { timerToMap(ShiftTimer(context).state()) }
    Function("startTimer") { timerToMap(ShiftTimer(context).also { it.start() }.state()) }
    Function("pauseTimer") { timerToMap(ShiftTimer(context).also { it.pause() }.state()) }
    Function("resetTimer") { timerToMap(ShiftTimer(context).also { it.reset() }.state()) }

    Function("startFloating") {
      if (!Settings.canDrawOverlays(context)) return@Function false
      context.startForegroundService(Intent(context, FloatingTimerService::class.java))
      true
    }
    Function("setAppInForeground") { value: Boolean ->
      Handler(Looper.getMainLooper()).post { FloatingTimerService.setAppInForeground(value) }
      ShiftTimer(context).refreshNotification()
    }
    Function("stopFloating") { context.stopService(Intent(context, FloatingTimerService::class.java)) }
  }

  private fun openIntent(intent: Intent) {
    val launched = runCatching { context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
    if (launched.isSuccess) return

    context.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  private fun isAccessibilityGranted(): Boolean {
    val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
      ?: return false
    val component = ComponentName(context, OfferAccessibilityService::class.java).flattenToString()
    return enabled.split(':').any { it.equals(component, ignoreCase = true) }
  }

  private fun isBatteryRestricted(): Boolean {
    val power = context.getSystemService(PowerManager::class.java)
    return !power.isIgnoringBatteryOptimizations(context.packageName)
  }

  private fun isShortcutEnabled(): Boolean {
    val targets = runCatching { Settings.Secure.getString(context.contentResolver, BUTTON_TARGETS_KEY) }.getOrNull()
      ?: return false
    return targets.contains(context.packageName)
  }

  private fun timerToMap(state: TimerState) = mapOf(
    "running" to state.running,
    "started" to state.started,
    "elapsedMs" to state.elapsedMs.toDouble(),
    "startedAt" to state.startedAt.toDouble(),
  )

  private companion object {
    const val TTS_SETTINGS_ACTION = "com.android.settings.TTS_SETTINGS"
    const val BUTTON_TARGETS_KEY = "accessibility_button_targets"
  }
}
