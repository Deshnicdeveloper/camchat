/**
 * Chat Store
 * Manages chats and messages state
 */

import { create } from 'zustand';
import type { Chat, Message, Contact } from '../types';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>; // keyed by chatId
  contacts: Contact[];
  isLoading: boolean;

  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;

  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;

  setContacts: (contacts: Contact[]) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  messages: {},
  contacts: [],
  isLoading: false,

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

  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: (chatId) =>
    set((state) => {
      const { [chatId]: _, ...rest } = state.messages;
      return { messages: rest };
    }),
}));

export default useChatStore;
