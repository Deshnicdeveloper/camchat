/**
 * Messages Service
 * Handles message-related Firestore operations
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  Timestamp,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, getServerTimestamp } from './firestore';
import { updateChatLastMessage, incrementUnreadCount } from './chat';
import type { Message, MessageType, ReplyReference } from '../types';

interface SendMessageData {
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  audioDuration?: number;
  fileName?: string;
  fileSize?: number;
  location?: { lat: number; lng: number; label: string };
  replyTo?: ReplyReference;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Convert Firestore document to Message type
 */
function firestoreDocToMessage(
  docId: string,
  data: Record<string, unknown>
): Message {
  return {
    id: docId,
    senderId: data.senderId as string,
    type: data.type as MessageType,
    text: data.text as string | undefined,
    mediaUrl: data.mediaUrl as string | undefined,
    mediaThumbnail: data.mediaThumbnail as string | undefined,
    audioDuration: data.audioDuration as number | undefined,
    fileName: data.fileName as string | undefined,
    fileSize: data.fileSize as number | undefined,
    location: data.location as { lat: number; lng: number; label: string } | undefined,
    replyTo: data.replyTo as ReplyReference | undefined,
    reactions: (data.reactions as Record<string, string>) || {},
    status: (data.status as Message['status']) || 'sent',
    readBy: (data.readBy as string[]) || [],
    deletedFor: (data.deletedFor as string[]) || [],
    isStarred: (data.isStarred as boolean) || false,
    timestamp:
      (data.timestamp as Timestamp)?.toDate?.() ||
      (data.timestamp as { toDate?: () => Date })?.toDate?.() ||
      new Date(),
  };
}

/**
 * Send a message to a chat
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  messageData: SendMessageData,
  participants: string[]
): Promise<SendMessageResult> {
  try {
    const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, 'messages');

    // Create message document
    const newMessage = {
      senderId,
      type: messageData.type,
      text: messageData.text || '',
      mediaUrl: messageData.mediaUrl || null,
      mediaThumbnail: messageData.mediaThumbnail || null,
      audioDuration: messageData.audioDuration || null,
      fileName: messageData.fileName || null,
      fileSize: messageData.fileSize || null,
      location: messageData.location || null,
      replyTo: messageData.replyTo || null,
      reactions: {},
      status: 'sent',
      readBy: [senderId],
      deletedFor: [],
      isStarred: false,
      timestamp: getServerTimestamp(),
    };

    const docRef = await addDoc(messagesRef, newMessage);

    console.log('✅ Message sent:', docRef.id);

    // Update chat's last message
    const lastMessageText =
      messageData.text ||
      (messageData.type === 'image'
        ? 'Photo'
        : messageData.type === 'audio'
        ? 'Voice message'
        : messageData.type === 'video'
        ? 'Video'
        : messageData.type === 'document'
        ? 'Document'
        : messageData.type === 'location'
        ? 'Location'
        : 'Message');

    await updateChatLastMessage(chatId, {
      text: lastMessageText,
      senderId,
      type: messageData.type,
    });

    // Increment unread count for other participants
    await incrementUnreadCount(chatId, senderId, participants);

    return {
      success: true,
      messageId: docRef.id,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

/**
 * Subscribe to messages in a chat (real-time updates)
 * Returns an unsubscribe function
 */
export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
  messageLimit: number = 50,
  onError?: (error: Error) => void
): Unsubscribe {
  const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, 'messages');
  const q = query(
    messagesRef,
    orderBy('timestamp', 'desc'),
    limit(messageLimit)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push(firestoreDocToMessage(doc.id, doc.data()));
      });

      // Return in chronological order (oldest first, but we sort in UI anyway)
      callback(messages.reverse());
    },
    (error) => {
      console.error('Error in messages subscription:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Load more messages (pagination)
 */
export async function loadMoreMessages(
  chatId: string,
  lastMessageTimestamp: Date,
  pageSize: number = 30
): Promise<{ messages: Message[]; hasMore: boolean }> {
  try {
    const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      startAfter(Timestamp.fromDate(lastMessageTimestamp)),
      limit(pageSize + 1)
    );

    const snapshot = await getDocs(q);
    const messages: Message[] = [];

    snapshot.forEach((doc) => {
      messages.push(firestoreDocToMessage(doc.id, doc.data()));
    });

    const hasMore = messages.length > pageSize;
    if (hasMore) {
      messages.pop(); // Remove the extra item used to check for more
    }

    return {
      messages: messages.reverse(),
      hasMore,
    };
  } catch (error) {
    console.error('Error loading more messages:', error);
    return {
      messages: [],
      hasMore: false,
    };
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  chatId: string,
  messageIds: string[],
  userId: string
): Promise<void> {
  try {
    const batch = [];

    for (const messageId of messageIds) {
      const messageRef = doc(db, COLLECTIONS.CHATS, chatId, 'messages', messageId);
      batch.push(
        updateDoc(messageRef, {
          readBy: [...new Set([userId])], // Add user to readBy array
          status: 'read',
        })
      );
    }

    await Promise.all(batch);
    console.log('✅ Messages marked as read:', messageIds.length);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

/**
 * Add reaction to a message
 */
export async function addReaction(
  chatId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  try {
    const messageRef = doc(db, COLLECTIONS.CHATS, chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: emoji,
    });
    console.log('✅ Reaction added');
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

/**
 * Remove reaction from a message
 */
export async function removeReaction(
  chatId: string,
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const messageRef = doc(db, COLLECTIONS.CHATS, chatId, 'messages', messageId);
    // To remove a field, we need to get the current reactions and filter out the user's
    // For simplicity, set it to null
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: null,
    });
    console.log('✅ Reaction removed');
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
}

/**
 * Delete message for user (soft delete)
 */
export async function deleteMessageForUser(
  chatId: string,
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const messageRef = doc(db, COLLECTIONS.CHATS, chatId, 'messages', messageId);
    // Use arrayUnion to add userId to deletedFor array
    const { arrayUnion } = await import('firebase/firestore');
    await updateDoc(messageRef, {
      deletedFor: arrayUnion(userId),
    });
    console.log('✅ Message deleted for user');
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Star/unstar a message
 */
export async function toggleMessageStar(
  chatId: string,
  messageId: string,
  isStarred: boolean
): Promise<void> {
  try {
    const messageRef = doc(db, COLLECTIONS.CHATS, chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      isStarred,
    });
    console.log('✅ Message star toggled');
  } catch (error) {
    console.error('Error toggling star:', error);
    throw error;
  }
}
