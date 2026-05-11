/**
 * Firebase Auth Service
 * Handles phone authentication with Firebase
 */

import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  ConfirmationResult,
  RecaptchaVerifier,
  ApplicationVerifier,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from './firebase';
import { COLLECTIONS, getDocument, setDocument, updateDocument, getServerTimestamp } from './firestore';
import type { User, AppLanguage } from '../types';

// Development mode flag - set to true to bypass Firebase Phone Auth
// Set to false for production
const DEV_MODE = __DEV__ && true; // Only active in development builds
const DEV_OTP_CODE = '123456'; // Test OTP code for development

// Store confirmation result for OTP verification
let confirmationResult: ConfirmationResult | null = null;

// Store phone number for dev mode
let devModePhoneNumber: string | null = null;

/**
 * Format phone number to E.164 format for Cameroon
 * Ensures the number starts with +237
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string = '+237'): string {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // If already has country code, return as is
  if (cleaned.startsWith('+237')) {
    return cleaned;
  }

  // If starts with 237 (without +), add +
  if (cleaned.startsWith('237')) {
    return '+' + cleaned;
  }

  // Otherwise, add the country code
  return countryCode + cleaned;
}

/**
 * Send OTP to phone number
 * Uses Firebase Phone Auth with reCAPTCHA verification
 * In DEV_MODE, simulates OTP sending without Firebase
 */
export async function sendOTP(
  phoneNumber: string,
  recaptchaVerifier?: ApplicationVerifier
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // For development/testing, log the phone number
    console.log('Sending OTP to:', formattedPhone);

    // Development mode - bypass Firebase Phone Auth
    if (DEV_MODE) {
      console.log('🔧 DEV MODE: Simulating OTP send. Use code:', DEV_OTP_CODE);
      devModePhoneNumber = formattedPhone;
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }

    // Production mode - use Firebase Phone Auth
    if (!recaptchaVerifier) {
      return {
        success: false,
        error: 'reCAPTCHA verification is required. Please try again.'
      };
    }

    // Send verification code
    confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      recaptchaVerifier
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('Error sending OTP:', error);

    // Handle specific Firebase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      switch (firebaseError.code) {
        case 'auth/invalid-phone-number':
          return { success: false, error: 'Invalid phone number format.' };
        case 'auth/too-many-requests':
          return { success: false, error: 'Too many requests. Please try again later.' };
        case 'auth/quota-exceeded':
          return { success: false, error: 'SMS quota exceeded. Please try again later.' };
        case 'auth/captcha-check-failed':
          return { success: false, error: 'reCAPTCHA verification failed. Please try again.' };
        default:
          return { success: false, error: firebaseError.message || 'Failed to send verification code.' };
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify OTP code
 * In DEV_MODE, accepts the test code and signs in anonymously
 */
export async function verifyOTP(
  otpCode: string
): Promise<{ success: boolean; user?: FirebaseUser; isNewUser?: boolean; error?: string }> {
  try {
    // Development mode - verify against test code
    if (DEV_MODE) {
      console.log('🔧 DEV MODE: Verifying OTP code:', otpCode);

      if (otpCode !== DEV_OTP_CODE) {
        return { success: false, error: 'Invalid verification code. Use: ' + DEV_OTP_CODE };
      }

      // Sign in anonymously for development
      const result = await signInAnonymously(auth);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      const existingUser = await getDocument<User>(COLLECTIONS.USERS, firebaseUser.uid);
      const isNewUser = !existingUser;

      // Clear dev mode phone number
      devModePhoneNumber = null;

      console.log('🔧 DEV MODE: Auth successful, isNewUser:', isNewUser);
      return { success: true, user: firebaseUser, isNewUser };
    }

    // Production mode - verify with Firebase
    if (!confirmationResult) {
      return { success: false, error: 'No verification in progress. Please request a new code.' };
    }

    // Confirm the verification code
    const result = await confirmationResult.confirm(otpCode);
    const firebaseUser = result.user;

    // Check if user exists in Firestore
    const existingUser = await getDocument<User>(COLLECTIONS.USERS, firebaseUser.uid);
    const isNewUser = !existingUser;

    // Clear confirmation result
    confirmationResult = null;

    return { success: true, user: firebaseUser, isNewUser };
  } catch (error: unknown) {
    console.error('Error verifying OTP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Invalid verification code';
    return { success: false, error: errorMessage };
  }
}

/**
 * Create user profile in Firestore
 */
export async function createUserProfile(
  uid: string,
  phoneNumber: string,
  displayName: string,
  about: string = "Hey, I'm on CamChat 🦁",
  avatarUrl: string = '',
  language: AppLanguage = 'en'
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const newUser: Omit<User, 'lastSeen' | 'createdAt'> & { lastSeen: ReturnType<typeof getServerTimestamp>; createdAt: ReturnType<typeof getServerTimestamp> } = {
      uid,
      phone: formatPhoneNumber(phoneNumber),
      displayName,
      about,
      avatarUrl,
      language,
      isOnline: true,
      lastSeen: getServerTimestamp(),
      fcmToken: '',
      contacts: [],
      createdAt: getServerTimestamp(),
    };

    await setDocument(COLLECTIONS.USERS, uid, newUser);

    // Fetch the created user to get the resolved timestamps
    const createdUser = await getDocument<User>(COLLECTIONS.USERS, uid);

    return { success: true, user: createdUser || undefined };
  } catch (error: unknown) {
    console.error('Error creating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    return await getDocument<User>(COLLECTIONS.USERS, uid);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<User, 'displayName' | 'about' | 'avatarUrl' | 'language' | 'fcmToken'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDocument(COLLECTIONS.USERS, uid, updates);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
    return { success: false, error: errorMessage };
  }
}

/**
 * Update user online status
 */
export async function updateOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
  try {
    await updateDocument(COLLECTIONS.USERS, uid, {
      isOnline,
      lastSeen: getServerTimestamp(),
    });
  } catch (error) {
    console.error('Error updating online status:', error);
  }
}

/**
 * Sign out user
 */
export async function logoutUser(uid?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Update online status before signing out
    if (uid) {
      await updateOnlineStatus(uid, false);
    }

    await signOut(auth);
    confirmationResult = null;

    return { success: true };
  } catch (error: unknown) {
    console.error('Error signing out:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
    return { success: false, error: errorMessage };
  }
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current Firebase user
 */
export function getCurrentFirebaseUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Get the phone number used in dev mode
 * (Used for creating user profile in dev mode)
 */
export function getDevModePhoneNumber(): string | null {
  return devModePhoneNumber;
}

/**
 * Check if dev mode is enabled
 */
export function isDevModeEnabled(): boolean {
  return DEV_MODE;
}

/**
 * Check if a phone number is already registered
 */
export async function isPhoneRegistered(phoneNumber: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const { where, query } = await import('./firestore');
    const { getDocs, collection } = await import('firebase/firestore');
    const { db } = await import('./firebase');

    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('phone', '==', formattedPhone));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking phone registration:', error);
    return false;
  }
}
