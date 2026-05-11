/**
 * Chat Service
 * Handles chat-related Firestore operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, getServerTimestamp } from './firestore';
import type { Chat, LastMessage, User, MessageType } from '../types';

interface CreateChatResult {
  success: boolean;
  chatId?: string;
  chat?: Chat;
  error?: string;
}

interface GetChatResult {
  success: boolean;
  chat?: Chat;
  error?: string;
}

/**
 * Generate a unique chat ID for direct chats
 * Ensures the same ID regardless of user order
 */
export function generateDirectChatId(userId1: string, userId2: string): string {
  // Sort user IDs to ensure consistent chat ID
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
}

/**
 * Check if a direct chat exists between two users
 */
export async function getExistingDirectChat(
  currentUserId: string,
  otherUserId: string
): Promise<Chat | null> {
  try {
    const chatId = generateDirectChatId(currentUserId, otherUserId);
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      return {
        id: chatSnap.id,
        ...chatData,
        createdAt: chatData.createdAt?.toDate?.() || new Date(),
        lastMessage: chatData.lastMessage
          ? {
              ...chatData.lastMessage,
              timestamp: chatData.lastMessage.timestamp?.toDate?.() || new Date(),
            }
          : {
              text: '',
              senderId: '',
              type: 'text' as MessageType,
              timestamp: new Date(),
            },
      } as Chat;
    }

    return null;
  } catch (error) {
    console.error('Error checking existing chat:', error);
    return null;
  }
}

/**
 * Create a new direct chat
 */
export async function createDirectChat(
  currentUserId: string,
  otherUserId: string
): Promise<CreateChatResult> {
  try {
    const chatId = generateDirectChatId(currentUserId, otherUserId);

    // Check if chat already exists
    const existingChat = await getExistingDirectChat(currentUserId, otherUserId);
    if (existingChat) {
      return {
        success: true,
        chatId: existingChat.id,
        chat: existingChat,
      };
    }

    // Create new chat document
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const newChat = {
      type: 'direct' as const,
      participants: [currentUserId, otherUserId],
      createdBy: currentUserId,
      createdAt: getServerTimestamp(),
      lastMessage: {
        text: '',
        senderId: '',
        type: 'text' as MessageType,
        timestamp: getServerTimestamp(),
      },
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
    };

    await setDoc(chatRef, newChat);

    console.log('✅ Created new direct chat:', chatId);

    return {
      success: true,
      chatId,
      chat: {
        id: chatId,
        ...newChat,
        createdAt: new Date(),
        lastMessage: {
          text: '',
          senderId: '',
          type: 'text' as MessageType,
          timestamp: new Date(),
        },
      } as Chat,
    };
  } catch (error) {
    console.error('Error creating direct chat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chat',
    };
  }
}

/**
 * Get or create a direct chat
 * Used when starting a new conversation from contacts
 */
export async function getOrCreateDirectChat(
  currentUserId: string,
  otherUserId: string
): Promise<CreateChatResult> {
  try {
    // First check if chat exists
    const existingChat = await getExistingDirectChat(currentUserId, otherUserId);
    if (existingChat) {
      return {
        success: true,
        chatId: existingChat.id,
        chat: existingChat,
      };
    }

    // Create new chat
    return createDirectChat(currentUserId, otherUserId);
  } catch (error) {
    console.error('Error in getOrCreateDirectChat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get or create chat',
    };
  }
}

/**
 * Get a chat by ID
 */
export async function getChatById(chatId: string): Promise<GetChatResult> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return {
        success: false,
        error: 'Chat not found',
      };
    }

    const chatData = chatSnap.data();
    const chat: Chat = {
      id: chatSnap.id,
      ...chatData,
      createdAt: chatData.createdAt?.toDate?.() || new Date(),
      lastMessage: chatData.lastMessage
        ? {
            ...chatData.lastMessage,
            timestamp: chatData.lastMessage.timestamp?.toDate?.() || new Date(),
          }
        : {
            text: '',
            senderId: '',
            type: 'text' as MessageType,
            timestamp: new Date(),
          },
    } as Chat;

    return {
      success: true,
      chat,
    };
  } catch (error) {
    console.error('Error getting chat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chat',
    };
  }
}

