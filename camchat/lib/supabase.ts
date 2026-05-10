/**
 * Supabase Configuration
 * Handles Supabase Storage initialization
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these values with your actual Supabase project config
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We use Firebase for auth, so no need to persist Supabase sessions
  },
});

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  CHAT_MEDIA: 'chat-media',
  VOICE_NOTES: 'voice-notes',
  STATUSES: 'statuses',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

export default supabase;
