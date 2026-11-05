package app.motorista.copilot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ApplicationInfo
import android.database.sqlite.SQLiteDatabase
import android.os.Build
import java.io.File
import java.time.LocalDate

class OfferMockReceiver(private val service: OfferAccessibilityService) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_SETUP -> setup(context, intent)
      ACTION_FORGOTTEN -> ForgottenShiftAlarm.notify(context)
      ACTION_SEED -> seed(context)
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

  private fun seed(context: Context) {
    val path = File(context.filesDir, "SQLite/motorista.db").path
    SQLiteDatabase.openDatabase(path, null, SQLiteDatabase.OPEN_READWRITE).use { db ->
      db.beginTransaction()
      try {
        db.execSQL("DELETE FROM shift_earnings")
        db.execSQL("DELETE FROM shifts")
        db.execSQL("DELETE FROM cost_profiles")
        db.execSQL("DELETE FROM vehicles")
        db.execSQL("INSERT INTO vehicles (id, name, kind, fuel, active, created_at) VALUES (1, 'Carro de teste', 'car', 'gasoline', 1, ${System.currentTimeMillis()})")
        db.execSQL("INSERT INTO cost_profiles (vehicle_id, valid_from, data) VALUES (1, '2020-01-01', ?)", arrayOf(SAMPLE_PROFILE))
        for (daysAgo in 0 until SAMPLE_DAYS) {
          val date = LocalDate.now().minusDays(daysAgo.toLong()).toString()
          db.execSQL("INSERT INTO shifts (id, vehicle_id, date, start_hour, minutes, km, cost_per_km, variable_per_km, created_at) VALUES (${daysAgo + 1}, 1, '$date', 8, 480, 140, 95, 60, ${System.currentTimeMillis()})")
          db.execSQL("INSERT INTO shift_earnings (shift_id, platform_id, cents) VALUES (${daysAgo + 1}, 1, ${SAMPLE_EARNINGS_CENTS + daysAgo * SAMPLE_EARNINGS_STEP})")
        }
        db.setTransactionSuccessful()
      } finally {
        db.endTransaction()
      }
    }
  }

  fun register(context: Context) {
    val filter = IntentFilter().apply {
      addAction(ACTION_SETUP)
      addAction(ACTION_SCAN)
      addAction(ACTION_FORGOTTEN)
      addAction(ACTION_SEED)
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
    private const val ACTION_SEED = "app.motorista.copilot.MOCK_SEED"
    private const val SAMPLE_DAYS = 6
    private const val SAMPLE_EARNINGS_CENTS = 28000
    private const val SAMPLE_EARNINGS_STEP = 1500
    private const val SAMPLE_PROFILE = """{"ownership":"owned","fuelPriceCents":600,"consumptionKmPerUnit":12,"oilChangeCents":25000,"oilIntervalKm":10000,"tiresCents":160000,"tiresLifeKm":50000,"maintenanceMonthlyCents":20000,"insuranceMonthlyCents":25000,"ipvaYearlyCents":150000,"licensingYearlyCents":20000,"paymentMonthlyCents":0,"vehicleValueCents":5000000,"depreciationAnnualPct":10,"depreciationEnabled":true,"otherFixedMonthlyCents":0,"plannedKmMonth":4000}"""
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
