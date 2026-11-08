package app.motorista.copilot

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

class FloatingPanel(
  private val context: Context,
  onToggle: () -> Unit,
  onLastOffer: () -> Unit,
  onOpenApp: () -> Unit,
  onHide: () -> Unit,
) {
  private data class PanelState(
    val open: Boolean,
    val running: Boolean,
    val started: Boolean,
    val lastOffer: OfferEvaluation?,
    val theme: ThemeMode,
    val night: Boolean,
    val side: DockSide?,
  )

  private var rendered: PanelState? = null
  private val cardTheme = CardTheme(context)
  private val logo = icon(R.drawable.ic_stat_motorista, LOGO_DP).apply { importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO }
  private val statusDot = icon(R.drawable.ic_pill_dot, PILL_LOGO_DP).apply { importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO }
  private val mark = FrameLayout(context).apply {
    addView(logo, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    addView(statusDot, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
  }
  private val title = text(TITLE_SP, bold = true)
  private val status = text(CAPTION_SP, bold = false)
  private val close = icon(R.drawable.ic_panel_close, ICON_DP).apply { importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO }
  private val toggleIcon = icon(R.drawable.ic_panel_play, ICON_DP)
  private val toggleLabel = text(ROW_SP, bold = true)
  private val toggle = LinearLayout(context).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER
    minimumHeight = context.dp(ROW_DP)
    addView(toggleIcon, LinearLayout.LayoutParams(context.dp(ICON_DP), context.dp(ICON_DP)).apply { marginEnd = context.dp(SPACE_S_DP) })
    addView(toggleLabel)
    setOnClickListener { onToggle() }
  }
  private val lastOfferDetail = text(CAPTION_SP, bold = false)
  private val hideDetail = text(CAPTION_SP, bold = false).apply { text = context.copilotText(R.string.panel_hide_detail) }
  private val rowIcons = mutableListOf<ImageView>()
  private val rowLabels = mutableListOf<TextView>()
  private val lastOfferBadge = ImageView(context)
  private val lastOfferRow = row(R.drawable.ic_panel_offer, context.copilotText(R.string.panel_last_offer), lastOfferDetail, lastOfferBadge, onLastOffer)
  private val rows = listOf(lastOfferRow, row(R.drawable.ic_panel_open, context.copilotText(R.string.panel_open_app), null, null, onOpenApp), row(R.drawable.ic_panel_hide, context.copilotText(R.string.panel_hide_button), hideDetail, null, onHide))
  private val titles = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    addView(title)
    addView(status)
  }
  val handle = LinearLayout(context).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    minimumHeight = context.dp(HANDLE_DP)
    minimumWidth = context.dp(HANDLE_DP)
    addView(mark, LinearLayout.LayoutParams(context.dp(LOGO_DP), context.dp(LOGO_DP)))
    addView(titles, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
    addView(close, LinearLayout.LayoutParams(context.dp(ICON_DP), context.dp(ICON_DP)))
  }
  private val menu = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    setPadding(0, context.dp(SPACE_S_DP), 0, 0)
    addView(toggle, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = context.dp(SPACE_S_DP) })
    rows.forEach { addView(it) }
  }
  val view = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    addView(handle)
    addView(menu)
  }

  fun render(timer: TimerState, lastOffer: OfferEvaluation?, open: Boolean, theme: ThemeMode, format: OfferFormat, side: DockSide?) {
    val clock = OfferFormat.clock(timer.elapsedMs)
    val shown = if (open) clock else OfferFormat.shortClock(timer.elapsedMs)
    if (title.text.toString() != shown) title.text = shown
    describeHandle(clock, timer, open)

    val night = cardTheme.isNight(theme)
    val next = PanelState(open, timer.running, timer.started, lastOffer, theme, night, side)
    if (next == rendered) return

    rendered = next
    menu.visibility = if (open) View.VISIBLE else View.GONE
    if (open) renderOpen(timer, lastOffer, cardTheme.palette(theme), night, format) else renderClosed(timer, side)
  }

  private fun describeHandle(clock: String, timer: TimerState, open: Boolean) {
    val shift = context.copilotText(
      when {
        timer.running -> R.string.panel_shift_running
        timer.started -> R.string.panel_shift_paused
        else -> R.string.panel_shift_idle
      },
    )
    handle.contentDescription = context.copilotText(R.string.panel_handle_description).format(shift, clock)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      handle.stateDescription = context.copilotText(if (open) R.string.panel_state_open else R.string.panel_state_closed)
    }
  }

  private fun renderClosed(timer: TimerState, side: DockSide?) {
    view.background = docked(side)
    view.elevation = context.dp(ELEVATION_DP).toFloat()
    view.setPadding(0, 0, 0, 0)
    view.minimumWidth = 0
    handle.gravity = Gravity.CENTER
    handle.minimumHeight = context.dp(PILL_DP)
    val (inner, edge) = context.dp(SPACE_M_DP) to context.dp(PILL_EDGE_DP)
    if (side == DockSide.START) handle.setPadding(edge, 0, inner, 0) else handle.setPadding(inner, 0, edge, 0)
    mark.layoutParams = LinearLayout.LayoutParams(context.dp(PILL_LOGO_DP), context.dp(PILL_LOGO_DP)).apply { marginEnd = context.dp(SPACE_S_DP) }
    logo.setImageResource(R.drawable.ic_pill_logo)
    logo.imageTintList = ColorStateList.valueOf(Color.WHITE)
    titles.visibility = View.VISIBLE
    titles.layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
    title.setTextSize(TypedValue.COMPLEX_UNIT_SP, PILL_SP)
    title.setTextColor(Color.WHITE)
    status.visibility = View.GONE
    close.visibility = View.GONE
    renderDot(timer)
  }

  private fun renderDot(timer: TimerState) {
    statusDot.visibility = View.VISIBLE
    val color = when {
      timer.running -> DOT_RUNNING
      timer.started -> DOT_PAUSED
      else -> Color.WHITE
    }
    statusDot.imageTintList = ColorStateList.valueOf(color)
  }

  private fun docked(side: DockSide?) = GradientDrawable().apply {
    setColor(PILL_COLOR)
    val round = context.dp(PILL_DP / 2).toFloat()
    if (side == null) {
      cornerRadius = round
      return@apply
    }
    val inner = floatArrayOf(round, round)
    val edge = floatArrayOf(0f, 0f)
    cornerRadii = if (side == DockSide.END) inner + edge + edge + inner else edge + inner + inner + edge
  }

  private fun renderOpen(timer: TimerState, lastOffer: OfferEvaluation?, colors: CardPalette, night: Boolean, format: OfferFormat) {
    view.background = rounded(colors.surface, OPEN_CORNER_DP)
    view.elevation = context.dp(ELEVATION_DP).toFloat()
    view.setPadding(context.dp(SPACE_M_DP), context.dp(SPACE_S_DP), context.dp(SPACE_M_DP), context.dp(SPACE_M_DP))
    view.minimumWidth = context.dp(OPEN_WIDTH_DP)
    handle.gravity = Gravity.CENTER_VERTICAL
    handle.minimumHeight = context.dp(HANDLE_DP)
    handle.setPadding(0, 0, 0, 0)
    mark.layoutParams = LinearLayout.LayoutParams(context.dp(LOGO_DP), context.dp(LOGO_DP)).apply { marginEnd = context.dp(SPACE_S_DP) }
    logo.setImageResource(R.drawable.ic_stat_motorista)
    logo.imageTintList = ColorStateList.valueOf(colors.text)
    statusDot.visibility = View.GONE
    titles.visibility = View.VISIBLE
    titles.layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    title.setTextSize(TypedValue.COMPLEX_UNIT_SP, TITLE_SP)
    title.setTextColor(colors.text)
    status.visibility = View.VISIBLE
    status.text = statusText(timer)
    status.setTextColor(colors.muted)
    close.visibility = View.VISIBLE
    close.imageTintList = ColorStateList.valueOf(colors.muted)
    renderToggle(timer, colors)
    renderRows(lastOffer, colors, night, format)
  }

  private fun statusText(timer: TimerState) = when {
    timer.running -> context.copilotText(R.string.panel_shift_running)
    timer.started -> context.copilotText(R.string.panel_shift_paused)
    else -> context.copilotText(R.string.panel_shift_idle)
  }

  private fun renderToggle(timer: TimerState, colors: CardPalette) {
    toggleLabel.text = context.copilotText(
      when {
        timer.running -> R.string.panel_pause
        timer.started -> R.string.panel_resume
        else -> R.string.panel_start
      },
    )
    toggleLabel.setTextColor(colors.surface)
    toggleIcon.setImageResource(if (timer.running) R.drawable.ic_panel_pause else R.drawable.ic_panel_play)
    toggleIcon.imageTintList = ColorStateList.valueOf(colors.surface)
    toggle.background = pressable(colors.text, colors.surface)
  }

  private fun renderRows(lastOffer: OfferEvaluation?, colors: CardPalette, night: Boolean, format: OfferFormat) {
    lastOfferRow.visibility = if (lastOffer == null) View.GONE else View.VISIBLE
    lastOffer?.let {
      lastOfferDetail.text = "${it.sourceLabel} · ${format.money(it.offer.valueCents.toDouble())}"
      lastOfferBadge.setImageBitmap(ScoreBadge.bitmap(context, it, format, context.dp(BADGE_DP), night))
      lastOfferBadge.contentDescription = format.scoreDescription(it)
    }
    lastOfferDetail.setTextColor(colors.muted)
    hideDetail.setTextColor(colors.muted)
    rowIcons.forEach { it.imageTintList = ColorStateList.valueOf(colors.text) }
    rowLabels.forEach { it.setTextColor(colors.text) }
    rows.forEach { it.background = pressable(Color.TRANSPARENT, colors.text) }
  }

  private fun row(iconRes: Int, label: String, detail: TextView?, trailing: View?, onClick: () -> Unit): LinearLayout {
    val rowIcon = icon(iconRes, ICON_DP).also { rowIcons += it }
    val rowLabel = text(ROW_SP, bold = true).apply { text = label }.also { rowLabels += it }
    val column = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      addView(rowLabel)
      detail?.let { addView(it) }
    }
    return LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      minimumHeight = context.dp(ROW_DP)
      setPadding(context.dp(SPACE_S_DP), 0, context.dp(SPACE_S_DP), 0)
      addView(rowIcon, LinearLayout.LayoutParams(context.dp(ICON_DP), context.dp(ICON_DP)).apply { marginEnd = context.dp(SPACE_M_DP) })
      addView(column, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
      trailing?.let { addView(it) }
      setOnClickListener { onClick() }
    }
  }

  private fun pressable(fill: Int, ink: Int) = RippleDrawable(
    ColorStateList.valueOf((ink and 0x00FFFFFF) or RIPPLE_ALPHA),
    rounded(fill, ROW_CORNER_DP),
    rounded(Color.WHITE, ROW_CORNER_DP),
  )

  private fun rounded(fill: Int, cornerDp: Int) = GradientDrawable().apply {
    setColor(fill)
    cornerRadius = context.dp(cornerDp).toFloat()
  }

  private fun icon(res: Int, sizeDp: Int) = ImageView(context).apply {
    setImageResource(res)
    minimumWidth = context.dp(sizeDp)
    minimumHeight = context.dp(sizeDp)
  }

  private fun text(sizeSp: Float, bold: Boolean) = TextView(context).apply {
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
    typeface = if (bold) AppFonts.bold(context) else AppFonts.regular(context)
  }

  private companion object {
    const val PILL_COLOR = OverlayColors.INK
    const val DOT_RUNNING = 0xFF4FD08D.toInt()
    const val DOT_PAUSED = 0xFFF1B84B.toInt()
    const val RIPPLE_ALPHA = 0x33000000
    const val OPEN_CORNER_DP = 20
    const val ROW_CORNER_DP = 14
    const val OPEN_WIDTH_DP = 272
    const val HANDLE_DP = 56
    const val ROW_DP = 52
    const val LOGO_DP = 40
    const val PILL_DP = 52
    const val PILL_LOGO_DP = 24
    const val PILL_EDGE_DP = 16
    const val ICON_DP = 22
    const val BADGE_DP = 28
    const val SPACE_S_DP = 8
    const val SPACE_M_DP = 12
    const val ELEVATION_DP = 8
    const val TITLE_SP = 20f
    const val PILL_SP = 16f
    const val ROW_SP = 16f
    const val CAPTION_SP = 13f
  }
}
