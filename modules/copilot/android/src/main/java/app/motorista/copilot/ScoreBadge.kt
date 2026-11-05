package app.motorista.copilot

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF

object ScoreBadge {
  private const val SCORE_RATIO = 0.56f
  private const val SCALE_RATIO = 0.32f
  private const val PADDING_RATIO = 0.3f
  private const val CORNER_RATIO = 0.3f
  private const val SCALE_ALPHA = 200
  private const val SCALE_TEXT = "/5"
  private const val EMPTY_TEXT = "—"

  fun bitmap(context: Context, evaluation: OfferEvaluation, height: Int, night: Boolean): Bitmap {
    val color = evaluation.color
    val ink = if (night) color.nightText else color.dayText
    val scorePaint = textPaint(context, ink, height * SCORE_RATIO)
    val scalePaint = textPaint(context, ink, height * SCALE_RATIO).apply { alpha = SCALE_ALPHA }
    val score = evaluation.score?.let { OfferFormat.decimal(it) } ?: EMPTY_TEXT
    val scale = if (evaluation.score == null) "" else SCALE_TEXT
    val padding = height * PADDING_RATIO
    val width = padding * 2 + scorePaint.measureText(score) + scalePaint.measureText(scale)

    val bitmap = Bitmap.createBitmap(Math.ceil(width.toDouble()).toInt(), height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = if (night) color.nightAccent else color.dayBackground }
    val corner = height * CORNER_RATIO
    canvas.drawRoundRect(RectF(0f, 0f, width, height.toFloat()), corner, corner, fill)

    val baseline = height / 2f - (scorePaint.descent() + scorePaint.ascent()) / 2
    canvas.drawText(score, padding, baseline, scorePaint)
    canvas.drawText(scale, padding + scorePaint.measureText(score), baseline, scalePaint)
    return bitmap
  }

  private fun textPaint(context: Context, ink: Int, size: Float) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = ink
    typeface = AppFonts.bold(context)
    textSize = size
  }
}
