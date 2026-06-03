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

/**
 * Dark theme palette — same keys as Colors so any screen can swap between them
 * via the useColors() hook. Brand blue is kept for accents; surfaces and text
 * are inverted for a comfortable dark UI.
 */
export const DarkColors: Record<ColorKeys, string> = {
  // Primary brand colors
  primary: '#5B7CFF',           // Lighter Egyptian Blue for accents on dark
  primaryLight: '#8198FF',
  primaryDark: '#1034A6',
  primaryFaded: '#5B7CFF26',    // ~15% opacity for chips/backgrounds

  // Background colors
  background: '#121218',        // App background (near-black)
  surface: '#1C1C24',           // Card/input background
  surfaceAlt: '#2A2A33',        // Dividers, skeleton loaders

  // Text colors
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Message bubble colors
  bubble_sent: '#3D5FC4',
  bubble_received: '#26262F',
  bubble_sent_text: '#FFFFFF',
  bubble_received_text: '#F3F4F6',

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#F87171',
  info: '#60A5FA',

  // Accent colors
  accent: '#10B981',

  // Message received bubble
  messageReceived: '#26262F',

  // UI element colors
  divider: '#2E2E38',
  overlay: 'rgba(0,0,0,0.6)',

  // Cameroonian flag accent palette
  cam_green: '#007A5E',
  cam_red: '#CE1126',
  cam_yellow: '#FCD116',
};

export type ColorPalette = Record<ColorKeys, string>;
export default Colors;
