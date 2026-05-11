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
} from 'firebase/auth';
import { auth } from './firebase';
import { COLLECTIONS, getDocument, setDocument, updateDocument, getServerTimestamp } from './firestore';
import type { User, AppLanguage } from '../types';

// Store confirmation result for OTP verification
let confirmationResult: ConfirmationResult | null = null;

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
 * Note: In React Native with Expo, we need to use a different approach
 * For now, this is set up for web. For mobile, you'd use expo-firebase-recaptcha
 */
export async function sendOTP(
  phoneNumber: string,
  recaptchaVerifier?: ApplicationVerifier
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // For development/testing, log the phone number
    console.log('Sending OTP to:', formattedPhone);

    if (!recaptchaVerifier) {
      // In a real app, you'd need to set up reCAPTCHA
      // For React Native with Expo, use expo-firebase-recaptcha
      console.warn('No reCAPTCHA verifier provided. Using test mode if enabled.');
    }

    // Send verification code
    confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      recaptchaVerifier as ApplicationVerifier
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('Error sending OTP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  otpCode: string
): Promise<{ success: boolean; user?: FirebaseUser; isNewUser?: boolean; error?: string }> {
  try {
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
