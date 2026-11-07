package app.motorista.copilot

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
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
  )

  private var rendered: PanelState? = null
  private val cardTheme = CardTheme(context)
  private val logo = icon(R.drawable.ic_stat_motorista, LOGO_DP)
  private val title = text(TITLE_SP, bold = true)
  private val status = text(CAPTION_SP, bold = false)
  private val close = icon(R.drawable.ic_panel_close, ICON_DP)
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
    addView(logo, LinearLayout.LayoutParams(context.dp(LOGO_DP), context.dp(LOGO_DP)))
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

  fun render(timer: TimerState, lastOffer: OfferEvaluation?, open: Boolean, theme: ThemeMode, format: OfferFormat) {
    val clock = OfferFormat.clock(timer.elapsedMs)
    if (title.text.toString() != clock) title.text = clock

    val night = cardTheme.isNight(theme)
    val next = PanelState(open, timer.running, timer.started, lastOffer, theme, night)
    if (next == rendered) return

    rendered = next
    menu.visibility = if (open) View.VISIBLE else View.GONE
    if (open) renderOpen(timer, lastOffer, cardTheme.palette(theme), night, format) else renderClosed()
  }

  private fun renderClosed() {
    view.background = rounded(PILL_COLOR, CLOSED_CORNER_DP).apply { setStroke(context.dp(1), PILL_STROKE) }
    view.elevation = context.dp(ELEVATION_DP).toFloat()
    view.setPadding(0, 0, 0, 0)
    view.minimumWidth = 0
    handle.gravity = Gravity.CENTER
    handle.setPadding(context.dp(SPACE_M_DP), 0, context.dp(SPACE_L_DP), 0)
    logo.visibility = View.VISIBLE
    logo.layoutParams = LinearLayout.LayoutParams(context.dp(LOGO_WITH_CLOCK_DP), context.dp(LOGO_WITH_CLOCK_DP)).apply { marginEnd = context.dp(SPACE_S_DP) }
    logo.imageTintList = ColorStateList.valueOf(Color.WHITE)
    titles.visibility = View.VISIBLE
    titles.layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
    title.setTextColor(Color.WHITE)
    status.visibility = View.GONE
    close.visibility = View.GONE
  }

  private fun renderOpen(timer: TimerState, lastOffer: OfferEvaluation?, colors: CardPalette, night: Boolean, format: OfferFormat) {
    view.background = rounded(colors.surface, OPEN_CORNER_DP)
    view.elevation = context.dp(ELEVATION_DP).toFloat()
    view.setPadding(context.dp(SPACE_M_DP), context.dp(SPACE_S_DP), context.dp(SPACE_M_DP), context.dp(SPACE_M_DP))
    view.minimumWidth = context.dp(OPEN_WIDTH_DP)
    handle.gravity = Gravity.CENTER_VERTICAL
    handle.setPadding(0, 0, 0, 0)
    logo.visibility = View.VISIBLE
    logo.layoutParams = LinearLayout.LayoutParams(context.dp(LOGO_DP), context.dp(LOGO_DP)).apply { marginEnd = context.dp(SPACE_S_DP) }
    logo.imageTintList = ColorStateList.valueOf(colors.text)
    titles.visibility = View.VISIBLE
    titles.layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
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
    const val PILL_STROKE = OverlayColors.HAIRLINE
    const val RIPPLE_ALPHA = 0x33000000
    const val CLOSED_CORNER_DP = 18
    const val OPEN_CORNER_DP = 20
    const val ROW_CORNER_DP = 14
    const val OPEN_WIDTH_DP = 272
    const val HANDLE_DP = 56
    const val ROW_DP = 52
    const val LOGO_DP = 40
    const val LOGO_WITH_CLOCK_DP = 28
    const val ICON_DP = 22
    const val BADGE_DP = 28
    const val SPACE_S_DP = 8
    const val SPACE_M_DP = 12
    const val SPACE_L_DP = 14
    const val ELEVATION_DP = 8
    const val TITLE_SP = 20f
    const val ROW_SP = 16f
    const val CAPTION_SP = 13f
  }
}
