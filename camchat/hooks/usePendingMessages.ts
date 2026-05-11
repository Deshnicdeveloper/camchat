/**
 * usePendingMessages Hook
 * Manages pending/uploading messages with optimistic UI
 * Shows messages immediately with upload progress
 */

import { useState, useCallback } from 'react';
import type { Message, MessageType, LocationData } from '../types';

export interface PendingMessage {
  id: string; // Temporary ID
  type: MessageType;
  localUri?: string; // Local file URI for preview
  text?: string;
  fileName?: string;
  fileSize?: number;
  location?: LocationData;
  audioDuration?: number;
  // Upload state
  status: 'uploading' | 'sending' | 'failed';
  progress: number; // 0-100
  error?: string;
  createdAt: Date;
}

interface UsePendingMessagesReturn {
  pendingMessages: PendingMessage[];
  addPending: (message: Omit<PendingMessage, 'id' | 'status' | 'progress' | 'createdAt'>) => string;
  updateProgress: (id: string, progress: number) => void;
  markAsSending: (id: string) => void;
  markAsFailed: (id: string, error: string) => void;
  removePending: (id: string) => void;
  retryPending: (id: string) => PendingMessage | null;
  clearFailed: () => void;
}

// Generate a temporary ID
function generateTempId(): string {
  return `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function usePendingMessages(): UsePendingMessagesReturn {
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  /**
   * Add a new pending message
   */
  const addPending = useCallback(
    (message: Omit<PendingMessage, 'id' | 'status' | 'progress' | 'createdAt'>): string => {
      const id = generateTempId();
      const pending: PendingMessage = {
        ...message,
        id,
        status: 'uploading',
        progress: 0,
        createdAt: new Date(),
      };

      setPendingMessages((prev) => [...prev, pending]);
      console.log('📤 Added pending message:', id, message.type);
      return id;
    },
    []
  );

  /**
   * Update upload progress
   */
  const updateProgress = useCallback((id: string, progress: number) => {
    setPendingMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, progress: Math.min(100, Math.max(0, progress)) } : msg
      )
    );
  }, []);

  /**
   * Mark as sending (upload complete, now sending to Firestore)
   */
  const markAsSending = useCallback((id: string) => {
    setPendingMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, status: 'sending', progress: 100 } : msg
      )
    );
  }, []);

  /**
   * Mark as failed
   */
  const markAsFailed = useCallback((id: string, error: string) => {
    setPendingMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, status: 'failed', error } : msg
      )
    );
  }, []);

  /**
   * Remove a pending message (called when successfully sent)
   */
  const removePending = useCallback((id: string) => {
    setPendingMessages((prev) => prev.filter((msg) => msg.id !== id));
    console.log('✅ Removed pending message:', id);
  }, []);

  /**
   * Retry a failed message
   */
  const retryPending = useCallback((id: string): PendingMessage | null => {
    const message = pendingMessages.find((msg) => msg.id === id);
    if (message && message.status === 'failed') {
      setPendingMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, status: 'uploading', progress: 0, error: undefined } : msg
        )
      );
      return message;
    }
    return null;
  }, [pendingMessages]);

  /**
   * Clear all failed messages
   */
  const clearFailed = useCallback(() => {
    setPendingMessages((prev) => prev.filter((msg) => msg.status !== 'failed'));
  }, []);

  return {
    pendingMessages,
    addPending,
    updateProgress,
    markAsSending,
    markAsFailed,
    removePending,
    retryPending,
    clearFailed,
  };
}

export default usePendingMessages;
