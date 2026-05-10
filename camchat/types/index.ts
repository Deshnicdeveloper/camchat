/**
 * CamChat TypeScript Type Definitions
 * All shared types and interfaces for the application
 */

// ============================================
// Enums and Union Types
// ============================================

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
export type ChatType = 'direct' | 'group';
export type CallType = 'voice' | 'video';
export type CallStatus = 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type StatusType = 'image' | 'video' | 'text';
export type AppLanguage = 'en' | 'fr';

// ============================================
// User Types
// ============================================

export interface User {
  uid: string;
  phone: string;
  displayName: string;
  about: string;
  avatarUrl: string;
  language: AppLanguage;
  isOnline: boolean;
  lastSeen: Date;
  fcmToken: string;
  contacts: string[];
  createdAt: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl: string;
  about: string;
  isOnline: boolean;
  lastSeen: Date;
}

// ============================================
// Chat Types
// ============================================

export interface Chat {
  id: string;
  type: ChatType;
  participants: string[];
  createdBy: string;
  createdAt: Date;
  lastMessage: LastMessage;
  unreadCount: Record<string, number>;
  // Group-only fields
  groupName?: string;
  groupAvatarUrl?: string;
  groupDescription?: string;
}

export interface LastMessage {
  text: string;
  senderId: string;
  type: MessageType;
  timestamp: Date;
}

export interface Message {
  id: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  audioDuration?: number;
  fileName?: string;
  fileSize?: number;
  location?: LocationData;
  replyTo?: ReplyReference;
  reactions: Record<string, string>;
  status: MessageStatus;
  readBy: string[];
  deletedFor: string[];
  isStarred: boolean;
  timestamp: Date;
}

export interface ReplyReference {
  messageId: string;
  senderId: string;
  text: string;
  type: MessageType;
}

export interface LocationData {
  lat: number;
  lng: number;
  label: string;
}

// ============================================
// Status Types
// ============================================

export interface Status {
  id: string;
  userId: string;
  type: StatusType;
  mediaUrl?: string;
  text?: string;
  backgroundColor?: string;
  caption?: string;
  viewedBy: string[];
  expiresAt: Date;
  createdAt: Date;
}

export interface StatusGroup {
  userId: string;
  user: UserProfile;
  statuses: Status[];
  hasUnviewed: boolean;
}

// ============================================
// Call Types
// ============================================

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: CallStatus;
  agoraChannelName?: string;
  agoraToken?: string;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

export interface CallLog extends Call {
  callerProfile: UserProfile;
  receiverProfile: UserProfile;
  duration?: number; // in seconds
}

// ============================================
// Contact Types
// ============================================

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  isRegistered: boolean;
  userId?: string; // Only present if registered on CamChat
}

// ============================================
// Navigation Types
// ============================================

export interface ChatRoomParams {
  chatId: string;
  recipientId?: string;
  recipientName?: string;
}

export interface CallScreenParams {
  callId: string;
  isIncoming: boolean;
}

export interface ProfileParams {
  userId: string;
}

export interface StatusViewParams {
  userId: string;
  startIndex?: number;
}

// ============================================
// Form Types
// ============================================

export interface PhoneFormData {
  countryCode: string;
  phoneNumber: string;
}

export interface ProfileSetupData {
  displayName: string;
  about: string;
  avatarUri?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  lastDoc?: string;
}

// ============================================
// Firestore Timestamp Conversion
// ============================================

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export function firestoreTimestampToDate(timestamp: FirestoreTimestamp): Date {
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
}
