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
  private val palette = OfferCardView(context)
  private val logo = icon(R.drawable.ic_stat_motorista, LOGO_DP)
  private val title = text(TITLE_SP, bold = true)
  private val status = text(CAPTION_SP, bold = false)
  private val close = icon(R.drawable.ic_panel_close, ICON_DP)
  private val toggleIcon = icon(R.drawable.ic_panel_play, ICON_DP)
  private val toggleLabel = text(ROW_SP, bold = true)
  private val toggle = LinearLayout(context).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER
    minimumHeight = dp(ROW_DP)
    addView(toggleIcon, LinearLayout.LayoutParams(dp(ICON_DP), dp(ICON_DP)).apply { marginEnd = dp(SPACE_S_DP) })
    addView(toggleLabel)
    setOnClickListener { onToggle() }
  }
  private val lastOfferDetail = text(CAPTION_SP, bold = false)
  private val rowIcons = mutableListOf<ImageView>()
  private val rowLabels = mutableListOf<TextView>()
  private val lastOfferRow = row(R.drawable.ic_panel_offer, "Última oferta", lastOfferDetail, onLastOffer)
  private val rows = listOf(lastOfferRow, row(R.drawable.ic_panel_open, "Abrir o app", null, onOpenApp), row(R.drawable.ic_panel_hide, "Ocultar o botão", null, onHide))
  private val titles = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    addView(title)
    addView(status)
  }
  val handle = LinearLayout(context).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    minimumHeight = dp(HANDLE_DP)
    minimumWidth = dp(HANDLE_DP)
    addView(logo, LinearLayout.LayoutParams(dp(LOGO_DP), dp(LOGO_DP)))
    addView(titles, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
    addView(close, LinearLayout.LayoutParams(dp(ICON_DP), dp(ICON_DP)))
  }
  private val menu = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    setPadding(0, dp(SPACE_S_DP), 0, 0)
    addView(toggle, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(SPACE_S_DP) })
    rows.forEach { addView(it) }
  }
  val view = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    addView(handle)
    addView(menu)
  }

  fun render(timer: TimerState, lastOffer: OfferEvaluation?, open: Boolean, theme: ThemeMode) {
    val colors = palette.palette(theme)
    val clock = OfferFormat.clock(timer.elapsedMs)
    menu.visibility = if (open) View.VISIBLE else View.GONE
    if (open) renderOpen(timer, lastOffer, clock, colors) else renderClosed(timer, clock)
  }

  private fun renderClosed(timer: TimerState, clock: String) {
    view.background = rounded(PILL_COLOR, CLOSED_CORNER_DP).apply { setStroke(dp(1), PILL_STROKE) }
    view.elevation = dp(ELEVATION_DP).toFloat()
    view.setPadding(0, 0, 0, 0)
    view.minimumWidth = 0
    handle.gravity = Gravity.CENTER
    handle.setPadding(if (timer.started) dp(SPACE_M_DP) else 0, 0, if (timer.started) dp(SPACE_L_DP) else 0, 0)
    logo.visibility = View.VISIBLE
    logo.layoutParams = LinearLayout.LayoutParams(dp(if (timer.started) LOGO_WITH_CLOCK_DP else LOGO_DP), dp(if (timer.started) LOGO_WITH_CLOCK_DP else LOGO_DP)).apply { marginEnd = if (timer.started) dp(SPACE_S_DP) else 0 }
    logo.imageTintList = ColorStateList.valueOf(Color.WHITE)
    titles.visibility = if (timer.started) View.VISIBLE else View.GONE
    titles.layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
    title.text = clock
    title.setTextColor(Color.WHITE)
    status.visibility = View.GONE
    close.visibility = View.GONE
  }

  private fun renderOpen(timer: TimerState, lastOffer: OfferEvaluation?, clock: String, colors: CardPalette) {
    view.background = rounded(colors.surface, OPEN_CORNER_DP)
    view.elevation = dp(ELEVATION_DP).toFloat()
    view.setPadding(dp(SPACE_M_DP), dp(SPACE_S_DP), dp(SPACE_M_DP), dp(SPACE_M_DP))
    view.minimumWidth = dp(OPEN_WIDTH_DP)
    handle.gravity = Gravity.CENTER_VERTICAL
    handle.setPadding(0, 0, 0, 0)
    logo.visibility = View.VISIBLE
    logo.layoutParams = LinearLayout.LayoutParams(dp(LOGO_DP), dp(LOGO_DP)).apply { marginEnd = dp(SPACE_S_DP) }
    logo.imageTintList = ColorStateList.valueOf(colors.text)
    titles.visibility = View.VISIBLE
    titles.layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    title.text = if (timer.started) clock else "Motorista"
    title.setTextColor(colors.text)
    status.visibility = View.VISIBLE
    status.text = statusText(timer)
    status.setTextColor(colors.muted)
    close.visibility = View.VISIBLE
    close.imageTintList = ColorStateList.valueOf(colors.muted)
    renderToggle(timer, colors)
    renderRows(lastOffer, colors)
  }

  private fun statusText(timer: TimerState) = when {
    timer.running -> "Jornada em andamento"
    timer.started -> "Jornada pausada"
    else -> "Nenhuma jornada iniciada"
  }

  private fun renderToggle(timer: TimerState, colors: CardPalette) {
    toggleLabel.text = if (timer.running) "Pausar" else if (timer.started) "Retomar" else "Iniciar cronômetro"
    toggleLabel.setTextColor(colors.surface)
    toggleIcon.setImageResource(if (timer.running) R.drawable.ic_panel_pause else R.drawable.ic_panel_play)
    toggleIcon.imageTintList = ColorStateList.valueOf(colors.surface)
    toggle.background = pressable(colors.text, colors.surface)
  }

  private fun renderRows(lastOffer: OfferEvaluation?, colors: CardPalette) {
    lastOfferRow.visibility = if (lastOffer == null) View.GONE else View.VISIBLE
    lastOffer?.let { lastOfferDetail.text = "${it.sourceLabel} · ${OfferFormat.money(it.offer.valueCents.toDouble())} · ${OfferFormat.scoreLabel(it)}" }
    lastOfferDetail.setTextColor(colors.muted)
    rowIcons.forEach { it.imageTintList = ColorStateList.valueOf(colors.text) }
    rowLabels.forEach { it.setTextColor(colors.text) }
    rows.forEach { it.background = pressable(Color.TRANSPARENT, colors.text) }
  }

  private fun row(iconRes: Int, label: String, detail: TextView?, onClick: () -> Unit): LinearLayout {
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
      minimumHeight = dp(ROW_DP)
      setPadding(dp(SPACE_S_DP), 0, dp(SPACE_S_DP), 0)
      addView(rowIcon, LinearLayout.LayoutParams(dp(ICON_DP), dp(ICON_DP)).apply { marginEnd = dp(SPACE_M_DP) })
      addView(column)
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
    cornerRadius = dp(cornerDp).toFloat()
  }

  private fun icon(res: Int, sizeDp: Int) = ImageView(context).apply {
    setImageResource(res)
    minimumWidth = dp(sizeDp)
    minimumHeight = dp(sizeDp)
  }

  private fun text(sizeSp: Float, bold: Boolean) = TextView(context).apply {
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
    typeface = if (bold) AppFonts.bold(context) else AppFonts.regular(context)
  }

  private fun dp(value: Int) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP,
    value.toFloat(),
    context.resources.displayMetrics,
  ).toInt()

  private companion object {
    const val PILL_COLOR = 0xFF171717.toInt()
    const val PILL_STROKE = 0x3DFFFFFF
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
    const val SPACE_S_DP = 8
    const val SPACE_M_DP = 12
    const val SPACE_L_DP = 14
    const val ELEVATION_DP = 8
    const val TITLE_SP = 20f
    const val ROW_SP = 16f
    const val CAPTION_SP = 13f
  }
}
