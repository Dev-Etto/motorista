import * as Notifications from 'expo-notifications';

export interface NotificationContent {
  title: string;
  body: string;
}

export async function ensureNotifications(): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

export async function hasNotificationPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

export function scheduleAt(content: NotificationContent, date: Date): Promise<string> {
  return Notifications.scheduleNotificationAsync({ content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date } });
}

export function scheduleDaily(content: NotificationContent, hour: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({ content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 } });
}

export function cancelScheduled(id: string): Promise<void> {
  return Notifications.cancelScheduledNotificationAsync(id);
}

export function cancelAllScheduled(): Promise<void> {
  return Notifications.cancelAllScheduledNotificationsAsync();
}
