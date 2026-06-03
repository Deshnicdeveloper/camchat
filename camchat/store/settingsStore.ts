/**
 * Settings Store
 * Persists device-local user preferences (privacy, notifications, chats,
 * security) that aren't part of the Firestore user profile.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PrivacySettings {
  lastSeenOnline: boolean;
  readReceipts: boolean;
  profilePhotoVisible: boolean;
  onlineStatusVisible: boolean;
}

export interface NotificationSettings {
  messageNotifications: boolean;
  groupNotifications: boolean;
  inAppSounds: boolean;
  vibrate: boolean;
}

export interface ChatSettings {
  enterToSend: boolean;
  mediaAutoDownload: boolean;
}

export interface SecuritySettings {
  securityNotifications: boolean;
}

interface SettingsState {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  chats: ChatSettings;
  security: SecuritySettings;
  setPrivacy: (updates: Partial<PrivacySettings>) => void;
  setNotifications: (updates: Partial<NotificationSettings>) => void;
  setChats: (updates: Partial<ChatSettings>) => void;
  setSecurity: (updates: Partial<SecuritySettings>) => void;
}

const initialState = {
  privacy: {
    lastSeenOnline: true,
    readReceipts: true,
    profilePhotoVisible: true,
    onlineStatusVisible: true,
  },
  notifications: {
    messageNotifications: true,
    groupNotifications: true,
    inAppSounds: true,
    vibrate: true,
  },
  chats: {
    enterToSend: false,
    mediaAutoDownload: true,
  },
  security: {
    securityNotifications: false,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setPrivacy: (updates) =>
        set((state) => ({ privacy: { ...state.privacy, ...updates } })),
      setNotifications: (updates) =>
        set((state) => ({ notifications: { ...state.notifications, ...updates } })),
      setChats: (updates) =>
        set((state) => ({ chats: { ...state.chats, ...updates } })),
      setSecurity: (updates) =>
        set((state) => ({ security: { ...state.security, ...updates } })),
    }),
    {
      name: 'camchat-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useSettingsStore;
