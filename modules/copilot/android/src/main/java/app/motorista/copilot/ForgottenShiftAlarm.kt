package app.motorista.copilot

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Notification
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri

object ForgottenShiftAlarm {
  private const val FORGOTTEN_AFTER_MS = 14 * 60 * 60 * 1000L
  private const val CHANNEL_ID = "jornada"
  private const val NOTIFICATION_ID = 2002
  private const val FINISH_SHIFT_URI = "motorista://shift/new?finish=1"

  fun triggerAt(accumulatedMs: Long, resumedAt: Long): Long? {
    if (accumulatedMs >= FORGOTTEN_AFTER_MS) return null
    return resumedAt + FORGOTTEN_AFTER_MS - accumulatedMs
  }

  fun schedule(context: Context, accumulatedMs: Long, resumedAt: Long) {
    val time = triggerAt(accumulatedMs, resumedAt) ?: return
    context.getSystemService(AlarmManager::class.java).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pendingIntent(context))
  }

  fun cancel(context: Context) {
    context.getSystemService(AlarmManager::class.java).cancel(pendingIntent(context))
    context.getSystemService(NotificationManager::class.java).cancel(NOTIFICATION_ID)
  }

  fun notify(context: Context) {
    val manager = context.getSystemService(NotificationManager::class.java)
    if (!manager.areNotificationsEnabled()) return

    manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, context.copilotText(R.string.forgotten_channel_name), NotificationManager.IMPORTANCE_DEFAULT))
    val notification = Notification.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_motorista)
      .setContentTitle(context.copilotText(R.string.forgotten_title))
      .setContentText(context.copilotText(R.string.forgotten_text))
      .setContentIntent(openAppIntent(context))
      .setAutoCancel(true)
      .setLocalOnly(true)
      .build()
    manager.notify(NOTIFICATION_ID, notification)
  }

  private fun openAppIntent(context: Context): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(FINISH_SHIFT_URI)).setPackage(context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, NOTIFICATION_ID, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun pendingIntent(context: Context) = PendingIntent.getBroadcast(
    context,
    NOTIFICATION_ID,
    Intent(context, ForgottenShiftReceiver::class.java),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
  )
}

class ForgottenShiftReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (ShiftTimer(context).state().running) ForgottenShiftAlarm.notify(context)
  }
}
