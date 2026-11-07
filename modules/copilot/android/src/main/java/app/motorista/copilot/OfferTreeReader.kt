package app.motorista.copilot

import android.accessibilityservice.AccessibilityService
import android.graphics.Rect
import android.os.Build
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityWindowInfo

data class ScreenScan(val source: String, val visible: Boolean, val text: String, val simulated: Boolean = false)

class OfferTreeReader(private val service: AccessibilityService) {
  fun scan(monitored: Set<String>, preferred: String): ScreenScan {
    val windows = service.windows
    val allRoots = windows.mapNotNull { it.root } + listOfNotNull(service.rootInActiveWindow)
    try {
      val roots = allRoots.filter { it.packageName?.toString() in monitored }.distinct()
      val packages = roots.mapNotNull { it.packageName?.toString() }
      val source = packages.firstOrNull { it == preferred } ?: packages.firstOrNull() ?: preferred
      val ownRoots = roots.filter { it.packageName?.toString() == source }
      val top = OfferReadPolicy.ignoredTextTopY(source, service.resources.displayMetrics.heightPixels)
      return ScreenScan(source, roots.isNotEmpty(), collect(ownRoots, MAX_NODES, top))
    } finally {
      allRoots.forEach { it.release() }
      windows.forEach { it.release() }
    }
  }

  fun tapText(root: AccessibilityNodeInfo): String = collect(listOf(root), MAX_TAP_NODES, ignoreAboveY = 0)

  private fun collect(roots: List<AccessibilityNodeInfo>, maxNodes: Int, ignoreAboveY: Int): String {
    val pieces = mutableListOf<TextPiece>()
    val pending = ArrayDeque(roots)
    val bounds = Rect()
    val deadline = System.currentTimeMillis() + BUDGET_MS
    var visited = 0
    while (pending.isNotEmpty() && visited < maxNodes && System.currentTimeMillis() < deadline) {
      val node = pending.removeFirst()
      visited++
      if (node.isVisibleToUser) {
        node.getBoundsInScreen(bounds)
        listOfNotNull(node.text, node.contentDescription).map { it.toString() }.distinct().forEach {
          pieces.add(TextPiece(it, bounds.left, bounds.top, bounds.right, bounds.bottom))
        }
      }
      for (index in 0 until node.childCount) node.getChild(index)?.let { pending.addLast(it) }
      if (roots.none { it === node }) node.release()
    }
    pending.filter { left -> roots.none { it === left } }.forEach { it.release() }
    return ScreenText.join(pieces, ignoreAboveY)
  }

  private fun AccessibilityNodeInfo.release() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return
    @Suppress("DEPRECATION")
    recycle()
  }

  private fun AccessibilityWindowInfo.release() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return
    @Suppress("DEPRECATION")
    recycle()
  }

  private companion object {
    const val BUDGET_MS = 800L
    const val MAX_NODES = 1500
    const val MAX_TAP_NODES = 12
  }
}
