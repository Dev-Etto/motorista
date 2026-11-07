package app.motorista.copilot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews

class OfferNotifier(private val context: Context) : OfferChannel {
  private val manager = context.getSystemService(NotificationManager::class.java)

  val enabled: Boolean
    get() = manager.areNotificationsEnabled()

  override fun show(evaluation: OfferEvaluation, preferences: CopilotPreferences) {
    if (!enabled) return

    createChannel()
    val notification = Notification.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_motorista)
      .setColor(evaluation.color.dayBackground)
      .setContentTitle(OfferFormat.notificationTitle(evaluation))
      .setContentText(OfferFormat.notificationText(evaluation))
      .setStyle(Notification.DecoratedCustomViewStyle())
      .setCustomContentView(contentView(evaluation, OfferFormat.notificationText(evaluation)))
      .setCustomBigContentView(contentView(evaluation, OfferFormat.notificationDetails(evaluation)))
      .setContentIntent(historyIntent())
      .setAutoCancel(true)
      .setLocalOnly(true)
      .setVisibility(Notification.VISIBILITY_SECRET)
      .setTimeoutAfter(preferences.durationSeconds * MS_PER_SECOND)
      .build()
    manager.notify(NOTIFICATION_ID, notification)
  }

  override fun hide() = manager.cancel(NOTIFICATION_ID)

  private fun contentView(evaluation: OfferEvaluation, text: String) = RemoteViews(context.packageName, R.layout.notification_offer).apply {
    val source = OfferSources.style(evaluation.sourceLabel)
    setTextViewText(R.id.offer_source, source.label)
    setTextColor(R.id.offer_source, source.text)
    setInt(R.id.offer_source, "setBackgroundColor", source.background)
    setTextViewText(R.id.offer_value, OfferFormat.money(evaluation.offer.valueCents.toDouble()))
    setImageViewBitmap(R.id.offer_score, ScoreBadge.bitmap(context, evaluation, context.resources.getDimensionPixelSize(R.dimen.offer_score_badge), isSystemNight()))
    setContentDescription(R.id.offer_score, OfferFormat.scoreDescription(evaluation))
    setTextViewText(R.id.offer_text, text)
  }

  private fun isSystemNight() =
    context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES

  private fun createChannel() {
    val channel = NotificationChannel(CHANNEL_ID, context.getString(R.string.offers_channel_name), NotificationManager.IMPORTANCE_HIGH).apply {
      description = context.getString(R.string.offers_channel_description)
      setSound(null, null)
      enableVibration(false)
      setShowBadge(false)
      lockscreenVisibility = Notification.VISIBILITY_SECRET
    }
    manager.createNotificationChannel(channel)
  }

  private fun historyIntent(): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("motorista://copilot")).setPackage(context.packageName)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
    return PendingIntent.getActivity(context, 0, intent, flags)
  }

  private companion object {
    const val CHANNEL_ID = "offers"
    const val NOTIFICATION_ID = 4202
    const val MS_PER_SECOND = 1000L
  }
}
