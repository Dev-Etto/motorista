package app.motorista.copilot

import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView

data class CardPalette(
  val surface: Int,
  val text: Int,
  val muted: Int,
  val positive: Int,
  val negative: Int,
)

private val DAY_PALETTE = CardPalette(Color.WHITE, 0xFF171717.toInt(), 0xFF5E5E5E.toInt(), 0xFF0B6E3E.toInt(), 0xFFB3261E.toInt())
private val NIGHT_PALETTE = CardPalette(0xFF1C1C1C.toInt(), 0xFFF5F5F5.toInt(), 0xFFA8A8A8.toInt(), 0xFF4FD08D.toInt(), 0xFFFF8A80.toInt())

class OfferCardView(private val context: Context) {
  fun width(): Int = minOf(context.resources.displayMetrics.widthPixels - dp(SCREEN_MARGIN_DP) * 2, dp(MAX_WIDTH_DP))

  private fun isNight(theme: ThemeMode): Boolean {
    if (theme != ThemeMode.SYSTEM) return theme == ThemeMode.DARK
    val mode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    return mode == Configuration.UI_MODE_NIGHT_YES
  }

  fun palette(theme: ThemeMode) = if (isNight(theme)) NIGHT_PALETTE else DAY_PALETTE

  fun build(evaluation: OfferEvaluation, preferences: CopilotPreferences): View {
    val palette = palette(preferences.theme)
    val scale = preferences.cardSize.scale
    val body = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(PADDING_DP), dp(BODY_TOP_DP), dp(PADDING_DP), dp(PADDING_DP))
    }
    if (preferences.cardLayout == CardLayout.SUMMARY) addSummary(body, evaluation, preferences, palette, scale) else addComplete(body, evaluation, palette, scale)
    return LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      background = GradientDrawable().apply {
        setColor(palette.surface)
        cornerRadius = dp(CORNER_DP).toFloat()
      }
      clipToOutline = true
      elevation = dp(ELEVATION_DP).toFloat()
      addView(header(evaluation, scale))
      addView(body)
    }
  }

  private fun header(evaluation: OfferEvaluation, scale: Float) = LinearLayout(context).apply {
    val color = evaluation.color
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    setBackgroundColor(color.dayBackground)
    setPadding(dp(PADDING_DP), dp(HEADER_PADDING_DP), dp(PADDING_DP), dp(HEADER_PADDING_DP))
    addView(sourceColumn(evaluation, scale), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
    addView(label(OfferFormat.scoreLabel(evaluation), SCORE_SP * scale, color.dayText))
  }

  private fun sourceColumn(evaluation: OfferEvaluation, scale: Float) = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    addView(sourceChip(evaluation.sourceLabel, scale), LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT))
    evaluation.offer.passengerRating?.let {
      addView(label("★ ${OfferFormat.decimal(it, 2)}", CAPTION_SP * scale, evaluation.color.dayText, AppFonts.regular(context)))
    }
  }

  private fun sourceChip(sourceLabel: String, scale: Float): TextView {
    val style = OfferSources.style(sourceLabel)
    return label(sourceLabel, SOURCE_SP * scale, style.text).apply {
      setPadding(dp(CHIP_PADDING_H_DP), dp(CHIP_PADDING_V_DP), dp(CHIP_PADDING_H_DP), dp(CHIP_PADDING_V_DP))
      background = GradientDrawable().apply {
        setColor(style.background)
        cornerRadius = dp(CHIP_CORNER_DP).toFloat()
      }
    }
  }

  private fun addComplete(body: LinearLayout, evaluation: OfferEvaluation, palette: CardPalette, scale: Float) {
    val offerRow = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      addView(label(OfferFormat.money(evaluation.offer.valueCents.toDouble()), VALUE_SP * scale, palette.text), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
      addView(label(OfferFormat.distanceAndTime(evaluation), DETAIL_SP * scale, palette.muted, AppFonts.regular(context)))
    }
    val metrics = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      setPadding(0, dp(METRICS_TOP_DP), 0, 0)
      addView(metric("Por km", OfferFormat.money(evaluation.perKmCents), evaluation.kmOnTarget, palette, scale), columnParams())
      addView(metric("Por hora", OfferFormat.wholeMoney(evaluation.perHourCents), evaluation.hourOnTarget, palette, scale), columnParams())
      evaluation.profitCents?.let { addView(metric("Lucro", OfferFormat.money(it), it >= 0, palette, scale, false), columnParams()) }
    }
    body.addView(offerRow)
    body.addView(metrics)
  }

  private fun columnParams() = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)

  private fun metric(title: String, value: String, onTarget: Boolean?, palette: CardPalette, scale: Float, showArrow: Boolean = true) = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    addView(label(title, CAPTION_SP * scale, palette.muted, AppFonts.regular(context)))
    val tone = when (onTarget) {
      true -> palette.positive
      false -> palette.negative
      null -> palette.text
    }
    val arrow = if (!showArrow || onTarget == null) "" else if (onTarget) " ▲" else " ▼"
    addView(label("$value$arrow", METRIC_SP * scale, tone))
  }

  private fun addSummary(body: LinearLayout, evaluation: OfferEvaluation, preferences: CopilotPreferences, palette: CardPalette, scale: Float) {
    val profit = evaluation.profitCents
    val main = if (preferences.primaryMetric == PrimaryMetric.PROFIT && profit != null) OfferFormat.signedMoney(profit) else "${OfferFormat.money(evaluation.perKmCents)}/km"
    body.addView(label(main, SUMMARY_SP * scale, palette.text))
  }

  private fun label(value: String, sizeSp: Float, color: Int, face: Typeface = AppFonts.bold(context)) = TextView(context).apply {
    text = value
    setTextColor(color)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
    typeface = face
  }

  private fun dp(value: Int) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP,
    value.toFloat(),
    context.resources.displayMetrics,
  ).toInt()

  private companion object {
    const val SCREEN_MARGIN_DP = 12
    const val MAX_WIDTH_DP = 380
    const val PADDING_DP = 16
    const val HEADER_PADDING_DP = 10
    const val BODY_TOP_DP = 12
    const val METRICS_TOP_DP = 12
    const val CORNER_DP = 20
    const val ELEVATION_DP = 8
    const val CHIP_PADDING_H_DP = 10
    const val CHIP_PADDING_V_DP = 3
    const val CHIP_CORNER_DP = 8
    const val SOURCE_SP = 18f
    const val SCORE_SP = 36f
    const val VALUE_SP = 28f
    const val DETAIL_SP = 17f
    const val METRIC_SP = 20f
    const val CAPTION_SP = 14f
    const val SUMMARY_SP = 36f
  }
}
