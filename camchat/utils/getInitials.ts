/**
 * Text Utilities
 */

/**
 * Get initials from a display name
 * Examples:
 * - "John Doe" -> "JD"
 * - "Jean-Pierre" -> "JP"
 * - "Alice" -> "A"
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }

  const cleanName = name.trim();

  // Split by spaces or hyphens
  const parts = cleanName.split(/[\s-]+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  // Get first letter of first and last parts
  const firstInitial = parts[0].charAt(0);
  const lastInitial = parts[parts.length - 1].charAt(0);

  return (firstInitial + lastInitial).toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Normalize phone number to E.164 format
 * Assumes Cameroon (+237) if no country code provided
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If starts with +, it already has country code
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with 237 (Cameroon code without +)
  if (cleaned.startsWith('237')) {
    return '+' + cleaned;
  }

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2);
  }

  // If starts with 6 (Cameroon mobile), add +237
  if (cleaned.startsWith('6')) {
    return '+237' + cleaned;
  }

  // Default: assume Cameroon
  return '+237' + cleaned;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Normalize first
  const normalized = normalizePhoneNumber(phone);

  // Format for Cameroon numbers: +237 6XX XXX XXX
  if (normalized.startsWith('+237')) {
    const local = normalized.substring(4);
    if (local.length === 9) {
      return `+237 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`;
    }
  }

  return normalized;
}
