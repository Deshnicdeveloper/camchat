/**
 * Firestore Helper Functions
 * Utility functions for common Firestore operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  CollectionReference,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  CHATS: 'chats',
  MESSAGES: 'messages',
  STATUSES: 'statuses',
  CALLS: 'calls',
} as const;

/**
 * Get a reference to a collection
 */
export function getCollectionRef(collectionName: string): CollectionReference<DocumentData> {
  return collection(db, collectionName);
}

/**
 * Get a reference to a document
 */
export function getDocRef(collectionName: string, docId: string): DocumentReference<DocumentData> {
  return doc(db, collectionName, docId);
}

/**
 * Get a reference to a subcollection
 */
export function getSubcollectionRef(
  parentCollection: string,
  parentId: string,
  subcollectionName: string
): CollectionReference<DocumentData> {
  return collection(db, parentCollection, parentId, subcollectionName);
}

/**
 * Get a document by ID
 */
export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = getDocRef(collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

/**
 * Set a document (create or overwrite)
 */
export async function setDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  merge: boolean = false
): Promise<void> {
  try {
    const docRef = getDocRef(collectionName, docId);
    await setDoc(docRef, data, { merge });
  } catch (error) {
    console.error('Error setting document:', error);
    throw error;
  }
}

/**
 * Update a document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const docRef = getDocRef(collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = getDocRef(collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Query documents with constraints
 */
export async function queryDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<T[]> {
  try {
    const collectionRef = getCollectionRef(collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}

/**
 * Subscribe to a document
 */
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): () => void {
  const docRef = getDocRef(collectionName, docId);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as T);
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to a collection query
 */
export function subscribeToCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): () => void {
  const collectionRef = getCollectionRef(collectionName);
  const q = query(collectionRef, ...constraints);

  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
    callback(data);
  });
}

/**
 * Get server timestamp
 */
export function getServerTimestamp() {
  return serverTimestamp();
}

/**
 * Convert Date to Firestore Timestamp
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * Get a new batch for batch writes
 */
export function getBatch() {
  return writeBatch(db);
}

/**
 * Increment a field value
 */
export function incrementField(value: number) {
  return increment(value);
}

// Re-export commonly used Firestore functions
export {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
};
