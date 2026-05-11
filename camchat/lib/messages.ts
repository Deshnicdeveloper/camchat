/**
 * Message Service
 * Handles message operations in Firestore
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  where,
  getDocs,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, getServerTimestamp } from './firestore';
import { updateChatLastMessage, incrementUnreadCount, resetUnreadCount } from './chat';
import type { Message, MessageType, MessageStatus, ReplyReference, LocationData } from '../types';

interface SendMessageParams {
  chatId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  audioDuration?: number;
  fileName?: string;
  fileSize?: number;
  location?: LocationData;
  replyTo?: ReplyReference;
  participants: string[];
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Convert Firestore document to Message type
 */
function firestoreToMessage(docId: string, data: Record<string, unknown>): Message {
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
    location: data.location as LocationData | undefined,
    replyTo: data.replyTo as ReplyReference | undefined,
    reactions: (data.reactions as Record<string, string>) || {},
    status: data.status as MessageStatus,
    readBy: (data.readBy as string[]) || [],
    deletedFor: (data.deletedFor as string[]) || [],
    isStarred: (data.isStarred as boolean) || false,
    timestamp:
      (data.timestamp as Timestamp)?.toDate?.() ||
      (data.timestamp as Date) ||
      new Date(),
  };
}

/**
 * Send a new message
 */
export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const {
    chatId,
    senderId,
    type,
    text,
    mediaUrl,
    mediaThumbnail,
    audioDuration,
    fileName,
    fileSize,
    location,
    replyTo,
    participants,
  } = params;

  try {
    const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, 'messages');

    // Create message document
    const messageData = {
      senderId,
      type,
      text: text || '',
      mediaUrl: mediaUrl || null,
      mediaThumbnail: mediaThumbnail || null,
      audioDuration: audioDuration || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      location: location || null,
      replyTo: replyTo || null,
      reactions: {},
      status: 'sent' as MessageStatus,
      readBy: [senderId], // Sender has read their own message
      deletedFor: [],
      isStarred: false,
      timestamp: getServerTimestamp(),
    };

    // Add message to subcollection
    const docRef = await addDoc(messagesRef, messageData);

    // Update chat's lastMessage
    const lastMessageText = type === 'text' ? (text || '') : type;
    await updateChatLastMessage(chatId, {
      text: lastMessageText,
      senderId,
      type,
    });

    // Increment unread count for other participants
    await incrementUnreadCount(chatId, senderId, participants);

    console.log('✅ Message sent:', docRef.id);
    return { success: true, messageId: docRef.id };
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

/**
 * Subscribe to messages in a chat (real-time)
 */
export function subscribeToMessages(
  chatId: string,
  currentUserId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];

      snapshot.forEach((doc) => {
        const message = firestoreToMessage(doc.id, doc.data());
        // Filter out messages deleted for this user
        if (!message.deletedFor.includes(currentUserId)) {
          messages.push(message);
        }
      });

      callback(messages);
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
 * Mark messages as read
 */
export async function markMessagesAsRead(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, 'messages');

    // Query unread messages (not sent by current user and not read by them)
    const q = query(
      messagesRef,
      where('senderId', '!=', userId),
      orderBy('senderId'),
      orderBy('timestamp', 'desc'),
      limit(100) // Batch limit
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const readBy = (data.readBy as string[]) || [];

      // Only update if user hasn't read it yet
      if (!readBy.includes(userId)) {
        const messageRef = doc(db, COLLECTIONS.CHATS, chatId, 'messages', docSnapshot.id);
        batch.update(messageRef, {
          readBy: [...readBy, userId],
          status: 'read',
        });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Marked ${updateCount} messages as read`);
    }

    // Reset unread count for this user
    await resetUnreadCount(chatId, userId);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  chatId: string,
  messageId: string,
  status: MessageStatus
): Promise<void> {
  try {
    const messageRef = doc(db, COLLECTIONS.CHATS, chatId, 'messages', messageId);
    await updateDoc(messageRef, { status });
  } catch (error) {
    console.error('Error updating message status:', error);
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
    console.log('✅ Reaction added:', emoji);
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
    // Use dot notation to delete the specific reaction
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
 * Toggle star on a message
 */
export async function toggleStarMessage(
  chatId: string,
  messageId: string,
  isStarred: boolean
): Promise<void> {
  try {
    const messageRef = doc(db, COLLECTIONS.CHATS, chatId, 'messages', messageId);
    await updateDoc(messageRef, { isStarred });
    console.log('✅ Message star toggled:', isStarred);
  } catch (error) {
    console.error('Error toggling message star:', error);
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
    // Get current deletedFor array and add user
    const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, 'messages');
    const q = query(messagesRef, where('__name__', '==', messageId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const currentDeletedFor = snapshot.docs[0].data().deletedFor || [];
      await updateDoc(messageRef, {
        deletedFor: [...currentDeletedFor, userId],
      });
      console.log('✅ Message deleted for user');
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Update typing indicator
 */
export async function updateTypingStatus(
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      [`isTyping.${userId}`]: isTyping,
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
}

/**
 * Subscribe to typing indicator changes
 */
export function subscribeToTypingIndicator(
  chatId: string,
  currentUserId: string,
  callback: (typingUsers: string[]) => void
): Unsubscribe {
  const chatRef = doc(db, COLLECTIONS.CHATS, chatId);

  return onSnapshot(chatRef, (snapshot) => {
    if (snapshot.exists()) {
      const isTyping = (snapshot.data().isTyping as Record<string, boolean>) || {};
      const typingUsers = Object.entries(isTyping)
        .filter(([id, typing]) => id !== currentUserId && typing)
        .map(([id]) => id);
      callback(typingUsers);
    }
  });
}
