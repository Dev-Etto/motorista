package app.motorista.copilot

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
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
      val store = CopilotStore(context)
      mapOf(
        "enabled" to store.enabled,
        "voiceEnabled" to store.voiceEnabled,
        "accessibilityGranted" to isAccessibilityGranted(),
        "overlayGranted" to Settings.canDrawOverlays(context),
        "floatingRunning" to floatingRunning,
      )
    }

    Function("setEnabled") { value: Boolean -> CopilotStore(context).enabled = value }
    Function("setVoiceEnabled") { value: Boolean -> CopilotStore(context).voiceEnabled = value }
    Function("setTargets") { costPerKm: Double, targetPerKmCents: Double, targetPerHourCents: Double ->
      CopilotStore(context).targets = OfferTargets(costPerKm, targetPerKmCents, targetPerHourCents)
    }
    Function("getHistory") { CopilotStore(context).history() }
    Function("clearHistory") { CopilotStore(context).clearHistory() }

    Function("openAccessibilitySettings") { openIntent(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
    Function("openAppSettings") {
      openIntent(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
    }
    Function("openOverlaySettings") {
      openIntent(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}")))
    }

    Function("testOffer") { text: String ->
      val offer = OfferParser.parse(text) ?: return@Function false
      val service = OfferAccessibilityService.instance ?: return@Function false
      service.present(offer, "teste", false)
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
      context.startForegroundService(floatingIntent())
      floatingRunning = true
      true
    }
    Function("stopFloating") {
      context.stopService(floatingIntent())
      floatingRunning = false
    }
  }

  private fun floatingIntent() = Intent(context, FloatingTimerService::class.java)

  private fun openIntent(intent: Intent) {
    context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  private fun isAccessibilityGranted(): Boolean {
    val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
      ?: return false
    val component = ComponentName(context, OfferAccessibilityService::class.java).flattenToString()
    return enabled.split(':').any { it.equals(component, ignoreCase = true) }
  }

  private fun timerToMap(state: TimerState) = mapOf(
    "running" to state.running,
    "started" to state.started,
    "elapsedMs" to state.elapsedMs.toDouble(),
    "startedAt" to state.startedAt.toDouble(),
  )

  private companion object {
    var floatingRunning = false
  }
}