/**
 * Convert Firestore chat document to Chat type
 */
function firestoreChatToChat(
  docId: string,
  data: Record<string, unknown>
): Chat {
  return {
    id: docId,
    type: data.type as 'direct' | 'group',
    participants: data.participants as string[],
    createdBy: data.createdBy as string,
    createdAt:
      (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    lastMessage: data.lastMessage
      ? {
          text: (data.lastMessage as Record<string, unknown>).text as string,
          senderId: (data.lastMessage as Record<string, unknown>).senderId as string,
          type: (data.lastMessage as Record<string, unknown>).type as MessageType,
          timestamp:
            ((data.lastMessage as Record<string, unknown>).timestamp as { toDate?: () => Date })?.toDate?.() ||
            new Date(),
        }
      : {
          text: '',
          senderId: '',
          type: 'text' as MessageType,
          timestamp: new Date(),
        },
    unreadCount: (data.unreadCount as Record<string, number>) || {},
    groupName: data.groupName as string | undefined,
    groupAvatarUrl: data.groupAvatarUrl as string | undefined,
    groupDescription: data.groupDescription as string | undefined,
  };
}

/**
 * Subscribe to user's chats (real-time updates)
 * Returns an unsubscribe function
 */
export function subscribeToChats(
  userId: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const chatsRef = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessage.timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats: Chat[] = [];
      snapshot.forEach((doc) => {
        chats.push(firestoreChatToChat(doc.id, doc.data()));
      });
      callback(chats);
    },
    (error) => {
      console.error('Error in chat subscription:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Update last message in a chat
 */
export async function updateChatLastMessage(
  chatId: string,
  lastMessage: Omit<LastMessage, 'timestamp'> & { timestamp?: ReturnType<typeof getServerTimestamp> }
): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      lastMessage: {
        ...lastMessage,
        timestamp: getServerTimestamp(),
      },
    });
  } catch (error) {
    console.error('Error updating last message:', error);
    throw error;
  }
}

/**
 * Reset unread count for a user in a chat
 */
export async function resetUnreadCount(chatId: string, userId: string): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.error('Error resetting unread count:', error);
    throw error;
  }
}

/**
 * Increment unread count for other participants
 */
export async function incrementUnreadCount(
  chatId: string,
  senderId: string,
  participants: string[]
): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const updates: Record<string, number> = {};

    for (const participantId of participants) {
      if (participantId !== senderId) {
        // Use dot notation to increment specific user's unread count
        updates[`unreadCount.${participantId}`] = 1; // Will be incremented properly with Firestore increment
      }
    }

    // For now, we'll fetch and update (increment requires different approach)
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const currentUnreadCount = chatSnap.data().unreadCount || {};
      for (const participantId of participants) {
        if (participantId !== senderId) {
          currentUnreadCount[participantId] = (currentUnreadCount[participantId] || 0) + 1;
        }
      }
      await updateDoc(chatRef, { unreadCount: currentUnreadCount });
    }
  } catch (error) {
    console.error('Error incrementing unread count:', error);
    throw error;
  }
}

/**
 * Archive a chat (soft delete by adding user to archivedBy array)
 */
export async function archiveChat(chatId: string, userId: string): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      archivedBy: arrayUnion(userId),
    });
    console.log('📦 Chat archived:', chatId);
  } catch (error) {
    console.error('Error archiving chat:', error);
    throw error;
  }
}

/**
 * Mute a chat for a user
 */
export async function muteChat(chatId: string, userId: string): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      mutedBy: arrayUnion(userId),
    });
    console.log('🔇 Chat muted:', chatId);
  } catch (error) {
    console.error('Error muting chat:', error);
    throw error;
  }
}

/**
 * Delete a chat for a user (soft delete)
 */
export async function deleteChatForUser(chatId: string, userId: string): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      deletedFor: arrayUnion(userId),
    });
    console.log('🗑️ Chat deleted for user:', chatId);
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
}
