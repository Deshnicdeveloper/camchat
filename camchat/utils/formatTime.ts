/**
 * Time Formatting Utilities
 * Uses date-fns for consistent date/time formatting
 */

import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  differenceInMinutes,
  differenceInHours,
  differenceInSeconds,
} from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { getLocale } from '../lib/i18n';

/**
 * Get the appropriate date-fns locale based on app language
 */
function getDateLocale() {
  return getLocale() === 'fr' ? fr : enUS;
}

/**
 * Format a timestamp for chat list display
 * Shows: time if today, day name if this week, date otherwise
 */
export function formatChatTimestamp(date: Date): string {
  const locale = getDateLocale();

  if (isToday(date)) {
    return format(date, 'HH:mm', { locale });
  }

  if (isYesterday(date)) {
    return getLocale() === 'fr' ? 'Hier' : 'Yesterday';
  }

  if (isThisWeek(date)) {
    return format(date, 'EEEE', { locale });
  }

  return format(date, 'dd/MM/yyyy', { locale });
}

/**
 * Format a timestamp for message display
 */
export function formatMessageTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Format a date separator in chat
 * Shows: "Today", "Yesterday", or full date
 */
export function formatDateSeparator(date: Date): string {
  const locale = getDateLocale();

  if (isToday(date)) {
    return getLocale() === 'fr' ? 'Aujourd\'hui' : 'Today';
  }

  if (isYesterday(date)) {
    return getLocale() === 'fr' ? 'Hier' : 'Yesterday';
  }

  return format(date, 'd MMMM yyyy', { locale });
}

/**
 * Format last seen time
 */
export function formatLastSeen(date: Date): string {
  const locale = getDateLocale();
  const minutesAgo = differenceInMinutes(new Date(), date);

  if (minutesAgo < 1) {
    return getLocale() === 'fr' ? 'À l\'instant' : 'Just now';
  }

  if (minutesAgo < 60) {
    return `${minutesAgo} ${getLocale() === 'fr' ? 'min' : 'min ago'}`;
  }

  const hoursAgo = differenceInHours(new Date(), date);
  if (hoursAgo < 24) {
    return `${hoursAgo}${getLocale() === 'fr' ? 'h' : 'h ago'}`;
  }

  if (isYesterday(date)) {
    const time = format(date, 'HH:mm', { locale });
    return `${getLocale() === 'fr' ? 'Hier' : 'Yesterday'} ${time}`;
  }

  return format(date, 'dd/MM/yyyy HH:mm', { locale });
}

/**
 * Format status time (e.g., "2 hours ago")
 */
export function formatStatusTime(date: Date): string {
  const locale = getDateLocale();
  return formatDistanceToNow(date, { addSuffix: true, locale });
}

/**
 * Format call duration
 */
export function formatCallDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format voice note duration
 */
export function formatAudioDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
