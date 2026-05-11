/**
 * Auth Store
 * Manages user authentication state with Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, AppLanguage } from '../types';
import { setLocale } from '../lib/i18n';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  language: AppLanguage;

  // Phone verification state
  phoneNumber: string;
  verificationInProgress: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setLanguage: (language: AppLanguage) => void;
  setPhoneNumber: (phone: string) => void;
  setVerificationInProgress: (inProgress: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  language: 'en' as AppLanguage,
  phoneNumber: '',
  verificationInProgress: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });

        // Update language based on user preference
        if (user?.language) {
          setLocale(user.language);
          set({ language: user.language });
        }
      },

      setLoading: (isLoading) => set({ isLoading }),

      setInitialized: (isInitialized) => set({ isInitialized, isLoading: false }),

      setLanguage: (language) => {
        setLocale(language);
        set({ language });
      },

      setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

      setVerificationInProgress: (verificationInProgress) => set({ verificationInProgress }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          phoneNumber: '',
          verificationInProgress: false,
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'camchat-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => {
        // When storage is rehydrated, mark as initialized
        if (state) {
          state.setInitialized(true);
          // Apply saved language
          if (state.language) {
            setLocale(state.language);
          }
        }
      },
    }
  )
);

export default useAuthStore;
