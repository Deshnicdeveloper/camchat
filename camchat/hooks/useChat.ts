/**
 * useChat Hook
 * Handles chat operations and real-time chat list updates
 */

import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
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

// Helper to compare chat arrays (ignoring typing indicator changes)
function chatListChanged(prev: Chat[], next: Chat[]): boolean {
  if (prev.length !== next.length) return true;

  for (let i = 0; i < prev.length; i++) {
    const p = prev[i];
    const n = next[i];

    // Compare important fields, ignoring isTyping
    if (
      p.id !== n.id ||
      p.lastMessage?.text !== n.lastMessage?.text ||
      p.lastMessage?.timestamp?.getTime() !== n.lastMessage?.timestamp?.getTime() ||
      JSON.stringify(p.unreadCount) !== JSON.stringify(n.unreadCount) ||
      JSON.stringify(p.participants) !== JSON.stringify(n.participants)
    ) {
      return true;
    }
  }

  return false;
}

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
    setParticipants: persistParticipants,
  } = useChatStore();

  const [participants, setParticipants] = useState<Map<string, UserProfile>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastChatsRef = useRef<Chat[]>([]);
  const fetchedParticipantIdsRef = useRef<Set<string>>(new Set());

  // Seed the participant cache from the persisted store on mount so chat
  // headers render instantly and we don't re-fetch profiles we already have
  // (survives remounts and app restarts).
  useEffect(() => {
    const stored = useChatStore.getState().participants;
    const ids = Object.keys(stored);
    if (ids.length === 0) return;
    setParticipants((prev) => {
      const map = new Map(prev);
      for (const id of ids) {
        if (!map.has(id)) map.set(id, stored[id]);
        fetchedParticipantIdsRef.current.add(id);
      }
      return map;
    });
  }, []);

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
        // Filter out chats that are deleted for this user
        const filteredChats = updatedChats.filter(
          (chat) => !(chat as Chat & { deletedFor?: string[] }).deletedFor?.includes(user.uid)
        );

        // Only update state and log if chat list actually changed (ignore typing indicator updates)
        if (chatListChanged(lastChatsRef.current, filteredChats)) {
          console.log('📨 Received chat update:', filteredChats.length, 'chats');
          lastChatsRef.current = filteredChats;
          setChats(filteredChats);

          // Only fetch participants for new chats or if we haven't fetched yet
          fetchParticipantsIfNeeded(filteredChats);
        }

        setLoading(false);
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
   * Fetch participant data only for new participants we haven't fetched yet
   */
  const fetchParticipantsIfNeeded = useCallback(
    async (chatList: Chat[]) => {
      if (!user?.uid) return;

      // Collect participant IDs we haven't fetched yet
      const newParticipantIds: string[] = [];
      for (const chat of chatList) {
        for (const participantId of chat.participants) {
          if (
            participantId !== user.uid &&
            !fetchedParticipantIdsRef.current.has(participantId)
          ) {
            newParticipantIds.push(participantId);
            fetchedParticipantIdsRef.current.add(participantId);
          }
        }
      }

      if (newParticipantIds.length === 0) return;

      console.log('📡 Fetching new participants:', newParticipantIds.length);

      try {
        const users = await getUsersByIds(newParticipantIds);

        setParticipants((prev) => {
          const newMap = new Map(prev);
          for (const u of users) {
            newMap.set(u.uid, {
              uid: u.uid,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
              about: u.about,
              isOnline: u.isOnline,
              lastSeen: u.lastSeen,
            });
          }
          return newMap;
        });

        // Persist to the store so these profiles are available instantly on the
        // next mount / app launch (no network needed to render the header).
        const merged = { ...useChatStore.getState().participants };
        for (const u of users) {
          merged[u.uid] = {
            uid: u.uid,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            about: u.about,
            isOnline: u.isOnline,
            lastSeen: u.lastSeen,
          };
        }
        persistParticipants(merged);
      } catch (err) {
        console.error('Error fetching participants:', err);
        // Remove from fetched set so we can retry
        for (const id of newParticipantIds) {
          fetchedParticipantIdsRef.current.delete(id);
        }
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
      return (
        participants.get(participantId) ||
        useChatStore.getState().participants[participantId]
      );
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
