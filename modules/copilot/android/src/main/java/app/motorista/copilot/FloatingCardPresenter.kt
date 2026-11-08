package app.motorista.copilot

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout

class FloatingCardPresenter(
  private val context: Context,
  private val window: FloatingWindow,
  private val windowManager: WindowManager,
  private val store: CopilotStore,
  private val pill: PillPositionStore,
  private val dismissZone: DismissZone,
) {
  private val cardView = OfferCardView(context)
  private var motionStart: CardMotionStart? = null

  var showing = false
    private set

  fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences, pillSize: Pair<Int, Int>, onDismiss: () -> Unit) {
    val cameFromPill = !showing
    val root = window.root
    root.getChildAt(0)?.animate()?.cancel()
    root.removeAllViews()
    val margin = context.dp(SHADOW_MARGIN_DP)
    root.setPadding(margin, margin, margin, margin)
    val card = cardView.build(evaluation, preferences)
    root.addView(card, FrameLayout.LayoutParams(cardView.width(), ViewGroup.LayoutParams.WRAP_CONTENT))
    showing = true
    card.measure(
      View.MeasureSpec.makeMeasureSpec(cardView.width(), View.MeasureSpec.EXACTLY),
      View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
    )
    place(card.measuredHeight + margin * 2)
    WindowDrag.attach(
      handle = card,
      window = root,
      params = window.params,
      windowManager = windowManager,
      clamp = { x, y -> window.clamp(x, y) },
      onEnd = { x, y -> store.cardPosition = x to y },
      onTap = onDismiss,
      dismissZone = dismissZone,
      onDismiss = onDismiss,
    )
    root.alpha = 1f
    root.background = null
    window.update()
    if (cameFromPill) animateOpening(card, margin, pillSize)
  }

  fun hide(onClosed: () -> Unit) {
    if (!showing) return

    dismissZone.hide()
    showing = false
    val card = window.root.getChildAt(0)
    val start = motionStart ?: return onClosed()
    card.setOnTouchListener(null)
    card.animate()
      .scaleX(start.scaleX)
      .scaleY(start.scaleY)
      .alpha(0f)
      .setDuration(OfferCardMotion.CLOSE_MS)
      .setInterpolator(AccelerateInterpolator())
      .withEndAction { if (!showing && window.attached) onClosed() }
  }

  private fun animateOpening(card: View, margin: Int, pillSize: Pair<Int, Int>) {
    val (pillX, pillY) = pill.load()
    val from = ScreenRect(pillX, pillY, pillSize.first.coerceAtLeast(1), pillSize.second.coerceAtLeast(1))
    val to = ScreenRect(window.params.x + margin, window.params.y + margin, card.measuredWidth, card.measuredHeight)
    val start = OfferCardMotion.from(from, to)
    motionStart = start
    card.pivotX = start.pivotX
    card.pivotY = start.pivotY
    card.scaleX = start.scaleX
    card.scaleY = start.scaleY
    card.alpha = 0f
    card.animate()
      .scaleX(1f)
      .scaleY(1f)
      .alpha(1f)
      .setDuration(OfferCardMotion.OPEN_MS)
      .setInterpolator(DecelerateInterpolator())
  }

  private fun place(height: Int) {
    val saved = store.cardPosition
    val screen = ScreenBounds.of(context)
    val width = cardView.width() + context.dp(SHADOW_MARGIN_DP) * 2
    val x = saved?.first ?: window.params.x
    val y = OfferCardMotion.cardY(saved?.second ?: window.params.y, height, screen.height)
    window.moveTo(ScreenBounds.clamp(x, y, width, height, screen))
  }

  private companion object {
    const val SHADOW_MARGIN_DP = 20
  }
}
