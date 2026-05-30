# CamChat — SRS Source Document

> A complete, structured information dump of the CamChat project, organized so it can be
> directly used to produce a formal **Software Requirements Specification (SRS)** document
> (e.g., IEEE 830 / ISO/IEC/IEEE 29148 style). Each section maps to a typical SRS heading.

---

## 1. Introduction

### 1.1 Purpose
CamChat is a WhatsApp-style real-time messaging mobile application built for a Cameroonian
audience. This document captures the full functional, data, and technical scope of the project
so it can be transformed into a formal SRS.

### 1.2 Product Scope
CamChat combines proven WhatsApp UX patterns — real-time 1-on-1 and group messaging,
24-hour status/stories, voice notes, and voice/video calling — with a distinct Cameroonian
cultural identity. It is a culturally rooted communication tool, not a generic clone.

Key differentiators:
- **Egyptian Blue (#1034A6)** primary brand color.
- **Bilingual** English + French (Cameroon's two official languages).
- **Defaults to the +237 country code** (Cameroon).
- Cameroonian cultural references in onboarding, empty states, default copy, and sound design.

### 1.3 Intended Audience
- Cameroonian smartphone users (primary).
- General users worldwide (secondary).
- Developers, QA, and product stakeholders building/maintaining the app.

### 1.4 Definitions, Acronyms, Abbreviations
| Term | Meaning |
|------|---------|
| SRS | Software Requirements Specification |
| OTP | One-Time Password (phone verification) |
| E.164 | International phone number format (e.g., +237XXXXXXXXX) |
| FCM | Firebase Cloud Messaging (push notifications) |
| Status | 24-hour ephemeral story (image/video/text) |
| Agora | Third-party real-time voice/video SDK |
| Expo | React Native managed build toolchain |
| EAS | Expo Application Services (build/deploy) |
| i18n | Internationalization |
| Direct chat | 1-on-1 conversation |
| Group chat | Multi-participant conversation with admins |

### 1.5 References
- `master_prompt.md` — original build specification.
- Firebase, Supabase, Agora, and Expo official documentation.
- IEEE 830 / ISO/IEC/IEEE 29148 SRS guidelines.

---

## 2. Overall Description

### 2.1 Product Perspective
CamChat is a standalone, client-heavy mobile application backed by managed cloud services
(Backend-as-a-Service). There is no custom application server; the mobile client talks directly
to Firebase (auth + real-time database), Supabase (media storage), and Agora (real-time calls).

**High-level architecture:**
```
┌─────────────────────────────────────────────┐
│         CamChat Mobile App (Expo/RN)          │
│  UI (Expo Router screens + components)         │
│  State (Zustand stores)                        │
│  Hooks (useChat, useMessages, useCall, ...)    │
│  Services (lib/*)                              │
└───────┬───────────────┬───────────────┬───────┘
        │               │               │
   ┌────▼────┐     ┌─────▼─────┐   ┌─────▼─────┐
   │ Firebase│     │ Supabase  │   │  Agora    │
   │ Auth +  │     │ Storage   │   │ Voice/Vid │
   │Firestore│     │ (media)   │   │ RTC       │
   └─────────┘     └───────────┘   └───────────┘
```

### 2.2 Product Functions (Summary)
- Phone-number authentication with OTP and profile setup.
- Real-time 1-on-1 and group messaging.
- Rich messages: text, image, video, audio/voice notes, documents, location.
- Message features: replies, emoji reactions, read receipts, starred messages,
  per-user soft delete, typing indicators, delivery/read status.
- 24-hour Status/Stories (image, video, text).
- Voice and video calling with signaling, incoming-call handling, and call history.
- Contacts sync (find registered users from device phone contacts).
- Push notifications.
- Settings & profile management.
- Bilingual UI (EN/FR) with cultural theming.

### 2.3 User Classes and Characteristics
| User Class | Description |
|------------|-------------|
| Unregistered user | Goes through onboarding and phone verification. |
| Registered user | Full access to chats, status, calls, settings. |
| Group admin | Registered user with elevated rights in a group (rename, add/remove members, promote/demote admins). |
| Contact | Another registered user discovered via device contacts. |

### 2.4 Operating Environment
- **Platforms:** iOS and Android (also web bundler config present via react-native-web).
- **Framework:** Expo SDK ~54, React Native 0.81, React 19.
- **Workflow:** Managed Expo with `expo-dev-client` for native modules (Agora).
- **Bundle IDs:** iOS `com.camchat.app`, Android `com.camchat.app`.
- **Orientation:** Portrait. **UI style:** Light. **New architecture:** disabled.

### 2.5 Design and Implementation Constraints
- TypeScript strict mode; **no `any` type**.
- All design tokens (colors, typography, spacing, radius) pulled from constants files —
  no hardcoded inline style values.
- All user-facing strings go through the i18n utility — no hardcoded EN/FR text.
- All Firebase interactions wrapped in try/catch with error states surfaced to the user.
- Never use React Native's built-in `<Image>` — always use `expo-image`.
- All Firestore `onSnapshot` listeners must be cleaned up on unmount.
- Every screen must have a loading **skeleton** state — no raw spinners.
- Must run correctly on both iOS and Android.
- Built **phase by phase**; each phase fully working before the next.

### 2.6 Assumptions and Dependencies
- Users have a valid phone number capable of receiving SMS.
- Network connectivity available (app targets working on mobile data).
- Valid credentials/keys configured for Firebase, Supabase, and Agora.
- Third-party service availability (Firebase, Supabase, Agora) is required.

---

## 3. System Features / Functional Requirements

> Organized by feature module. Each can be expanded into numbered SRS requirements (e.g., FR-1.1).

### 3.1 Onboarding & Authentication
- **Onboarding slides (welcome):** 3-slide carousel introducing messaging, status sharing,
  and calling, with culturally-themed copy. "Get Started" CTA.
- **Phone entry:** Country-code selector defaulting to **+237**; phone number input;
  formats to **E.164**.
- **OTP verification:** Sends SMS OTP (Firebase phone auth, reCAPTCHA), verifies code.
  Supports a dev-mode test phone number.
- **Profile setup:** Display name, about (default "Hey, I'm on CamChat 🦁"), and avatar upload.
- **Registration check:** Detect whether a phone number is already registered.
- **Session:** Auth state persisted via AsyncStorage; auto-route based on auth + profile state.
- **Logout:** Clears session and sets user offline.

Service functions: `formatPhoneNumber`, `sendOTP`, `verifyOTP`, `createUserProfile`,
`getUserProfile`, `updateUserProfile`, `updateOnlineStatus`, `logoutUser`,
`subscribeToAuthState`, `getCurrentFirebaseUser`, `isPhoneRegistered`,
`getDevModePhoneNumber`, `isDevModeEnabled`.

### 3.2 Chat List & Contact Sync
- **Chat list:** Real-time list of conversations sorted by last message timestamp; shows
  avatar, name, last message preview, timestamp, unread count badge, online indicator.
- **Contact sync:** Request contacts permission, read device contacts, match against
  registered users, store registered contacts on the user profile.
- **New chat / new group:** Start a direct chat or create a group from contacts.
- **Chat management:** Archive, mute, delete-for-user, reset/increment unread counts.

Service functions: `subscribeToChats`, `getOrCreateDirectChat`, `getExistingDirectChat`,
`createDirectChat`, `getChatById`, `updateChatLastMessage`, `resetUnreadCount`,
`incrementUnreadCount`, `archiveChat`, `muteChat`, `deleteChatForUser`;
contacts: `requestContactsPermission`, `hasContactsPermission`, `getDeviceContacts`,
`findRegisteredUsers`, `syncContacts`, `getUsersByIds`.

### 3.3 Chat Room — Messaging (Text + Media)
- **Real-time messages** via Firestore subcollection listeners; pagination (load more).
- **Message types:** text, image, video, audio (voice note), document, location.
- **Compose:** Text input, attachment picker (camera/gallery/document/location).
- **Message bubbles:** Distinct sent/received styling; date separators; media thumbnails;
  image/video viewers; document rows with file name & size.
- **Replies:** Quote-reply referencing original message.
- **Reactions:** Per-user emoji reactions (add/remove).
- **Status ticks:** sending → sent → delivered → read.
- **Read receipts:** Mark messages as read; `readBy` array.
- **Starred messages:** Toggle star.
- **Delete:** Soft delete per user (`deletedFor`).
- **Typing indicator:** Real-time typing status per chat.
- **Pending/optimistic messages:** Local pending bubble before server confirm.

Service functions: `sendMessage`, `subscribeToMessages`, `loadMoreMessages`,
`markMessagesAsRead`, `updateMessageStatus`, `addReaction`, `removeReaction`,
`toggleStarMessage`, `deleteMessageForUser`, `updateTypingStatus`,
`subscribeToTypingIndicator`.

### 3.4 Voice Notes
- **Record:** Hold-to-record voice notes with a recording bar UI and duration.
- **Upload:** Stored in Supabase `voice-notes/{chatId}/{messageId}.m4a`.
- **Playback:** In-bubble player with progress, play/pause, caching.

Hooks: `useVoiceRecorder`, `useVoicePlayback`, `useVoiceNoteCache`.
Components: `VoiceRecordingBar`, `VoiceNotePlayer`.

### 3.5 Group Chat
- **Create group:** Name, optional avatar/description, participant list; creator is admin.
- **Group info:** Update name/avatar/description.
- **Membership:** Add participants, remove participant, leave group.
- **Admin roles:** Promote to admin, demote admin, check admin status, list admins.

Service functions: `createGroupChat`, `generateGroupChatId`, `updateGroupInfo`,
`addParticipantsToGroup`, `removeParticipantFromGroup`, `leaveGroup`,
`makeParticipantAdmin`, `removeAdminStatus`, `isUserAdmin`, `getGroupAdmins`.

### 3.6 Status / Stories
- **Create status:** Image, video, or text (with background color & caption).
- **24-hour expiry:** `expiresAt = createdAt + 24h`; expired statuses filtered/auto-deleted.
- **View statuses:** Story viewer with progress bars; mark as viewed (`viewedBy`).
- **Status list:** Own statuses + contact statuses, with "unviewed" rings.
- **Delete status.**

Service functions: `createStatus`, `deleteStatus`, `markStatusAsViewed`, `getMyStatuses`,
`getContactStatuses`, `getUserStatuses`, `getStatusById`, `subscribeToMyStatuses`,
`subscribeToContactStatuses`, `isStatusExpired`, `filterExpiredStatuses`,
`getStatusExpirationTime`.
Components: `StatusRing`, `StatusRow`, `StatusProgressBar`.

### 3.7 Voice & Video Calls
- **Initiate call:** Voice or video; creates a call doc and an Agora channel.
- **Signaling:** Real-time incoming-call subscription, accept/decline/end/miss flows.
- **In-call UI:** Video views, voice-call view, call controls (mute, speaker, camera flip,
  end), call status display, incoming-call overlay.
- **Call history:** Log of past calls with profiles, type, status, and duration.
- **Duration:** Calculated and formatted (mm:ss).

Service functions: `createCall`, `getCallById`, `updateCallStatus`, `acceptCall`,
`declineCall`, `endCall`, `missCall`, `subscribeToIncomingCalls`, `subscribeToCallStatus`,
`getCallHistory`, `generateChannelName`, `getAgoraAppId`, `calculateCallDuration`,
`formatCallDuration`; signaling: `callSignaling` manager, `useCallSignaling`,
`acceptIncomingCall`, `declineIncomingCall`, `endActiveCall`, `cleanupCallSignaling`.

### 3.8 Push Notifications
- FCM token capture on the user profile (`fcmToken`).
- Notifications for new messages, calls, and status (config via `expo-notifications`).

### 3.9 Settings & Profile
- View/edit profile (name, about, avatar).
- Language selection (EN/FR).
- QR code modal for sharing/adding contacts.
- Privacy/account actions (logout, etc.).

### 3.10 Media Storage
- Upload helpers for avatars, chat media, voice notes, and status media; delete helpers;
  public URL resolution; video thumbnail generation.

Service functions: `uploadFileFromUri`, `uploadFile`, `uploadAvatar(FromUri)`,
`uploadChatMedia(FromUri)`, `uploadVoiceNote(FromUri)`, `uploadStatusMedia(FromUri)`,
`deleteFile`, `deleteAvatar`, `deleteStatusMedia`, `getPublicUrl`.

---

## 4. External Interface Requirements

### 4.1 User Interfaces (Screens / Navigation)
File-based routing via Expo Router.

**Auth group `app/(auth)/`:**
- `welcome.tsx` — onboarding slides
- `phone.tsx` — phone number entry
- `otp.tsx` — OTP verification
- `profile-setup.tsx` — name + avatar

**Tabs group `app/(tabs)/`:**
- `chats/index.tsx`, `chats/[id].tsx` — chat list + chat room
- `status/index.tsx` — status list
- `calls/index.tsx` — call history
- `settings/index.tsx` — settings

**Stack/modal routes `app/`:**
- `index.tsx` — entry/auth router
- `call/[callId].tsx` — active call screen
- `group/[chatId].tsx` — group info/management
- `profile/[userId].tsx` — user profile
- `new-chat.tsx`, `new-group.tsx` — start chat/group
- `status/create.tsx`, `status/view/[userId].tsx` — create/view status

**Component library (`components/`):** `ui/` design-system primitives (Avatar, Badge,
Button, Divider, Input, Skeleton, ImageViewer, VideoViewer); `chat/`, `call/`, `status/`
domain components; `QRCodeModal`.

### 4.2 Hardware Interfaces
- Camera (photos/video, video calls).
- Microphone (voice notes, calls).
- Device contacts.
- Photo library / media library.
- Location services.

### 4.3 Software Interfaces (Third-Party Services)
| Service | Role | Integration |
|---------|------|-------------|
| Firebase Auth | Phone/OTP authentication, session | `firebase` SDK, reCAPTCHA |
| Cloud Firestore | Real-time data (users, chats, messages, statuses, calls) | `firebase/firestore` |
| Supabase Storage | Media files (avatars, chat media, voice notes, statuses) | `@supabase/supabase-js` |
| Agora | Real-time voice/video calling | `react-native-agora` |
| Expo Notifications | Push notifications | `expo-notifications` |

### 4.4 Communications Interfaces
- HTTPS to Firebase/Supabase REST & realtime endpoints.
- Firestore real-time `onSnapshot` listeners.
- Agora RTC media channels.

---

## 5. Data Requirements (Data Model)

### 5.1 Firestore Collections

**`users/{userId}`**
- uid, phone (E.164), displayName, about, avatarUrl, language (`en|fr`), isOnline,
  lastSeen, fcmToken, contacts[] (registered userIds), createdAt.

**`chats/{chatId}`**
- type (`direct|group`), participants[], createdBy, createdAt,
  lastMessage {text, senderId, type, timestamp}, unreadCount {userId:number}.
- Group-only: groupName, groupAvatarUrl, groupDescription, admins[].

**`chats/{chatId}/messages/{messageId}`**
- id, senderId, type (`text|image|video|audio|document|location`), text?, mediaUrl?,
  mediaThumbnail?, audioDuration?, fileName?, fileSize?, location {lat,lng,label}?,
  replyTo {messageId,senderId,text,type}?, reactions {userId:emoji},
  status (`sending|sent|delivered|read`), readBy[], deletedFor[], isStarred, timestamp.

**`statuses/{statusId}`**
- userId, type (`image|video|text`), mediaUrl?, text?, backgroundColor?, caption?,
  viewedBy[], expiresAt (createdAt+24h), createdAt.

**`calls/{callId}`**
- callerId, receiverId, type (`voice|video`),
  status (`ringing|ongoing|ended|missed|declined`), agoraChannelName?, agoraToken?,
  startedAt?, endedAt?, createdAt.

### 5.2 Supabase Storage Buckets
| Bucket | Path | Contents |
|--------|------|----------|
| `avatars` | `{userId}.jpg` | Profile pictures |
| `chat-media` | `{chatId}/{messageId}.{jpg,mp4,pdf}` + `_thumb.jpg` | Images, videos, documents, thumbnails |
| `voice-notes` | `{chatId}/{messageId}.m4a` | Voice messages |
| `statuses` | `{userId}/{statusId}.{jpg,mp4}` | Status media (24h) |

### 5.3 Key TypeScript Types
Enums/unions: `MessageType`, `ChatType`, `CallType`, `CallStatus`, `MessageStatus`,
`StatusType`, `AppLanguage`. Interfaces: `User`, `UserProfile`, `Chat`, `LastMessage`,
`Message`, `ReplyReference`, `LocationData`, `Status`, `StatusGroup`, `Call`, `CallLog`,
`Contact`, plus navigation/form/API helper types and a Firestore timestamp converter.

### 5.4 Indexing
- Composite index on `chats`: `participants` (array-contains) + `lastMessage.timestamp` (desc).

---

## 6. Security Requirements

### 6.1 Authentication & Authorization
- Phone-number + OTP authentication (Firebase).
- Session persistence via AsyncStorage.

### 6.2 Firestore Security Rules
- **users:** read by any authenticated user; write only by the owner (`uid == userId`).
- **chats:** read/update only by participants; create only if creator is a participant.
- **messages:** read/create only by chat participants.

### 6.3 Storage Policies
- All buckets require authentication.
- Users may only upload to paths containing their own `userId`.
- Chat media readable only by chat participants; status media readable by contacts only.

### 6.4 Privacy & Permissions
Declared platform permissions: Camera, Microphone, Contacts, Photo Library,
(Android) external storage + POST_NOTIFICATIONS. Each has a usage description string.

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Optimized list rendering; pagination for messages.
- Designed to work on mobile data ("crystal-clear calls even on mobile data").
- Media caching (voice note cache, image cache via expo-image).
- Skeleton loading states on every screen.

### 7.2 Usability
- Familiar WhatsApp-like UX; minimal, clean UI.
- Bilingual (EN/FR); culturally relevant copy and theming.
- Haptic feedback (expo-haptics).

### 7.3 Reliability
- Try/catch around all backend calls with surfaced error states.
- Listener cleanup on unmount to prevent leaks.
- Optimistic/pending messages for resilience.

### 7.4 Maintainability
- Strict TypeScript, modular `lib/` services, Zustand stores, reusable hooks & components,
  centralized design tokens and i18n.

### 7.5 Portability
- Single codebase for iOS and Android (Expo); web bundler configured.

### 7.6 Localization
- i18n (`i18n-js`) with EN and FR translation trees covering tabs, common, onboarding,
  auth, and all feature copy.

---

## 8. Design System (Reference)

### 8.1 Colors (constants/Colors.ts)
- Primary: `#1034A6` (Egyptian Blue); primaryLight `#3D5FC4`; primaryDark `#0A2070`.
- Backgrounds: background `#FFFFFF`, surface `#F7F8FC`, surfaceAlt `#EDEEF5`.
- Text: textPrimary `#0D0D0D`, textSecondary `#6B7280`, textInverse `#FFFFFF`.
- Bubbles: sent `#1034A6` / received `#F0F2FF`.
- Semantic: success `#22C55E`, warning `#F59E0B`, error `#EF4444`, info `#3B82F6`,
  accent `#10B981`.
- Cameroonian flag accents: green `#007A5E`, red `#CE1126`, yellow `#FCD116`.

### 8.2 Typography & Spacing
- Inter font family (`@expo-google-fonts/inter`).
- Centralized scales in `constants/Typography.ts` and `constants/Spacing.ts`.
- Icons via `@expo/vector-icons`.

---

## 9. Technology Stack

### 9.1 Core
- Expo SDK ~54, Expo Router ~6, React Native 0.81.5, React 19.1, TypeScript ~5.9 (strict).
- State: Zustand. Animations: Reanimated + Worklets. Gestures: Gesture Handler.
- UI: expo-image, @gorhom/bottom-sheet, react-native-svg, react-native-qrcode-svg.

### 9.2 Backend & Media
- Firebase (auth, firestore), Supabase JS, base64-arraybuffer.
- Agora (`react-native-agora`).

### 9.3 Device & Media APIs
- expo-camera, expo-av, expo-image-picker, expo-document-picker, expo-media-library,
  expo-video-thumbnails, expo-location, expo-contacts, expo-clipboard, expo-haptics,
  expo-notifications, expo-file-system.

### 9.4 i18n & Phone
- i18n-js, react-native-phone-number-input, expo-firebase-recaptcha.

### 9.5 Tooling / Build
- EAS Build (`eas.json`), Babel preset Expo, app config in `app.json`,
  Firebase config in `firebase.json`, env via `.env` (see `.env.example`).

---

## 10. Project Structure (Reference)
```
project/
├── master_prompt.md                # Original build specification
└── camchat/
    ├── app/                        # Expo Router screens (auth, tabs, stack routes)
    ├── components/                 # ui/, chat/, call/, status/ + QRCodeModal
    ├── constants/                  # Colors, Spacing, Typography
    ├── hooks/                      # useAuth, useChat, useMessages, useCall,
    │                               #   useStatus, useContacts, useVoice* ...
    ├── lib/                        # firebase, auth, chat, messages, calls,
    │                               #   callSignaling, status, contacts, storage,
    │                               #   supabase, firestore, i18n
    ├── store/                      # authStore, chatStore, callStore, statusStore
    ├── types/                      # index.ts (shared types)
    ├── utils/                      # formatters, formatTime, formatFileSize, getInitials
    ├── assets/                     # icons, splash
    ├── app.json / eas.json / firebase.json
    ├── firestore.rules / firestore.indexes.json
    ├── .env.example
    └── package.json / tsconfig.json
```

---

## 11. Build Phases (Development Roadmap)
The app was built incrementally; each phase fully working before the next:
1. **Project Scaffolding & Design System** — tokens, constants, base UI components.
2. **Onboarding & Authentication** — welcome slides, phone/OTP, profile setup.
3. **Chat List & Contact Sync** — chat list, device contact matching.
4. **Chat Room (Text + Media Messages)** — real-time messaging, attachments.
5. **Voice Notes** — record/upload/playback.
6. **Group Chat** — creation, membership, admin roles.
7. **Status / Stories** — 24-hour image/video/text statuses.
8. **Voice & Video Calls** — Agora integration, signaling, call history.
9. **Push Notifications** — FCM integration.
10. **Settings & Profile Polish** — settings, profile, QR sharing, final polish.

---

## 12. Cameroonian Cultural Identity (Cross-Cutting)
- Egyptian Blue brand + Cameroonian flag accent palette.
- Bilingual EN/FR defaulting to local official languages.
- +237 default country code.
- Culturally aware onboarding copy, empty states, default "about" text ("Hey, I'm on CamChat 🦁"),
  and sound design.

---

## 13. Configuration / Environment Variables
From `.env.example`:
- **Firebase:** `EXPO_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `DATABASE_URL`, `PROJECT_ID`,
  `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`.
- **Supabase:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **Agora:** `EXPO_PUBLIC_AGORA_APP_ID` (fallback default present in code).

---

## 14. Suggested SRS Requirement Traceability (Starter)
| ID | Requirement (summary) | Source feature |
|----|------------------------|----------------|
| FR-1 | Authenticate users via phone + OTP | 3.1 |
| FR-2 | Create/edit user profile | 3.1 / 3.9 |
| FR-3 | Sync device contacts to find users | 3.2 |
| FR-4 | List chats in real time sorted by recency | 3.2 |
| FR-5 | Send/receive text & media messages in real time | 3.3 |
| FR-6 | Reply, react, star, delete messages | 3.3 |
| FR-7 | Show typing & read receipts | 3.3 |
| FR-8 | Record/play voice notes | 3.4 |
| FR-9 | Create/manage group chats with admin roles | 3.5 |
| FR-10 | Post/view 24-hour statuses | 3.6 |
| FR-11 | Make voice/video calls with history | 3.7 |
| FR-12 | Receive push notifications | 3.8 |
| FR-13 | Manage settings, language, QR sharing | 3.9 |
| NFR-1 | Strict TS, design tokens, i18n enforced | 2.5 / 7.4 |
| NFR-2 | Skeleton loading states on every screen | 2.5 / 7.1 |
| NFR-3 | Enforce Firestore/Storage security rules | 6 |
| NFR-4 | Work on mobile data; cache media | 7.1 |

---

*Document generated from repository inspection of `camchat/` and `master_prompt.md`.*
