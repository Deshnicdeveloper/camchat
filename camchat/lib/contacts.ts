/**
 * Contact Sync Logic
 * Handles device contact sync and finding registered CamChat users
 */

import * as Contacts from 'expo-contacts';
import { getDocs, collection, query, where, documentId } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, updateDocument } from './firestore';
import type { Contact, User } from '../types';
import { formatPhoneNumber } from './auth';

interface ContactSyncResult {
  success: boolean;
  contacts: Contact[];
  error?: string;
}

/**
 * Request contacts permission
 */
export async function requestContactsPermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
}

/**
 * Check if contacts permission is granted
 */
export async function hasContactsPermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking contacts permission:', error);
    return false;
  }
}

/**
 * Extract and normalize phone numbers from a contact
 */
function extractPhoneNumbers(contact: Contacts.Contact): string[] {
  const phones: string[] = [];

  if (contact.phoneNumbers) {
    for (const phone of contact.phoneNumbers) {
      if (phone.number) {
        // Normalize to E.164 format for Cameroon
        const normalized = formatPhoneNumber(phone.number);
        if (normalized) {
          phones.push(normalized);
        }
      }
    }
  }

  return phones;
}

/**
 * Get contact name
 */
function getContactName(contact: Contacts.Contact): string {
  if (contact.name) return contact.name;
  if (contact.firstName && contact.lastName) {
    return `${contact.firstName} ${contact.lastName}`.trim();
  }
  if (contact.firstName) return contact.firstName;
  if (contact.lastName) return contact.lastName;
  return 'Unknown';
}

/**
 * Read device contacts and extract phone numbers
 */
export async function getDeviceContacts(): Promise<Map<string, string>> {
  const phoneToName = new Map<string, string>();

  try {
    const hasPermission = await hasContactsPermission();
    if (!hasPermission) {
      console.log('📱 Contacts permission not granted');
      return phoneToName;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.FirstName, Contacts.Fields.LastName],
    });

    console.log(`📱 Found ${data.length} device contacts`);

    for (const contact of data) {
      const name = getContactName(contact);
      const phones = extractPhoneNumbers(contact);

      for (const phone of phones) {
        // Only add if we don't already have this phone or if the new name is better
        if (!phoneToName.has(phone) || name !== 'Unknown') {
          phoneToName.set(phone, name);
        }
      }
    }

    console.log(`📱 Extracted ${phoneToName.size} unique phone numbers`);
    return phoneToName;
  } catch (error) {
    console.error('Error reading device contacts:', error);
    return phoneToName;
  }
}

/**
 * Query Firestore for registered users matching phone numbers
 * Batches queries in groups of 10 due to Firestore 'in' limit
 */
export async function findRegisteredUsers(
  phoneNumbers: string[],
  currentUserId: string
): Promise<User[]> {
  const registeredUsers: User[] = [];

  try {
    if (phoneNumbers.length === 0) {
      return registeredUsers;
    }

    // Batch phone numbers in groups of 10 (Firestore 'in' limit)
    const batches: string[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += 10) {
      batches.push(phoneNumbers.slice(i, i + 10));
    }

    console.log(`🔍 Querying ${batches.length} batches for registered users`);

    const usersRef = collection(db, COLLECTIONS.USERS);

    for (const batch of batches) {
      const q = query(usersRef, where('phone', 'in', batch));
      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        // Don't include the current user
        if (doc.id !== currentUserId) {
          const userData = doc.data() as Omit<User, 'uid'>;
          registeredUsers.push({
            uid: doc.id,
            ...userData,
            // Convert Firestore timestamps to Dates
            lastSeen: userData.lastSeen instanceof Date
              ? userData.lastSeen
              : (userData.lastSeen as { toDate: () => Date })?.toDate?.() || new Date(),
            createdAt: userData.createdAt instanceof Date
              ? userData.createdAt
              : (userData.createdAt as { toDate: () => Date })?.toDate?.() || new Date(),
          });
        }
      }
    }

    console.log(`✅ Found ${registeredUsers.length} registered users from contacts`);
    return registeredUsers;
  } catch (error) {
    console.error('Error finding registered users:', error);
    return registeredUsers;
  }
}

/**
 * Sync contacts - main function
 * 1. Reads device contacts
 * 2. Finds registered CamChat users
 * 3. Returns combined contact list
 * 4. Updates current user's contacts array in Firestore
 */
export async function syncContacts(currentUserId: string): Promise<ContactSyncResult> {
  try {
    console.log('🔄 Starting contact sync...');

    // Step 1: Get device contacts
    const deviceContacts = await getDeviceContacts();

    if (deviceContacts.size === 0) {
      return {
        success: true,
        contacts: [],
      };
    }

    // Step 2: Find registered users
    const phoneNumbers = Array.from(deviceContacts.keys());
    const registeredUsers = await findRegisteredUsers(phoneNumbers, currentUserId);

    // Step 3: Build contact list
    const contacts: Contact[] = registeredUsers.map((user) => ({
      id: user.uid,
      name: deviceContacts.get(user.phone) || user.displayName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isRegistered: true,
      userId: user.uid,
    }));

    // Step 4: Update current user's contacts array in Firestore
    const contactIds = contacts.map((c) => c.userId).filter((id): id is string => !!id);

    if (contactIds.length > 0) {
      await updateDocument(COLLECTIONS.USERS, currentUserId, {
        contacts: contactIds,
      });
      console.log(`📝 Updated user's contacts array with ${contactIds.length} contacts`);
    }

    console.log('✅ Contact sync completed');
    return {
      success: true,
      contacts,
    };
  } catch (error) {
    console.error('❌ Contact sync failed:', error);
    return {
      success: false,
      contacts: [],
      error: error instanceof Error ? error.message : 'Contact sync failed',
    };
  }
}

/**
 * Get user details by IDs (for displaying contact info)
 */
export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  const users: User[] = [];

  try {
    if (userIds.length === 0) {
      return users;
    }

    // Batch in groups of 10
    const batches: string[][] = [];
    for (let i = 0; i < userIds.length; i += 10) {
      batches.push(userIds.slice(i, i + 10));
    }

    const usersRef = collection(db, COLLECTIONS.USERS);

    for (const batch of batches) {
      const q = query(usersRef, where(documentId(), 'in', batch));
      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const userData = doc.data() as Omit<User, 'uid'>;
        users.push({
          uid: doc.id,
          ...userData,
          lastSeen: userData.lastSeen instanceof Date
            ? userData.lastSeen
            : (userData.lastSeen as { toDate: () => Date })?.toDate?.() || new Date(),
          createdAt: userData.createdAt instanceof Date
            ? userData.createdAt
            : (userData.createdAt as { toDate: () => Date })?.toDate?.() || new Date(),
        });
      }
    }

    return users;
  } catch (error) {
    console.error('Error getting users by IDs:', error);
    return users;
  }
}

/**
 * Get a single user's profile by ID
 */
export async function getUserProfile(userId: string): Promise<import('../types').UserProfile | null> {
  try {
    const users = await getUsersByIds([userId]);
    if (users.length === 0) return null;

    const user = users[0];
    return {
      uid: user.uid,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}
