/**
 * CamChat Color Palette
 * Egyptian Blue (#1034A6) is the primary brand color
 * Includes Cameroonian flag accent colors for cultural elements
 */

export const Colors = {
  // Primary brand colors
  primary: '#1034A6',           // Egyptian Blue — main brand color
  primaryLight: '#3D5FC4',      // Lighter blue for hover/pressed states
  primaryDark: '#0A2070',       // Darker blue for headers/navigation bars
  primaryFaded: '#1034A615',    // 8% opacity blue for backgrounds/chips

  // Background colors
  background: '#FFFFFF',        // App background
  surface: '#F7F8FC',           // Card/input background
  surfaceAlt: '#EDEEF5',        // Dividers, skeleton loaders

  // Text colors
  textPrimary: '#0D0D0D',       // Main text
  textSecondary: '#6B7280',     // Subtitles, timestamps, placeholders
  textInverse: '#FFFFFF',       // Text on blue backgrounds

  // Message bubble colors
  bubble_sent: '#1034A6',       // Sent message bubble (Egyptian Blue)
  bubble_received: '#F0F2FF',   // Received message bubble (very light blue)
  bubble_sent_text: '#FFFFFF',
  bubble_received_text: '#0D0D0D',

  // Semantic colors
  success: '#22C55E',           // Online indicator, delivered ticks
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',              // Info blue

  // Accent colors
  accent: '#10B981',            // Teal/green accent for typing indicator

  // Message received bubble
  messageReceived: '#F0F2FF',   // Very light blue (same as bubble_received)

  // UI element colors
  divider: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.45)',

  // Cameroonian flag accent palette (used sparingly in onboarding/illustrations)
  cam_green: '#007A5E',
  cam_red: '#CE1126',
  cam_yellow: '#FCD116',
} as const;

export type ColorKeys = keyof typeof Colors;
export default Colors;
