/**
 * useAuth Hook
 * Custom hook for authentication functionality
 */

import { useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  sendOTP,
  verifyOTP,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  updateOnlineStatus,
  logoutUser,
  subscribeToAuthState,
  formatPhoneNumber,
} from '../lib/auth';
import type { User, AppLanguage } from '../types';

interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  phoneNumber: string;
  verificationInProgress: boolean;

  // Actions
  sendVerificationCode: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (code: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  completeProfile: (
    displayName: string,
    about?: string,
    avatarUrl?: string,
    language?: AppLanguage
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'displayName' | 'about' | 'avatarUrl' | 'language'>>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  setLanguage: (language: AppLanguage) => void;
}

export function useAuth(): UseAuthReturn {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    phoneNumber,
    verificationInProgress,
    setUser,
    setLoading,
    setInitialized,
    setPhoneNumber,
    setVerificationInProgress,
    updateUser,
    logout: storeLogout,
    setLanguage,
  } = useAuthStore();

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);

        // Fetch user profile from Firestore
        const userProfile = await getUserProfile(firebaseUser.uid);

        if (userProfile) {
          setUser(userProfile);
          // Update online status
          await updateOnlineStatus(firebaseUser.uid, true);
        } else {
          // User exists in Firebase but not in Firestore (needs profile setup)
          setLoading(false);
        }
      } else {
        setFirebaseUid(null);
        setUser(null);
      }

      setInitialized(true);
    });

    return () => {
      unsubscribe();
      // Update offline status when component unmounts
      if (firebaseUid) {
        updateOnlineStatus(firebaseUid, false);
      }
    };
  }, []);

  // Send OTP to phone number
  const sendVerificationCode = useCallback(
    async (phone: string): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      setVerificationInProgress(false);

      const formattedPhone = formatPhoneNumber(phone);
      setPhoneNumber(formattedPhone);

      const result = await sendOTP(phone);

      if (result.success) {
        setVerificationInProgress(true);
      }

      setLoading(false);
      return result;
    },
    [setLoading, setPhoneNumber, setVerificationInProgress]
  );

  // Verify OTP code
  const verifyCode = useCallback(
    async (code: string): Promise<{ success: boolean; isNewUser?: boolean; error?: string }> => {
      setLoading(true);

      const result = await verifyOTP(code);

      if (result.success && result.user) {
        setFirebaseUid(result.user.uid);

        if (!result.isNewUser) {
          // Existing user - fetch profile
          const userProfile = await getUserProfile(result.user.uid);
          if (userProfile) {
            setUser(userProfile);
            await updateOnlineStatus(result.user.uid, true);
          }
        }
      }

      setVerificationInProgress(false);
      setLoading(false);

      return {
        success: result.success,
        isNewUser: result.isNewUser,
        error: result.error,
      };
    },
    [setLoading, setUser, setVerificationInProgress]
  );

  // Complete profile setup for new users
  const completeProfile = useCallback(
    async (
      displayName: string,
      about: string = "Hey, I'm on CamChat 🦁",
      avatarUrl: string = '',
      language: AppLanguage = 'en'
    ): Promise<{ success: boolean; error?: string }> => {
      if (!firebaseUid) {
        return { success: false, error: 'No authenticated user' };
      }

      setLoading(true);

      const result = await createUserProfile(
        firebaseUid,
        phoneNumber,
        displayName,
        about,
        avatarUrl,
        language
      );

      if (result.success && result.user) {
        setUser(result.user);
        await updateOnlineStatus(firebaseUid, true);
      }

      setLoading(false);
      return { success: result.success, error: result.error };
    },
    [firebaseUid, phoneNumber, setLoading, setUser]
  );

  // Update existing user profile
  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<User, 'displayName' | 'about' | 'avatarUrl' | 'language'>>
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user?.uid) {
        return { success: false, error: 'No authenticated user' };
      }

      const result = await updateUserProfile(user.uid, updates);

      if (result.success) {
        updateUser(updates);
      }

      return result;
    },
    [user?.uid, updateUser]
  );

  // Logout user
  const logout = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    const result = await logoutUser(user?.uid);

    if (result.success) {
      storeLogout();
    }

    setLoading(false);
    return result;
  }, [user?.uid, setLoading, storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    phoneNumber,
    verificationInProgress,
    sendVerificationCode,
    verifyCode,
    completeProfile,
    updateProfile,
    logout,
    setLanguage,
  };
}

export default useAuth;
