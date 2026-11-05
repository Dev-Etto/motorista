package app.motorista.copilot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ApplicationInfo
import android.os.Build

class OfferMockReceiver(private val service: OfferAccessibilityService) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_SETUP -> setup(context, intent)
      ACTION_FORGOTTEN -> ForgottenShiftAlarm.notify(context)
      ACTION_TAP -> service.mockTap(intent.getStringExtra(EXTRA_TEXT).orEmpty())
      ACTION_SCAN -> service.mockScan(intent.getStringExtra(EXTRA_TEXT).orEmpty(), intent.getStringExtra(EXTRA_SOURCE).orEmpty())
    }
  }

  private fun setup(context: Context, intent: Intent) {
    val store = CopilotStore(context)
    store.enabled = true
    store.targets = OfferTargets(
      intent.getStringExtra(EXTRA_COST)?.toDoubleOrNull() ?: DEFAULT_COST,
      intent.getStringExtra(EXTRA_TARGET_KM)?.toDoubleOrNull() ?: DEFAULT_TARGET_KM,
      intent.getStringExtra(EXTRA_TARGET_HOUR)?.toDoubleOrNull() ?: DEFAULT_TARGET_HOUR,
    )
  }

  fun register(context: Context) {
    val filter = IntentFilter().apply {
      addAction(ACTION_SETUP)
      addAction(ACTION_SCAN)
      addAction(ACTION_FORGOTTEN)
      addAction(ACTION_TAP)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(this, filter, Context.RECEIVER_EXPORTED)
    } else {
      context.registerReceiver(this, filter)
    }
  }

  companion object {
    private const val ACTION_SETUP = "app.motorista.copilot.MOCK_SETUP"
    private const val ACTION_SCAN = "app.motorista.copilot.MOCK_SCAN"
    private const val ACTION_FORGOTTEN = "app.motorista.copilot.MOCK_FORGOTTEN"
    private const val ACTION_TAP = "app.motorista.copilot.MOCK_TAP"
    private const val EXTRA_TEXT = "text"
    private const val EXTRA_SOURCE = "source"
    private const val EXTRA_COST = "cost"
    private const val EXTRA_TARGET_KM = "targetKm"
    private const val EXTRA_TARGET_HOUR = "targetHour"
    private const val DEFAULT_COST = 90.0
    private const val DEFAULT_TARGET_KM = 200.0
    private const val DEFAULT_TARGET_HOUR = 3000.0

    fun isAllowed(context: Context) = context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0
  }
}
