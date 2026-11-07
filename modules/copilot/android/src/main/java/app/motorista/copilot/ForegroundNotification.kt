package app.motorista.copilot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.pm.ServiceInfo
import android.os.Build

object ForegroundNotification {
  private const val CHANNEL_ID = "floating_timer"
  private const val NOTIFICATION_ID = 4201

  fun start(service: Service) {
    val manager = service.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, service.getString(R.string.floating_channel_name), NotificationManager.IMPORTANCE_LOW))
    val notification = Notification.Builder(service, CHANNEL_ID)
      .setContentTitle(service.getString(R.string.floating_notification_title))
      .setContentText(service.getString(R.string.floating_notification_text))
      .setSmallIcon(R.drawable.ic_stat_motorista)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      service.startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      return
    }
    service.startForeground(NOTIFICATION_ID, notification)
  }
}
