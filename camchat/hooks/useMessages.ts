/**
 * useMessages Hook
 * Handles real-time messages, sending, and typing indicators
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import {
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  updateTypingStatus,
  subscribeToTypingIndicator,
  addReaction,
  removeReaction,
  toggleStarMessage,
  deleteMessageForUser,
} from '../lib/messages';
import type { Message, MessageType, ReplyReference, LocationData } from '../types';

interface UseMessagesParams {
  chatId: string;
  participants: string[];
}

interface UseMessagesReturn {
  // State
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  typingUsers: string[];
  error: string | null;

  // Actions
  send: (params: {
    type: MessageType;
    text?: string;
    mediaUrl?: string;
    mediaThumbnail?: string;
    audioDuration?: number;
    fileName?: string;
    fileSize?: number;
    location?: LocationData;
    replyTo?: ReplyReference;
  }) => Promise<boolean>;
  sendText: (text: string, replyTo?: ReplyReference) => Promise<boolean>;
  sendImage: (mediaUrl: string, caption?: string) => Promise<boolean>;
  sendVideo: (mediaUrl: string, thumbnailUrl?: string) => Promise<boolean>;
  sendVoice: (mediaUrl: string, duration: number) => Promise<boolean>;
  sendDocument: (mediaUrl: string, fileName: string, fileSize: number) => Promise<boolean>;
  sendLocation: (location: LocationData) => Promise<boolean>;
  setTyping: (isTyping: boolean) => void;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  removeReactionFromMessage: (messageId: string) => Promise<void>;
  toggleStar: (messageId: string, isStarred: boolean) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: () => Promise<void>;
}

export function useMessages({ chatId, participants }: UseMessagesParams): UseMessagesReturn {
  const { user } = useAuthStore();
  const { messages: storeMessages, setMessages, addMessage } = useChatStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeTypingRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingStateRef = useRef(false);

  const messages = storeMessages[chatId] || [];

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatId || !user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('📡 Subscribing to messages for chat:', chatId);

    // Unsubscribe from previous subscriptions
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current();
    }
    if (unsubscribeTypingRef.current) {
      unsubscribeTypingRef.current();
    }

    // Subscribe to messages
    unsubscribeMessagesRef.current = subscribeToMessages(
      chatId,
      user.uid,
      (updatedMessages) => {
        console.log('📨 Received messages update:', updatedMessages.length);
        setMessages(chatId, updatedMessages);
        setIsLoading(false);
      },
      (err) => {
        console.error('❌ Messages subscription error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Subscribe to typing indicator
    unsubscribeTypingRef.current = subscribeToTypingIndicator(
      chatId,
      user.uid,
      (users) => {
        setTypingUsers(users);
      }
    );

    // Cleanup on unmount or chatId change
    return () => {
      if (unsubscribeMessagesRef.current) {
        console.log('📴 Unsubscribing from messages');
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
        unsubscribeTypingRef.current = null;
      }
      // Clear typing status when leaving
      if (lastTypingStateRef.current && user?.uid) {
        updateTypingStatus(chatId, user.uid, false);
      }
    };
  }, [chatId, user?.uid, setMessages]);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (chatId && user?.uid && !isLoading && messages.length > 0) {
      markMessagesAsRead(chatId, user.uid);
    }
  }, [chatId, user?.uid, isLoading, messages.length]);

  /**
   * Send a message
   */
  const send = useCallback(
    async (params: {
      type: MessageType;
      text?: string;
      mediaUrl?: string;
      mediaThumbnail?: string;
      audioDuration?: number;
      fileName?: string;
      fileSize?: number;
      location?: LocationData;
      replyTo?: ReplyReference;
    }): Promise<boolean> => {
      if (!user?.uid) return false;

      setIsSending(true);

      // Clear typing indicator
      setTyping(false);

      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user.uid,
        type: params.type,
        text: params.text,
        mediaUrl: params.mediaUrl,
        mediaThumbnail: params.mediaThumbnail,
        audioDuration: params.audioDuration,
        fileName: params.fileName,
        fileSize: params.fileSize,
        location: params.location,
        replyTo: params.replyTo,
        reactions: {},
        status: 'sending',
        readBy: [user.uid],
        deletedFor: [],
        isStarred: false,
        timestamp: new Date(),
      };

      addMessage(chatId, optimisticMessage);

      try {
        const result = await sendMessage({
          chatId,
          senderId: user.uid,
          participants,
          ...params,
        });

        if (!result.success) {
          setError(result.error || 'Failed to send message');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [user?.uid, chatId, participants, addMessage]
  );

  /**
   * Send a text message
   */
  const sendText = useCallback(
    async (text: string, replyTo?: ReplyReference): Promise<boolean> => {
      return send({ type: 'text', text, replyTo });
    },
    [send]
  );

  /**
   * Send an image message
   */
  const sendImage = useCallback(
    async (mediaUrl: string, caption?: string): Promise<boolean> => {
      return send({ type: 'image', mediaUrl, text: caption });
    },
    [send]
  );

  /**
   * Send a video message
   */
  const sendVideo = useCallback(
    async (mediaUrl: string, thumbnailUrl?: string): Promise<boolean> => {
      return send({ type: 'video', mediaUrl, mediaThumbnail: thumbnailUrl });
    },
    [send]
  );

  /**
   * Send a voice message
   */
  const sendVoice = useCallback(
    async (mediaUrl: string, duration: number): Promise<boolean> => {
      return send({ type: 'audio', mediaUrl, audioDuration: duration });
    },
    [send]
  );

  /**
   * Send a document
   */
  const sendDocument = useCallback(
    async (mediaUrl: string, fileName: string, fileSize: number): Promise<boolean> => {
      return send({ type: 'document', mediaUrl, fileName, fileSize });
    },
    [send]
  );

  /**
   * Send a location
   */
  const sendLocation = useCallback(
    async (location: LocationData): Promise<boolean> => {
      return send({ type: 'location', location });
    },
    [send]
  );

  /**
   * Set typing indicator (debounced)
   */
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!user?.uid || !chatId) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Only update if state changed
      if (isTyping !== lastTypingStateRef.current) {
        lastTypingStateRef.current = isTyping;
        updateTypingStatus(chatId, user.uid, isTyping);
      }

      // Auto-clear typing after 3 seconds of no input
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          lastTypingStateRef.current = false;
          updateTypingStatus(chatId, user.uid, false);
        }, 3000);
      }
    },
    [chatId, user?.uid]
  );

  /**
   * Add reaction to a message
   */
  const reactToMessage = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!user?.uid) return;
      await addReaction(chatId, messageId, user.uid, emoji);
    },
    [chatId, user?.uid]
  );

  /**
   * Remove reaction from a message
   */
  const removeReactionFromMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!user?.uid) return;
      await removeReaction(chatId, messageId, user.uid);
    },
    [chatId, user?.uid]
  );

  /**
   * Toggle star on a message
   */
  const toggleStar = useCallback(
    async (messageId: string, isStarred: boolean): Promise<void> => {
      await toggleStarMessage(chatId, messageId, isStarred);
    },
    [chatId]
  );

  /**
   * Delete a message (for current user)
   */
  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!user?.uid) return;
      await deleteMessageForUser(chatId, messageId, user.uid);
    },
    [chatId, user?.uid]
  );

  /**
   * Manually mark messages as read
   */
  const markAsRead = useCallback(async (): Promise<void> => {
    if (!user?.uid) return;
    await markMessagesAsRead(chatId, user.uid);
  }, [chatId, user?.uid]);

  return {
    messages,
    isLoading,
    isSending,
    typingUsers,
    error,
    send,
    sendText,
    sendImage,
    sendVideo,
    sendVoice,
    sendDocument,
    sendLocation,
    setTyping,
    reactToMessage,
    removeReactionFromMessage,
    toggleStar,
    deleteMessage,
    markAsRead,
  };
}

export default useMessages;
