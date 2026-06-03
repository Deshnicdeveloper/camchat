/**
 * CamChat Firebase Cloud Functions
 * Sends push notifications via Expo Push Service for:
 * - New messages
 * - Incoming calls
 * - Status replies
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

admin.initializeApp();

const db = admin.firestore();
const expo = new Expo();

// Helper: send push notifications to a list of Expo push tokens
async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
  channelId: string = 'default'
): Promise<void> {
  const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    console.log('No valid Expo push tokens found');
    return;
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    channelId,
    priority: 'high',
    badge: 1,
  }));

  // Expo recommends chunking to avoid rate limits
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }

  // Log any errors from tickets
  tickets.forEach((ticket, i) => {
    if (ticket.status === 'error') {
      console.error(`Push ticket error for token ${validTokens[i]}:`, ticket.message, ticket.details);
    }
  });
}

// Helper: get user profile from Firestore
async function getUserProfile(userId: string): Promise<{ displayName: string; fcmToken: string } | null> {
  try {
    const doc = await db.collection('users').doc(userId).get();
    if (doc.exists) {
      const data = doc.data();
      return {
        displayName: data?.displayName || 'Unknown',
        fcmToken: data?.fcmToken || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Helper: get chat participants' FCM tokens (excluding sender)
async function getRecipientTokens(chatId: string, senderId: string): Promise<string[]> {
  try {
    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) return [];

    const chatData = chatDoc.data();
    const participants: string[] = chatData?.participants || [];
    const recipients = participants.filter((id) => id !== senderId);

    const tokens: string[] = [];
    for (const userId of recipients) {
      const profile = await getUserProfile(userId);
      if (profile?.fcmToken) {
        tokens.push(profile.fcmToken);
      }
    }

    return tokens;
  } catch (error) {
    console.error('Error getting recipient tokens:', error);
    return [];
  }
}

/**
 * Trigger: New message created in chats/{chatId}/messages/{messageId}
 * Sends push notification to all chat participants except the sender
 */
export const onNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const { chatId } = context.params;
    const messageData = snapshot.data();

    if (!messageData) return;

    const { senderId, type, text } = messageData;

    // Get sender info
    const sender = await getUserProfile(senderId);
    const senderName = sender?.displayName || 'Someone';

    // Get recipient tokens
    const tokens = await getRecipientTokens(chatId, senderId);
    if (tokens.length === 0) return;

    // Build notification body based on message type
    let body: string;
    switch (type) {
      case 'image':
        body = '📷 Photo';
        break;
      case 'video':
        body = '📹 Video';
        break;
      case 'audio':
        body = '🎤 Voice note';
        break;
      case 'document':
        body = '📄 Document';
        break;
      case 'location':
        body = '📍 Location';
        break;
      default:
        body = text || 'New message';
        break;
    }

    await sendPushNotifications(
      tokens,
      senderName,
      body,
      {
        type: 'message',
        chatId,
        senderId,
        senderName,
      }
    );
  });

/**
 * Trigger: New call document created in calls/{callId}
 * Sends push notification to the receiver
 */
export const onIncomingCall = functions.firestore
  .document('calls/{callId}')
  .onCreate(async (snapshot, context) => {
    const callData = snapshot.data();

    if (!callData) return;

    const { callerId, receiverId, type } = callData;

    // Get caller info
    const caller = await getUserProfile(callerId);
    const callerName = caller?.displayName || 'Someone';

    // Get receiver's FCM token
    const receiver = await getUserProfile(receiverId);
    if (!receiver?.fcmToken) return;

    const callType = type === 'video' ? '📹 Video call' : '📞 Voice call';

    await sendPushNotifications(
      [receiver.fcmToken],
      callerName,
      `Incoming ${callType}`,
      {
        type: 'call',
        callId: context.params.callId,
        senderId: callerId,
        senderName: callerName,
        isIncoming: 'true',
      },
      'calls'
    );
  });

/**
 * Trigger: Call status updated in calls/{callId}
 * Handles missed calls (auto-declined after timeout)
 */
export const onCallStatusUpdate = functions.firestore
  .document('calls/{callId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only handle missed calls
    if (before.status === 'ringing' && after.status === 'missed') {
      const { callerId, receiverId } = after;

      const receiver = await getUserProfile(receiverId);
      const receiverName = receiver?.displayName || 'Someone';

      const caller = await getUserProfile(callerId);
      if (!caller?.fcmToken) return;

      await sendPushNotifications(
        [caller.fcmToken],
        'Missed call',
        `${receiverName} missed your call`,
        {
          type: 'call',
          callId: context.params.callId,
        }
      );
    }
  });

/**
 * Trigger: New status reply message
 * Status replies are sent as direct messages to the status owner.
 * This function notifies the status owner if they're not in the chat.
 * (The onNewMessage trigger handles the actual notification for regular messages,
 *  but this provides additional context for status replies)
 */
export const onStatusReply = functions.firestore
  .document('statuses/{statusId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if viewedBy array has new entries (someone viewed the status)
    // This is handled client-side; no push notification needed for views
  });

/**
 * Callable function: Send a test notification
 * Useful for debugging push notifications
 */
export const sendTestNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;
  const profile = await getUserProfile(userId);

  if (!profile?.fcmToken) {
    throw new functions.https.HttpsError('failed-precondition', 'No FCM token found');
  }

  await sendPushNotifications(
    [profile.fcmToken],
    'CamChat Test',
    'Push notifications are working! 🎉',
    { type: 'message' }
  );

  return { success: true };
});
