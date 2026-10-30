package app.motorista.copilot

import android.os.Handler
import android.os.Looper

class HandlerOfferScheduler : OfferScheduler {
  private val handler = Handler(Looper.getMainLooper())
  private val pending = mutableMapOf<String, Runnable>()

  override fun schedule(key: String, delayMs: Long, action: () -> Unit) {
    cancel(key)
    val runnable = Runnable {
      pending.remove(key)
      action()
    }
    pending[key] = runnable
    handler.postDelayed(runnable, delayMs)
  }

  override fun cancel(key: String) {
    pending.remove(key)?.let { handler.removeCallbacks(it) }
  }

  fun cancelAll() {
    handler.removeCallbacksAndMessages(null)
    pending.clear()
  }
}
