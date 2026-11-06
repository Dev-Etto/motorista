package app.motorista.copilot

class ScanPacer(
  private val scheduler: OfferScheduler,
  private val now: () -> Long,
  private val intervalMs: () -> Long,
  private val scan: () -> Unit,
) {
  private var pending = false
  private var lastScanAt = 0L
  private var burstUntil = 0L

  val bursting: Boolean
    get() = now() < burstUntil

  fun request() {
    if (pending) return

    pending = true
    val delay = (lastScanAt + intervalMs() - now()).coerceAtLeast(0)
    scheduler.schedule(KEY_SCAN, delay) { run() }
  }

  fun startBurst() {
    burstUntil = now() + BURST_MS
    request()
  }

  fun stopBurst() {
    burstUntil = 0
  }

  fun watch() {
    stopBurst()
    request()
  }

  private fun run() {
    pending = false
    lastScanAt = now()
    scan()
    if (bursting) request()
  }

  private companion object {
    const val KEY_SCAN = "scan"
    const val BURST_MS = 8000L
  }
}
