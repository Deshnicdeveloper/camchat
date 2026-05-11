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
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, getServerTimestamp } from './firestore';
import type { Chat, LastMessage, User, MessageType, UserProfile } from '../types';

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
    admins: data.admins as string[] | undefined,
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

// ============================================================
// GROUP CHAT FUNCTIONS
// ============================================================

interface CreateGroupChatResult {
  success: boolean;
  chatId?: string;
  chat?: Chat;
  error?: string;
}

interface UpdateGroupResult {
  success: boolean;
  error?: string;
}

/**
 * Generate a unique group chat ID
 */
export function generateGroupChatId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `group_${timestamp}_${randomStr}`;
}

/**
 * Create a new group chat
 */
export async function createGroupChat(
  creatorId: string,
  groupName: string,
  participantIds: string[],
  groupDescription?: string,
  groupAvatarUrl?: string
): Promise<CreateGroupChatResult> {
  try {
    // Validate inputs
    if (!groupName.trim()) {
      return {
        success: false,
        error: 'Group name is required',
      };
    }

    if (participantIds.length < 1) {
      return {
        success: false,
        error: 'At least one participant is required',
      };
    }

    if (participantIds.length > 256) {
      return {
        success: false,
        error: 'Maximum 256 participants allowed',
      };
    }

    // Ensure creator is included in participants
    const allParticipants = Array.from(new Set([creatorId, ...participantIds]));

    const chatId = generateGroupChatId();
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);

    // Initialize unread counts for all participants
    const unreadCount: Record<string, number> = {};
    allParticipants.forEach((participantId) => {
      unreadCount[participantId] = 0;
    });

    const newGroupChat = {
      type: 'group' as const,
      participants: allParticipants,
      createdBy: creatorId,
      createdAt: getServerTimestamp(),
      lastMessage: {
        text: '',
        senderId: '',
        type: 'text' as MessageType,
        timestamp: getServerTimestamp(),
      },
      unreadCount,
      groupName: groupName.trim(),
      groupDescription: groupDescription?.trim() || '',
      groupAvatarUrl: groupAvatarUrl || '',
      admins: [creatorId], // Creator is the initial admin
    };

    await setDoc(chatRef, newGroupChat);

    console.log('✅ Created new group chat:', chatId, 'with', allParticipants.length, 'participants');

    return {
      success: true,
      chatId,
      chat: {
        id: chatId,
        ...newGroupChat,
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
    console.error('Error creating group chat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create group chat',
    };
  }
}

/**
 * Update group info (name, description, avatar)
 * Only admins can update group info
 */
export async function updateGroupInfo(
  chatId: string,
  userId: string,
  updates: {
    groupName?: string;
    groupDescription?: string;
    groupAvatarUrl?: string;
  }
): Promise<UpdateGroupResult> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    const chatData = chatSnap.data();

    // Verify the chat is a group
    if (chatData.type !== 'group') {
      return {
        success: false,
        error: 'This is not a group chat',
      };
    }

    // Check if user is an admin
    const admins = chatData.admins || [chatData.createdBy];
    if (!admins.includes(userId)) {
      return {
        success: false,
        error: 'Only admins can update group info',
      };
    }

    // Build update object
    const updateObj: Record<string, string> = {};
    if (updates.groupName !== undefined) {
      if (!updates.groupName.trim()) {
        return {
          success: false,
          error: 'Group name cannot be empty',
        };
      }
      updateObj.groupName = updates.groupName.trim();
    }
    if (updates.groupDescription !== undefined) {
      updateObj.groupDescription = updates.groupDescription.trim();
    }
    if (updates.groupAvatarUrl !== undefined) {
      updateObj.groupAvatarUrl = updates.groupAvatarUrl;
    }

    await updateDoc(chatRef, updateObj);

    console.log('✅ Updated group info:', chatId);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error updating group info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update group info',
    };
  }
}

/**
 * Add participants to a group chat
 * Only admins can add participants
 */
export async function addParticipantsToGroup(
  chatId: string,
  userId: string,
  newParticipantIds: string[]
): Promise<UpdateGroupResult> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    const chatData = chatSnap.data();

    // Verify the chat is a group
    if (chatData.type !== 'group') {
      return {
        success: false,
        error: 'This is not a group chat',
      };
    }

    // Check if user is an admin
    const admins = chatData.admins || [chatData.createdBy];
    if (!admins.includes(userId)) {
      return {
        success: false,
        error: 'Only admins can add participants',
      };
    }

    // Check participant limit
    const currentParticipants = chatData.participants || [];
    const uniqueNewParticipants = newParticipantIds.filter(
      (id) => !currentParticipants.includes(id)
    );

    if (currentParticipants.length + uniqueNewParticipants.length > 256) {
      return {
        success: false,
        error: 'Maximum 256 participants allowed',
      };
    }

    // Add participants and initialize their unread counts
    const currentUnreadCount = chatData.unreadCount || {};
    uniqueNewParticipants.forEach((participantId) => {
      currentUnreadCount[participantId] = 0;
    });

    await updateDoc(chatRef, {
      participants: arrayUnion(...uniqueNewParticipants),
      unreadCount: currentUnreadCount,
    });

    console.log('✅ Added', uniqueNewParticipants.length, 'participants to group:', chatId);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error adding participants to group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add participants',
    };
  }
}

/**
 * Remove a participant from a group chat
 * Only admins can remove participants (except the creator)
 */
