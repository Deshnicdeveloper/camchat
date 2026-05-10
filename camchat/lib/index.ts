/**
 * Library Exports
 * Central export point for all library utilities
 */

export { app, auth, db } from './firebase';
export { supabase, STORAGE_BUCKETS } from './supabase';
export type { StorageBucket } from './supabase';
export * from './firestore';
export * from './storage';
export { default as i18n, t, setLocale, getLocale } from './i18n';
