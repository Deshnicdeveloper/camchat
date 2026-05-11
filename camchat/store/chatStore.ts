/**
 * Chat Store
 * Manages chats and messages state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Chat, Message, Contact, UserProfile } from '../types';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>; // keyed by chatId
  contacts: Contact[];
  participants: Record<string, UserProfile>; // keyed by participantId for quick lookup
  isLoading: boolean;
  lastSyncTime: number | null; // Contact sync timestamp

  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;

  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;

  setContacts: (contacts: Contact[]) => void;
  setParticipants: (participants: Record<string, UserProfile>) => void;
  updateParticipant: (participantId: string, updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setLastSyncTime: (time: number) => void;
  clearMessages: (chatId: string) => void;
  reset: () => void;
}

const initialState = {
  chats: [],
  messages: {},
  contacts: [],
  participants: {},
  isLoading: false,
  lastSyncTime: null,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      ...initialState,

      setChats: (chats) => set({ chats }),

      addChat: (chat) =>
        set((state) => ({
          chats: [chat, ...state.chats],
        })),

      updateChat: (chatId, updates) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, ...updates } : chat
          ),
        })),

      removeChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
        })),

      setMessages: (chatId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [chatId]: messages },
        })),

      addMessage: (chatId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
        })),

      updateMessage: (chatId, messageId, updates) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          },
        })),

      setContacts: (contacts) => set({ contacts }),

      setParticipants: (participants) => set({ participants }),

      updateParticipant: (participantId, updates) =>
        set((state) => ({
          participants: {
            ...state.participants,
            [participantId]: {
              ...state.participants[participantId],
              ...updates,
            },
          },
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),

      clearMessages: (chatId) =>
        set((state) => {
          const { [chatId]: _, ...rest } = state.messages;
          return { messages: rest };
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'camchat-chats',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        contacts: state.contacts,
        participants: state.participants,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

export default useChatStore;