export async function removeParticipantFromGroup(
  chatId: string,
  adminUserId: string,
  participantToRemove: string
): Promise<UpdateGroupResult> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    const chatData = chatSnap.data();

    // Verify the chat is a group
    if (chatData.type !== 'group') {
      return {
        success: false,
        error: 'This is not a group chat',
      };
    }

    // Check if user is an admin
    const admins = chatData.admins || [chatData.createdBy];
    if (!admins.includes(adminUserId)) {
      return {
        success: false,
        error: 'Only admins can remove participants',
      };
    }

    // Cannot remove the creator
    if (participantToRemove === chatData.createdBy) {
      return {
        success: false,
        error: 'Cannot remove the group creator',
      };
    }

    // Remove participant and their unread count
    const currentUnreadCount = chatData.unreadCount || {};
    delete currentUnreadCount[participantToRemove];

    // Also remove from admins if they were an admin
    const updatedAdmins = admins.filter((id: string) => id !== participantToRemove);

    await updateDoc(chatRef, {
      participants: arrayRemove(participantToRemove),
      unreadCount: currentUnreadCount,
      admins: updatedAdmins,
    });

    console.log('✅ Removed participant from group:', chatId);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error removing participant from group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove participant',
    };
  }
}

/**
 * Leave a group chat (self-removal)
 */
export async function leaveGroup(
  chatId: string,
  userId: string
): Promise<UpdateGroupResult> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    const chatData = chatSnap.data();

    // Verify the chat is a group
    if (chatData.type !== 'group') {
      return {
        success: false,
        error: 'This is not a group chat',
      };
    }

    // Check if user is the only admin/creator
    const admins = chatData.admins || [chatData.createdBy];
    const participants = chatData.participants || [];

    if (userId === chatData.createdBy && participants.length > 1) {
      // If creator is leaving and there are other participants,
      // transfer creator role to next admin, or first participant
      const newCreator = admins.find((id: string) => id !== userId) ||
                         participants.find((id: string) => id !== userId);

      if (newCreator) {
        const updatedAdmins = admins.filter((id: string) => id !== userId);
        if (!updatedAdmins.includes(newCreator)) {
          updatedAdmins.push(newCreator);
        }

        const currentUnreadCount = chatData.unreadCount || {};
        delete currentUnreadCount[userId];

        await updateDoc(chatRef, {
          participants: arrayRemove(userId),
          admins: updatedAdmins,
          createdBy: newCreator,
          unreadCount: currentUnreadCount,
        });
      }
    } else if (participants.length === 1 && participants[0] === userId) {
      // Last person leaving - delete the group
      await deleteDoc(chatRef);
      console.log('🗑️ Deleted empty group:', chatId);
      return { success: true };
    } else {
      // Regular leave
      const currentUnreadCount = chatData.unreadCount || {};
      delete currentUnreadCount[userId];

      const updatedAdmins = admins.filter((id: string) => id !== userId);

      await updateDoc(chatRef, {
        participants: arrayRemove(userId),
        admins: updatedAdmins,
        unreadCount: currentUnreadCount,
      });
    }

    console.log('✅ User left group:', chatId);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error leaving group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to leave group',
    };
  }
}

/**
 * Make a participant an admin
 */
export async function makeParticipantAdmin(
  chatId: string,
  adminUserId: string,
  participantId: string
): Promise<UpdateGroupResult> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    const chatData = chatSnap.data();

    // Verify the chat is a group
    if (chatData.type !== 'group') {
      return {
        success: false,
        error: 'This is not a group chat',
      };
    }

    // Check if current user is an admin
    const admins = chatData.admins || [chatData.createdBy];
    if (!admins.includes(adminUserId)) {
      return {
        success: false,
        error: 'Only admins can make others admin',
      };
    }

    // Check if participant is in the group
    const participants = chatData.participants || [];
    if (!participants.includes(participantId)) {
      return {
        success: false,
        error: 'User is not a participant of this group',
      };
    }

    // Check if already an admin
    if (admins.includes(participantId)) {
      return {
        success: true, // Already admin, no action needed
      };
    }

    await updateDoc(chatRef, {
      admins: arrayUnion(participantId),
    });

    console.log('✅ Made participant admin:', participantId, 'in group:', chatId);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error making participant admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to make participant admin',
    };
  }
}

/**
 * Remove admin status from a participant
 */
export async function removeAdminStatus(
  chatId: string,
  adminUserId: string,
  participantId: string
): Promise<UpdateGroupResult> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    const chatData = chatSnap.data();

    // Verify the chat is a group
    if (chatData.type !== 'group') {
      return {
        success: false,
        error: 'This is not a group chat',
      };
    }

    // Check if current user is an admin
    const admins = chatData.admins || [chatData.createdBy];
    if (!admins.includes(adminUserId)) {
      return {
        success: false,
        error: 'Only admins can remove admin status',
      };
    }

    // Cannot remove admin status from the creator
    if (participantId === chatData.createdBy) {
      return {
        success: false,
        error: 'Cannot remove admin status from the group creator',
      };
    }

    await updateDoc(chatRef, {
      admins: arrayRemove(participantId),
    });

    console.log('✅ Removed admin status from:', participantId, 'in group:', chatId);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error removing admin status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove admin status',
    };
  }
}

/**
 * Check if a user is an admin of a group
 */
export async function isUserAdmin(
  chatId: string,
  userId: string
): Promise<boolean> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return false;
    }

    const chatData = chatSnap.data();
    const admins = chatData.admins || [chatData.createdBy];

    return admins.includes(userId);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get group admins list
 */
export async function getGroupAdmins(chatId: string): Promise<string[]> {
  try {
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return [];
    }

    const chatData = chatSnap.data();
    return chatData.admins || [chatData.createdBy];
  } catch (error) {
    console.error('Error getting group admins:', error);
    return [];
  }
}
