/**
 * useChat Hook
 * Handles chat operations and real-time chat list updates
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import {
  subscribeToChats,
  getOrCreateDirectChat,
  getChatById,
  resetUnreadCount,
  archiveChat,
  muteChat,
  deleteChatForUser,
  createGroupChat,
  leaveGroup,
} from '../lib/chat';
import { getUsersByIds } from '../lib/contacts';
import type { Chat, User, UserProfile } from '../types';

interface UseChatReturn {
  // State
  chats: Chat[];
  participants: Map<string, UserProfile>;
  isLoading: boolean;
  error: string | null;

  // Actions
  startChat: (otherUserId: string) => Promise<{ success: boolean; chatId?: string; error?: string }>;
  startGroupChat: (
    groupName: string,
    participantIds: string[],
    groupDescription?: string,
    groupAvatarUrl?: string
  ) => Promise<{ success: boolean; chatId?: string; error?: string }>;
  openChat: (chatId: string) => Promise<void>;
  archiveChat: (chatId: string) => Promise<void>;
  muteChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  leaveGroupChat: (chatId: string) => Promise<{ success: boolean; error?: string }>;
  getParticipant: (participantId: string) => UserProfile | undefined;
  getChatParticipant: (chat: Chat) => UserProfile | undefined;
}

export function useChat(): UseChatReturn {
  const { user } = useAuthStore();
  const {
    chats,
    setChats,
    removeChat,
    isLoading,
    setLoading,
  } = useChatStore();

  const [participants, setParticipants] = useState<Map<string, UserProfile>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!user?.uid) {
      setChats([]);
      return;
    }

    setLoading(true);
    setError(null);

    console.log('📡 Subscribing to chats for user:', user.uid);

    // Unsubscribe from previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to chats
    unsubscribeRef.current = subscribeToChats(
      user.uid,
      (updatedChats) => {
        console.log('📨 Received chat update:', updatedChats.length, 'chats');

        // Filter out chats that are deleted for this user
        const filteredChats = updatedChats.filter(
          (chat) => !(chat as Chat & { deletedFor?: string[] }).deletedFor?.includes(user.uid)
        );

        setChats(filteredChats);
        setLoading(false);

        // Fetch participant data for all chats
        fetchParticipants(filteredChats);
      },
      (err) => {
        console.error('❌ Chat subscription error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('📴 Unsubscribing from chats');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.uid, setChats, setLoading]);

  /**
   * Fetch participant data for all chats
   */
  const fetchParticipants = useCallback(
    async (chatList: Chat[]) => {
      if (!user?.uid) return;

      // Collect all unique participant IDs (excluding current user)
      const participantIds = new Set<string>();
      for (const chat of chatList) {
        for (const participantId of chat.participants) {
          if (participantId !== user.uid) {
            participantIds.add(participantId);
          }
        }
      }

      if (participantIds.size === 0) return;

      try {
        const users = await getUsersByIds(Array.from(participantIds));
        const participantMap = new Map<string, UserProfile>();

        for (const u of users) {
          participantMap.set(u.uid, {
            uid: u.uid,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            about: u.about,
            isOnline: u.isOnline,
            lastSeen: u.lastSeen,
          });
        }

        setParticipants(participantMap);
      } catch (err) {
        console.error('Error fetching participants:', err);
      }
    },
    [user?.uid]
  );

  /**
   * Start a new chat with another user
   */
  const startChat = useCallback(
    async (otherUserId: string): Promise<{ success: boolean; chatId?: string; error?: string }> => {
      if (!user?.uid) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const result = await getOrCreateDirectChat(user.uid, otherUserId);
        return result;
      } catch (err) {
        console.error('Error starting chat:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to start chat',
        };
      }
    },
    [user?.uid]
  );

  /**
   * Start a new group chat
   */
  const startGroupChat = useCallback(
    async (
      groupName: string,
      participantIds: string[],
      groupDescription?: string,
      groupAvatarUrl?: string
    ): Promise<{ success: boolean; chatId?: string; error?: string }> => {
      if (!user?.uid) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const result = await createGroupChat(
          user.uid,
          groupName,
          participantIds,
          groupDescription,
          groupAvatarUrl
        );
        return result;
      } catch (err) {
        console.error('Error starting group chat:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to create group chat',
        };
      }
    },
    [user?.uid]
  );

  /**
   * Leave a group chat
   */
  const handleLeaveGroup = useCallback(
    async (chatId: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.uid) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const result = await leaveGroup(chatId, user.uid);
        if (result.success) {
          removeChat(chatId);
        }
        return result;
      } catch (err) {
        console.error('Error leaving group:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to leave group',
        };
      }
    },
    [user?.uid, removeChat]
  );

  /**
   * Open an existing chat and reset unread count
   */
  const openChat = useCallback(
    async (chatId: string): Promise<void> => {
      if (!user?.uid) return;

      try {
        // Reset unread count for this user
        await resetUnreadCount(chatId, user.uid);
      } catch (err) {
        console.error('Error opening chat:', err);
      }
    },
    [user?.uid]
  );

  /**
   * Archive a chat
   */
  const handleArchiveChat = useCallback(
    async (chatId: string): Promise<void> => {
      if (!user?.uid) return;

      try {
        await archiveChat(chatId, user.uid);
        // Optionally remove from local state
        // removeChat(chatId);
      } catch (err) {
        console.error('Error archiving chat:', err);
      }
    },
    [user?.uid]
  );

  /**
   * Mute a chat
   */
  const handleMuteChat = useCallback(
    async (chatId: string): Promise<void> => {
      if (!user?.uid) return;

      try {
        await muteChat(chatId, user.uid);
      } catch (err) {
        console.error('Error muting chat:', err);
      }
    },
    [user?.uid]
  );

  /**
   * Delete a chat
   */
  const handleDeleteChat = useCallback(
    async (chatId: string): Promise<void> => {
      if (!user?.uid) return;

      try {
        await deleteChatForUser(chatId, user.uid);
        // Remove from local state immediately
        removeChat(chatId);
      } catch (err) {
        console.error('Error deleting chat:', err);
      }
    },
    [user?.uid, removeChat]
  );

  /**
   * Get participant profile by ID
   */
  const getParticipant = useCallback(
    (participantId: string): UserProfile | undefined => {
      return participants.get(participantId);
    },
    [participants]
  );

  /**
   * Get the other participant in a direct chat
   */
  const getChatParticipant = useCallback(
    (chat: Chat): UserProfile | undefined => {
      if (!user?.uid) return undefined;

      if (chat.type === 'group') {
        // For groups, return a placeholder
        return {
          uid: chat.id,
          displayName: chat.groupName || 'Group',
          avatarUrl: chat.groupAvatarUrl || '',
          about: chat.groupDescription || '',
          isOnline: false,
          lastSeen: new Date(),
        };
      }

      // For direct chats, find the other participant
      const otherParticipantId = chat.participants.find((p) => p !== user.uid);
      if (otherParticipantId) {
        return participants.get(otherParticipantId);
      }

      return undefined;
    },
    [user?.uid, participants]
  );

  return {
    chats,
    participants,
    isLoading,
    error,
    startChat,
    startGroupChat,
    openChat,
    archiveChat: handleArchiveChat,
    muteChat: handleMuteChat,
    deleteChat: handleDeleteChat,
    leaveGroupChat: handleLeaveGroup,
    getParticipant,
    getChatParticipant,
  };
}

export default useChat;
