package app.motorista.copilot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import android.net.Uri

object ShiftNotification {
  private const val CHANNEL_ID = "jornada_em_andamento"
  private const val NOTIFICATION_ID = 2003
  private const val TOGGLE_REQUEST = 1
  private const val FINISH_REQUEST = 2
  private const val OPEN_REQUEST = 3
  const val ACTION_TOGGLE = "app.motorista.copilot.SHIFT_TOGGLE"
  private const val OPEN_URI = "motorista://shift/new"
  private const val FINISH_URI = "motorista://shift/new?finish=1"

  fun update(context: Context, state: TimerState, now: Long = System.currentTimeMillis()) {
    val manager = context.getSystemService(NotificationManager::class.java)
    if (!state.started) return manager.cancel(NOTIFICATION_ID)
    if (!manager.areNotificationsEnabled()) return

    manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, context.copilotText(R.string.shift_channel_name), NotificationManager.IMPORTANCE_LOW))
    val toggle = if (state.running) {
      action(context, R.drawable.ic_panel_pause, R.string.panel_pause, toggleIntent(context))
    } else {
      action(context, R.drawable.ic_panel_play, R.string.panel_resume, toggleIntent(context))
    }
    val builder = Notification.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_motorista)
      .setContentTitle(context.copilotText(if (state.running) R.string.panel_shift_running else R.string.panel_shift_paused))
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setLocalOnly(true)
      .setCategory(Notification.CATEGORY_STOPWATCH)
      .setContentIntent(linkIntent(context, OPEN_URI, OPEN_REQUEST))
      .addAction(toggle)
      .addAction(action(context, R.drawable.ic_panel_close, R.string.shift_finish, linkIntent(context, FINISH_URI, FINISH_REQUEST)))
    if (state.running) {
      builder.setUsesChronometer(true).setWhen(now - state.elapsedMs).setShowWhen(true)
    } else {
      builder.setUsesChronometer(false).setShowWhen(false).setContentText(OfferFormat.clock(state.elapsedMs))
    }
    manager.notify(NOTIFICATION_ID, builder.build())
  }

  private fun action(context: Context, icon: Int, label: Int, intent: PendingIntent) =
    Notification.Action.Builder(Icon.createWithResource(context, icon), context.copilotText(label), intent).build()

  private fun toggleIntent(context: Context) = PendingIntent.getBroadcast(
    context,
    TOGGLE_REQUEST,
    Intent(context, ShiftActionReceiver::class.java).setAction(ACTION_TOGGLE),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
  )

  private fun linkIntent(context: Context, uri: String, request: Int): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).setPackage(context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, request, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
}

class ShiftActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ShiftNotification.ACTION_TOGGLE) return

    val timer = ShiftTimer(context)
    if (timer.state().running) timer.pause() else timer.start()
  }
}
