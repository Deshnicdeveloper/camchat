/**
 * Supabase Configuration
 * Handles Supabase Storage initialization
 *
 * IMPORTANT: Storage Bucket RLS Configuration
 * =============================================
 * Each bucket requires Row-Level Security (RLS) policies to allow uploads.
 * Since we use Firebase Auth (not Supabase Auth), we need PUBLIC policies.
 *
 * For each bucket, go to Supabase Dashboard > Storage > [bucket] > Policies
 * and create the following policies:
 *
 * 1. AVATARS bucket:
 *    - Policy name: "Allow public read"
 *    - Target: SELECT (Download)
 *    - Definition: true
 *
 *    - Policy name: "Allow public upload"
 *    - Target: INSERT (Upload)
 *    - Definition: true
 *
 *    - Policy name: "Allow public update"
 *    - Target: UPDATE
 *    - Definition: true
 *
 * 2. CHAT-MEDIA bucket (for images, videos, documents):
 *    - Policy name: "Allow public read"
 *    - Target: SELECT (Download)
 *    - Definition: true
 *
 *    - Policy name: "Allow public upload"
 *    - Target: INSERT (Upload)
 *    - Definition: true
 *
 * 3. VOICE-NOTES bucket:
 *    - Policy name: "Allow public read"
 *    - Target: SELECT (Download)
 *    - Definition: true
 *
 *    - Policy name: "Allow public upload"
 *    - Target: INSERT (Upload)
 *    - Definition: true
 *
 * 4. STATUSES bucket:
 *    - Policy name: "Allow public read"
 *    - Target: SELECT (Download)
 *    - Definition: true
 *
 *    - Policy name: "Allow public upload"
 *    - Target: INSERT (Upload)
 *    - Definition: true
 *
 *    - Policy name: "Allow public delete"
 *    - Target: DELETE
 *    - Definition: true
 *
 * SQL for RLS policies (run in SQL Editor):
 * ------------------------------------------
 * -- For chat-media bucket:
 * CREATE POLICY "Allow public read" ON storage.objects
 *   FOR SELECT USING (bucket_id = 'chat-media');
 *
 * CREATE POLICY "Allow public upload" ON storage.objects
 *   FOR INSERT WITH CHECK (bucket_id = 'chat-media');
 *
 * -- Repeat for other buckets (avatars, voice-notes, statuses)
 * -- Just change the bucket_id in each policy
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
// Note: Each bucket must have RLS policies configured (see comments above)
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  CHAT_MEDIA: 'chat-media',
  VOICE_NOTES: 'voice-notes',
  STATUSES: 'statuses',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

export default supabase;
