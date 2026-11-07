package app.motorista.copilot

import android.content.Context

data class TimerState(val running: Boolean, val started: Boolean, val elapsedMs: Long, val startedAt: Long)

class ShiftTimer(private val context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  fun state(now: Long = System.currentTimeMillis()): TimerState {
    val running = prefs.getBoolean(KEY_RUNNING, false)
    val accumulated = prefs.getLong(KEY_ACCUMULATED, 0)
    val resumedAt = prefs.getLong(KEY_RESUMED_AT, 0)
    val elapsed = if (running) accumulated + (now - resumedAt) else accumulated
    return TimerState(running, prefs.getLong(KEY_STARTED_AT, 0) > 0, elapsed, prefs.getLong(KEY_STARTED_AT, 0))
  }

  fun start(now: Long = System.currentTimeMillis()) = synchronized(LOCK) {
    if (state(now).started) return resume(now)
    prefs.edit()
      .putLong(KEY_STARTED_AT, now)
      .putLong(KEY_RESUMED_AT, now)
      .putLong(KEY_ACCUMULATED, 0)
      .putBoolean(KEY_RUNNING, true)
      .apply()
    ForgottenShiftAlarm.schedule(context, 0, now)
  }

  fun pause(now: Long = System.currentTimeMillis()) = synchronized(LOCK) {
    val current = state(now)
    if (!current.running) return
    prefs.edit().putLong(KEY_ACCUMULATED, current.elapsedMs).putBoolean(KEY_RUNNING, false).apply()
    ForgottenShiftAlarm.cancel(context)
  }

  fun resume(now: Long = System.currentTimeMillis()) = synchronized(LOCK) {
    if (state(now).running) return
    prefs.edit().putLong(KEY_RESUMED_AT, now).putBoolean(KEY_RUNNING, true).apply()
    ForgottenShiftAlarm.schedule(context, prefs.getLong(KEY_ACCUMULATED, 0), now)
  }

  fun restoreAlarm() {
    if (state().running) ForgottenShiftAlarm.schedule(context, prefs.getLong(KEY_ACCUMULATED, 0), prefs.getLong(KEY_RESUMED_AT, 0))
  }

  fun reset() = synchronized(LOCK) {
    prefs.edit().clear().apply()
    ForgottenShiftAlarm.cancel(context)
  }

  private companion object {
    val LOCK = Any()
    const val FILE = "shift_timer"
    const val KEY_RUNNING = "running"
    const val KEY_ACCUMULATED = "accumulated"
    const val KEY_RESUMED_AT = "resumed_at"
    const val KEY_STARTED_AT = "started_at"
  }
}
