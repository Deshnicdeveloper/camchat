/**
 * Push Notification Service
 * Handles FCM token management, permissions, notification listeners, and deep linking
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { updateUserProfile } from './auth';
import { t } from './i18n';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification data types sent from Cloud Functions
export interface NotificationData {
  type: 'message' | 'call' | 'status_reply';
  chatId?: string;
  callId?: string;
  senderId?: string;
  senderName?: string;
  isIncoming?: boolean;
}

/**
 * Request notification permissions
 * Returns true if permission is granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return false;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'CamChat',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1034A6',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('calls', {
        name: 'Calls',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 500, 500],
        lightColor: '#1034A6',
        sound: 'default',
        bypassDnd: true,
      });
    }

    console.log('✅ Notification permissions granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the Expo push token for this device
 * Returns the token string or null if failed
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('⚠️ Push tokens require a physical device');
      return null;
    }

    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    if (!projectId) {
      console.warn('⚠️ EXPO_PUBLIC_EAS_PROJECT_ID not set, cannot get push token');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;
    console.log('✅ Expo push token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    return null;
  }
}

/**
 * Register the push token for the current user
 * Saves the token to Firestore so Cloud Functions can send notifications
 */
export async function registerPushToken(userId: string): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const token = await getExpoPushToken();
    if (!token) return null;

    // Save token to user's Firestore document
    await updateUserProfile(userId, { fcmToken: token });
    console.log('✅ Push token saved for user:', userId);
    return token;
  } catch (error) {
    console.error('❌ Error registering push token:', error);
    return null;
  }
}

/**
 * Set up notification listeners for foreground and background handling
 * Returns a cleanup function to remove all listeners
 */
export function setupNotificationListeners(
  onNotificationTapped?: (data: NotificationData) => void
): () => void {
  // Listener for notifications received while app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('📬 Notification received in foreground:', notification.request.content.title);
      // The notification is already displayed by our handler above
    }
  );

  // Listener for when user taps on a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as unknown as NotificationData;
      console.log('👆 Notification tapped:', data);

      if (onNotificationTapped) {
        onNotificationTapped(data);
      } else {
        // Default deep linking behavior
        handleNotificationTap(data);
      }
    }
  );

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Handle notification tap by navigating to the appropriate screen
 */
export function handleNotificationTap(data: NotificationData): void {
  try {
    switch (data.type) {
      case 'message':
        if (data.chatId) {
          router.push(`/(tabs)/chats/${data.chatId}`);
        } else {
          router.push('/(tabs)/chats');
        }
        break;

      case 'call':
        if (data.callId) {
          router.push(`/call/${data.callId}?isIncoming=true`);
        } else {
          router.push('/(tabs)/calls');
        }
        break;

      case 'status_reply':
        if (data.senderId) {
          router.push(`/(tabs)/chats`);
        } else {
          router.push('/(tabs)/status');
        }
        break;

      default:
        router.push('/(tabs)/chats');
        break;
    }
  } catch (error) {
    console.error('❌ Error handling notification tap:', error);
    router.push('/(tabs)/chats');
  }
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Get the last notification response (for cold start handling)
 * If the app was opened by tapping a notification, this returns that notification
 */
export async function getLastNotificationResponse(): Promise<NotificationData | null> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      return response.notification.request.content.data as unknown as NotificationData;
    }
    return null;
  } catch (error) {
    console.error('Error getting last notification response:', error);
    return null;
  }
}
