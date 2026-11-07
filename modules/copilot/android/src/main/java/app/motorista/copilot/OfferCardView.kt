package app.motorista.copilot

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

class OfferCardView(private val context: Context) {
  private val cardTheme = CardTheme(context)

  fun width(): Int = minOf(context.resources.displayMetrics.widthPixels - context.dp(SCREEN_MARGIN_DP) * 2, context.dp(MAX_WIDTH_DP))

  fun build(evaluation: OfferEvaluation, preferences: CopilotPreferences): View {
    val palette = cardTheme.palette(preferences.theme)
    val scale = preferences.cardSize.scale
    val body = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(context.dp(PADDING_DP), context.dp(BODY_TOP_DP), context.dp(PADDING_DP), context.dp(PADDING_DP))
    }
    if (preferences.cardLayout == CardLayout.SUMMARY) addSummary(body, evaluation, preferences, palette, scale) else addComplete(body, evaluation, palette, scale)
    return LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      background = GradientDrawable().apply {
        setColor(palette.surface)
        cornerRadius = context.dp(CORNER_DP).toFloat()
      }
      clipToOutline = true
      elevation = context.dp(ELEVATION_DP).toFloat()
      addView(header(evaluation, preferences.theme, scale))
      addView(body)
    }
  }

  private fun header(evaluation: OfferEvaluation, theme: ThemeMode, scale: Float) = LinearLayout(context).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    setPadding(context.dp(PADDING_DP), context.dp(PADDING_DP), context.dp(PADDING_DP), 0)
    addView(sourceColumn(evaluation, scale), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
    addView(scoreBadge(evaluation, theme, scale))
  }

  private fun scoreBadge(evaluation: OfferEvaluation, theme: ThemeMode, scale: Float) = ImageView(context).apply {
    setImageBitmap(ScoreBadge.bitmap(context, evaluation, context.dp((BADGE_DP * scale).toInt()), cardTheme.isNight(theme)))
    contentDescription = OfferFormat.scoreDescription(evaluation)
  }

  private fun sourceColumn(evaluation: OfferEvaluation, scale: Float) = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    addView(sourceChip(evaluation.sourceLabel, scale))
  }

  private fun sourceChip(sourceLabel: String, scale: Float): TextView {
    val style = OfferSources.style(sourceLabel)
    return label(sourceLabel, SOURCE_SP * scale, style.text).apply {
      layoutParams = LinearLayout.LayoutParams(context.dp((SOURCE_WIDTH_DP * scale).toInt()), context.dp((SOURCE_HEIGHT_DP * scale).toInt()))
      gravity = Gravity.CENTER
      background = GradientDrawable().apply {
        setColor(style.background)
        cornerRadius = context.dp(CHIP_CORNER_DP).toFloat()
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
      setPadding(0, context.dp(METRICS_TOP_DP), 0, 0)
      addView(metric(context.getString(R.string.card_per_km), OfferFormat.money(evaluation.perKmCents), evaluation.kmOnTarget, palette, scale), columnParams())
      addView(metric(context.getString(R.string.card_per_hour), if (evaluation.offer.minutes > 0) OfferFormat.wholeMoney(evaluation.perHourCents) else "—", evaluation.hourOnTarget, palette, scale), columnParams())
      evaluation.profitCents?.let { addView(metric(context.getString(R.string.card_profit), OfferFormat.money(it), it >= 0, palette, scale, false), columnParams()) }
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
    val arrow = when {
      !showArrow || onTarget == null -> ""
      onTarget -> " ▲"
      else -> " ▼"
    }
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


  private companion object {
    const val SCREEN_MARGIN_DP = 12
    const val MAX_WIDTH_DP = 380
    const val PADDING_DP = 16
    const val BODY_TOP_DP = 12
    const val METRICS_TOP_DP = 12
    const val CORNER_DP = 20
    const val ELEVATION_DP = 8
    const val CHIP_CORNER_DP = 8
    const val SOURCE_SP = 18f
    const val SOURCE_WIDTH_DP = 84
    const val SOURCE_HEIGHT_DP = 36
    const val BADGE_DP = 48
    const val VALUE_SP = 28f
    const val DETAIL_SP = 17f
    const val METRIC_SP = 20f
    const val CAPTION_SP = 14f
    const val SUMMARY_SP = 36f
  }
}
