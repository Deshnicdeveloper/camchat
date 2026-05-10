# CamChat — Master Claude Code Build Prompt

## Project Identity
- **App Name:** CamChat
- **Concept:** A WhatsApp-style real-time messaging app built for a Cameroonian audience
- **Framework:** React Native with Expo (managed workflow, using expo-dev-client for native modules)
- **Language:** TypeScript (strict mode)
- **Design Identity:** Clean, minimal WhatsApp-like UI with Egyptian Blue as the primary color

---


---

## Role
You are an elite full-stack mobile engineer and UI/UX designer specializing in React Native and 
Expo applications. You have deep expertise in real-time systems, Firebase architecture, and 
building production-grade mobile apps with exceptional user experience. You are also culturally 
aware and understand how to embed regional identity into a digital product without it feeling 
forced or superficial.

---

## Task
Your task is to build **CamChat** — a full-featured, production-ready real-time messaging mobile 
application built with React Native and Expo. You will build this application phase by phase, 
completing each phase fully before moving to the next. Each phase must be functional, tested, 
and free of TypeScript errors before proceeding.

---

## App Description
CamChat is a WhatsApp-inspired messaging app built for a Cameroonian audience. It combines the 
familiar, proven UX patterns of WhatsApp — real-time 1-on-1 and group messaging, 24-hour 
status/stories, voice notes, and voice/video calling — with a distinct Cameroonian cultural 
identity. The app uses **Egyptian Blue (#1034A6)** as its primary brand color, supports both 
English and French (Cameroon's two official languages), defaults to the +237 country code, and 
weaves in subtle Cameroonian cultural references across the onboarding experience, empty states, 
default copy, and sound design. CamChat is not a clone — it is a culturally rooted communication 
tool that feels like it was built specifically for and by Cameroonians.

---

## Constraints
- Build **phase by phase** in the exact order defined in this prompt. Do not skip ahead.
- Every phase must be **fully working** before the next begins — no placeholder logic, no 
  commented-out code, no TODOs left unresolved between phases.
- Use **TypeScript strict mode** throughout. Zero use of the `any` type.
- Follow the **design system exactly** as specified — colors, typography, spacing, and radius 
  values must be pulled from the constants files, never hardcoded inline.
- All user-facing strings must go through the **i18n utility** — no hardcoded English or French 
  text in components.
- All Firebase interactions must be **wrapped in try/catch** with proper error states surfaced 
  to the user.
- Never use React Native's built-in `<Image>` component — always use `expo-image`.
- All Firestore `onSnapshot` listeners must be **cleaned up** on component unmount.
- Do not install any package not listed in the Tech Stack unless explicitly necessary, and 
  state the reason before doing so.
- Every screen must have a **loading skeleton state** — no raw spinners.
- The app must run correctly on both **iOS and Android**.

----------
## Design System (Use These Values Everywhere)

### Colors
```ts
const Colors = {
  primary: '#1034A6',           // Egyptian Blue — main brand color
  primaryLight: '#3D5FC4',      // Lighter blue for hover/pressed states
  primaryDark: '#0A2070',       // Darker blue for headers/navigation bars
  primaryFaded: '#1034A615',    // 8% opacity blue for backgrounds/chips

  background: '#FFFFFF',        // App background
  surface: '#F7F8FC',           // Card/input background
  surfaceAlt: '#EDEEF5',        // Dividers, skeleton loaders

  textPrimary: '#0D0D0D',       // Main text
  textSecondary: '#6B7280',     // Subtitles, timestamps, placeholders
  textInverse: '#FFFFFF',       // Text on blue backgrounds

  bubble_sent: '#1034A6',       // Sent message bubble (Egyptian Blue)
  bubble_received: '#F0F2FF',   // Received message bubble (very light blue)
  bubble_sent_text: '#FFFFFF',
  bubble_received_text: '#0D0D0D',

  success: '#22C55E',           // Online indicator, delivered ticks
  warning: '#F59E0B',
  error: '#EF4444',

  divider: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.45)',

  // Cameroonian flag accent palette (used sparingly in onboarding/illustrations)
  cam_green: '#007A5E',
  cam_red: '#CE1126',
  cam_yellow: '#FCD116',
}
```

### Typography
```ts
const Typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  }
}
```

### Spacing & Radius
```ts
const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 }
const Radius  = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 }
```

### Icon Library
Use `@expo/vector-icons` (Ionicons + MaterialCommunityIcons). Never use emoji as UI icons.

---

## Tech Stack (Install All of These)

| Category              | Package                                               |
|-----------------------|-------------------------------------------------------|
| Navigation            | expo-router v3                                        |
| Auth                  | firebase (phone auth)                                 |
| Database              | firebase/firestore                                    |
| Storage               | @supabase/supabase-js (Supabase Storage)              |
| Push Notifications    | expo-notifications + firebase cloud messaging         |
| Audio Record/Play     | expo-av                                               |
| Image Picker          | expo-image-picker                                     |
| Contacts              | expo-contacts                                         |
| Camera                | expo-camera                                           |
| Video Calling         | react-native-agora (Agora.io)                         |
| State Management      | zustand                                               |
| Async Storage         | @react-native-async-storage/async-storage             |
| Animations            | react-native-reanimated + react-native-gesture-handler|
| Bottom Sheet          | @gorhom/bottom-sheet                                  |
| Image Display         | expo-image                                            |
| Phone Input           | react-native-phone-number-input                       |
| Waveform              | react-native-audio-waveform                           |
| Date Utils            | date-fns                                              |
| Fonts                 | @expo-google-fonts/inter                              |

---

## Firebase Data Architecture

### Collection: `users`
users/{userId}
├── uid: string
├── phone: string                    // E.164 format e.g. +237XXXXXXXXX
├── displayName: string
├── about: string                    // default: "Hey, I'm on CamChat 🦁"
├── avatarUrl: string
├── language: 'en' | 'fr'           // Cameroon bilingual
├── isOnline: boolean
├── lastSeen: Timestamp
├── fcmToken: string                 // for push notifications
├── contacts: string[]              // array of registered userIds from phone contacts
└── createdAt: Timestamp

### Collection: `chats`
chats/{chatId}
├── type: 'direct' | 'group'
├── participants: string[]          // array of userIds
├── createdBy: string               // userId
├── createdAt: Timestamp
├── lastMessage: {
│     text: string,
│     senderId: string,
│     type: MessageType,
│     timestamp: Timestamp
│   }
├── unreadCount: { [userId]: number }
│
│ // Group-only fields
├── groupName?: string
├── groupAvatarUrl?: string
└── groupDescription?: string

### Subcollection: `chats/{chatId}/messages`
messages/{messageId}
├── id: string
├── senderId: string
├── type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location'
├── text?: string
├── mediaUrl?: string               // Supabase Storage URL
├── mediaThumbnail?: string         // for video
├── audioDuration?: number          // seconds, for voice notes
├── fileName?: string               // for documents
├── fileSize?: number               // bytes
├── location?: { lat: number, lng: number, label: string }
├── replyTo?: {
│     messageId: string,
│     senderId: string,
│     text: string,
│     type: MessageType
│   }
├── reactions: { [userId]: string } // emoji reactions
├── status: 'sending' | 'sent' | 'delivered' | 'read'
├── readBy: string[]                // userIds
├── deletedFor: string[]            // userIds (soft delete)
├── isStarred: boolean
└── timestamp: Timestamp

### Collection: `statuses`
statuses/{statusId}
├── userId: string
├── type: 'image' | 'video' | 'text'
├── mediaUrl?: string
├── text?: string
├── backgroundColor?: string       // for text statuses
├── caption?: string
├── viewedBy: string[]             // userIds
├── expiresAt: Timestamp           // createdAt + 24 hours
└── createdAt: Timestamp

### Collection: `calls`
calls/{callId}
├── callerId: string
├── receiverId: string
├── type: 'voice' | 'video'
├── status: 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined'
├── agoraChannelName?: string      // Agora.io channel name
├── agoraToken?: string            // Agora.io token for authentication
├── startedAt?: Timestamp
├── endedAt?: Timestamp
└── createdAt: Timestamp

---

## Supabase Storage Architecture

### Buckets

**`avatars`** — User profile pictures
```
avatars/
└── {userId}.jpg
```

**`chat-media`** — Images, videos, and documents sent in chats
```
chat-media/
└── {chatId}/
    ├── {messageId}.jpg          // Images
    ├── {messageId}.mp4          // Videos
    ├── {messageId}_thumb.jpg    // Video thumbnails
    └── {messageId}.pdf          // Documents
```

**`voice-notes`** — Audio messages
```
voice-notes/
└── {chatId}/
    └── {messageId}.m4a
```

**`statuses`** — Status/story media (auto-deleted after 24hrs)
```
statuses/
└── {userId}/
    └── {statusId}.jpg|mp4
```

### Storage Policies
- All buckets require authentication
- Users can only upload to paths containing their own `userId`
- Users can read files from chats they are participants in
- Status files are readable by contacts only

---

## App Folder Structure
camchat/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx              // Onboarding slides
│   │   ├── phone.tsx                // Phone number entry
│   │   ├── otp.tsx                  // OTP verification
│   │   └── profile-setup.tsx        // Name + avatar
│   ├── (tabs)/
│   │   ├── _layout.tsx              // Bottom tab navigator
│   │   ├── chats/
│   │   │   ├── index.tsx            // Chat list
│   │   │   └── [chatId].tsx         // Chat room
│   │   ├── status/
│   │   │   └── index.tsx            // Status list
│   │   ├── calls/
│   │   │   └── index.tsx            // Call log
│   │   └── settings/
│   │       └── index.tsx            // Settings
│   ├── call/
│   │   └── [callId].tsx             // Full-screen call screen
│   ├── status/
│   │   └── view/[userId].tsx        // Full-screen status viewer
│   ├── new-chat.tsx                 // Contact picker for new chat
│   ├── new-group.tsx                // Group creation
│   ├── profile/[userId].tsx         // View any user profile
│   └── _layout.tsx                  // Root layout
├── components/
│   ├── ui/                          // Reusable base components
│   │   ├── Button.tsx
│   │   ├── Avatar.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Divider.tsx
│   │   └── LoadingSpinner.tsx
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── VoiceNoteRecorder.tsx
│   │   ├── VoiceNotePlayer.tsx
│   │   ├── MediaMessage.tsx
│   │   ├── ReplyPreview.tsx
│   │   └── TypingIndicator.tsx
│   ├── status/
│   │   ├── StatusRing.tsx
│   │   ├── StatusCard.tsx
│   │   └── StatusProgressBar.tsx
│   └── onboarding/
│       ├── OnboardingSlide.tsx
│       └── PaginationDots.tsx
├── lib/
│   ├── firebase.ts                  // Firebase init (Auth + Firestore)
│   ├── firestore.ts                 // Firestore helpers
│   ├── supabase.ts                  // Supabase init (Storage)
│   └── storage.ts                   // Supabase Storage helpers
├── store/
│   ├── authStore.ts                 // Zustand: current user
│   ├── chatStore.ts                 // Zustand: chats + messages
│   ├── statusStore.ts               // Zustand: statuses
│   └── callStore.ts                 // Zustand: active call state
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   ├── useContacts.ts
│   ├── useStatus.ts
│   └── useCall.ts
├── constants/
│   ├── Colors.ts
│   ├── Typography.ts
│   └── Spacing.ts
├── types/
│   └── index.ts                     // All TypeScript interfaces
├── utils/
│   ├── formatTime.ts
│   ├── formatFileSize.ts
│   └── getInitials.ts
└── assets/
├── fonts/
├── images/
│   ├── onboarding-1.png
│   ├── onboarding-2.png
│   ├── onboarding-3.png
│   └── logo.png
└── sounds/
└── notification.mp3         // Balafon-inspired ping

---

## TypeScript Types (types/index.ts)

```ts
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location'
export type ChatType = 'direct' | 'group'
export type CallType = 'voice' | 'video'
export type CallStatus = 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'
export type StatusType = 'image' | 'video' | 'text'
export type AppLanguage = 'en' | 'fr'

export interface User {
  uid: string
  phone: string
  displayName: string
  about: string
  avatarUrl: string
  language: AppLanguage
  isOnline: boolean
  lastSeen: Date
  fcmToken: string
  contacts: string[]
  createdAt: Date
}

export interface Chat {
  id: string
  type: ChatType
  participants: string[]
  createdBy: string
  createdAt: Date
  lastMessage: LastMessage
  unreadCount: Record<string, number>
  groupName?: string
  groupAvatarUrl?: string
  groupDescription?: string
}

export interface LastMessage {
  text: string
  senderId: string
  type: MessageType
  timestamp: Date
}

export interface Message {
  id: string
  senderId: string
  type: MessageType
  text?: string
  mediaUrl?: string
  mediaThumbnail?: string
  audioDuration?: number
  fileName?: string
  fileSize?: number
  location?: { lat: number; lng: number; label: string }
  replyTo?: ReplyReference
  reactions: Record<string, string>
  status: MessageStatus
  readBy: string[]
  deletedFor: string[]
  isStarred: boolean
  timestamp: Date
}

export interface ReplyReference {
  messageId: string
  senderId: string
  text: string
  type: MessageType
}

export interface Status {
  id: string
  userId: string
  type: StatusType
  mediaUrl?: string
  text?: string
  backgroundColor?: string
  caption?: string
  viewedBy: string[]
  expiresAt: Date
  createdAt: Date
}

export interface Call {
  id: string
  callerId: string
  receiverId: string
  type: CallType
  status: CallStatus
  agoraChannelName?: string
  agoraToken?: string
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
}
```

---

## Build Phases

---

### PHASE 1 — Project Scaffolding & Design System

**Goal:** A running Expo app with all dependencies installed, the design system configured, fonts loaded, and navigation structure in place. No features yet — just the skeleton.

**Steps:**
1. Create new Expo project: `npx create-expo-app camchat --template blank-typescript`
2. Install all packages listed in the Tech Stack table above
3. Configure `expo-dev-client` (required for Agora.io and expo-contacts native modules)
4. Create `app.json` with:
   - App name: CamChat
   - Slug: camchat
   - Bundle ID: com.camchat.app
   - Primary color: #1034A6
   - Splash screen: Egyptian Blue background, white logo centered
   - Permissions: CAMERA, MICROPHONE, READ_CONTACTS, NOTIFICATIONS
5. Create all files under `constants/` (Colors.ts, Typography.ts, Spacing.ts) using the exact values defined in the Design System section above
6. Create all files under `types/index.ts` with all interfaces defined above
7. Set up Inter font loading in root `_layout.tsx` using `@expo-google-fonts/inter`
8. Create the full folder structure under `app/` as defined above (empty files with placeholder exports)
9. Configure expo-router with the tab navigator in `(tabs)/_layout.tsx`
   - 4 tabs: Chats, Status, Calls, Settings
   - Active tab color: Egyptian Blue (#1034A6)
   - Tab icons: Ionicons — chatbubbles-outline, radio-outline, call-outline, settings-outline
10. Initialize Firebase project (Firestore, Auth) and create `lib/firebase.ts` with config
11. Initialize Supabase project (Storage) and create `lib/supabase.ts` with config

**Deliverable:** App launches, shows bottom tabs, fonts load correctly, no TypeScript errors.

---

### PHASE 2 — Onboarding & Authentication

**Goal:** Full onboarding flow — 3 welcome slides → phone entry → OTP → profile setup → lands on Chats tab.

**Onboarding Slides Content:**

*Slide 1*
- Illustration: Two Cameroonian-style character silhouettes chatting, speech bubbles with Egyptian Blue
- Title: "Chat Like You're Home"
- Subtitle: "Send messages, voice notes, and media to friends and family across Cameroon and the world."

*Slide 2*
- Illustration: A phone with a status ring and a 24hr timer arc
- Title: "Share Your Moments"
- Subtitle: "Post photos, videos, and text statuses that last 24 hours. See what your people are up to."

*Slide 3*
- Illustration: A video call frame showing two faces
- Title: "Face to Face, Anywhere"
- Subtitle: "Crystal-clear voice and video calls, even on mobile data. Stay close no matter the distance."

**Onboarding UI Rules:**
- Full-screen slides with a large illustration taking the top 55% of the screen
- Egyptian Blue gradient background (primaryDark → primary) on slide backgrounds
- White text on blue background
- Pagination dots at the bottom (filled dot = active, outline dot = inactive)
- "Next" button: white, rounded pill, full-width
- Last slide has "Get Started" button instead
- Skip button top-right on slides 1 and 2

**Phone Screen:**
- Country picker pre-selected to 🇨🇲 +237
- White card on Egyptian Blue background
- Numeric keyboard auto-opens
- "We'll send you a verification code" subtitle text
- "Continue" button disabled until valid phone length is entered

**OTP Screen:**
- 6 individual digit input boxes, Egyptian Blue border when focused
- Auto-advance focus to next box on digit entry
- 60-second resend countdown timer
- "Resend Code" link appears after timer expires

**Profile Setup Screen:**
- Circular avatar picker (camera icon overlay on empty state)
- Display name text input
- About/bio input (pre-filled with "Hey, I'm on CamChat 🦁")
- "Done" button saves to Firestore `users` collection and routes to `(tabs)/chats`

**Auth Logic:**
- Use Firebase Phone Auth with `signInWithPhoneNumber`
- On successful auth, check if user document exists in Firestore
- If exists → skip onboarding, go directly to tabs
- If not exists → go to profile setup
- Store user session in `authStore` (Zustand)
- Persist session with AsyncStorage

**Deliverable:** Complete working auth flow, user saved to Firestore, session persists on app restart.

---

### PHASE 3 — Chat List & Contact Sync

**Goal:** Chats tab shows all conversations. User can start a new chat from their contacts.

**Chat List Screen:**
- Header: "CamChat" in Egyptian Blue bold, with icons for search (magnifier) and new chat (pencil)
- Each chat row:
  - Avatar (with online green dot if isOnline = true)
  - Display name (bold)
  - Last message preview (grey, truncated to 1 line) — show "📷 Photo", "🎤 Voice note", "📹 Video" for media types
  - Timestamp top-right (show time if today, day name if this week, date otherwise)
  - Unread count badge (Egyptian Blue circle with white count number)
- Swipe left on a chat row to reveal: Archive, Mute, Delete actions
- Empty state: Egyptian Blue icon + "No chats yet. Tap ✏️ to start a conversation."

**Contact Sync Logic:**
1. On first load, request contacts permission via `expo-contacts`
2. Read device contacts, extract all phone numbers
3. Normalize all numbers to E.164 format (+237 prefix for local Cameroonian numbers without country code)
4. Query Firestore `users` collection where `phone` is in the normalized list (batch in groups of 10 due to Firestore `in` limit)
5. Save matched userIds to current user's `contacts` array in Firestore
6. Cache contact list locally in Zustand `chatStore`

**New Chat Screen:**
- Searchable list of synced contacts
- Each contact row: avatar, name, phone number, "Message" button
- Tapping a contact checks if a direct chat already exists between the two users
- If exists → navigate to that chat room
- If not → create new chat document in Firestore, then navigate

**Real-time Chat List:**
- Use Firestore `onSnapshot` on `chats` collection where `participants` array contains current userId
- Sort by `lastMessage.timestamp` descending
- Update Zustand `chatStore` on every snapshot change

**Deliverable:** Chat list renders live, contacts are synced, new chats can be started.

---

### PHASE 4 — Chat Room (Text + Media Messages)

**Goal:** Full 1-on-1 chat room with text, image, and file messages. Real-time delivery and read receipts.

**Chat Room Header:**
- Back arrow
- Contact avatar + name
- "Online" or last seen timestamp below name
- Icons: video call, voice call, more (three dots)

**Message List:**
- FlatList inverted (newest messages at bottom)
- Date separator chips between messages from different days: "Today", "Yesterday", "12 May 2025"
- Sent bubbles: right-aligned, Egyptian Blue, white text, white tick icons
- Received bubbles: left-aligned, very light blue (#F0F2FF), dark text
- Bubble tail: right-pointing for sent, left-pointing for received
- Timestamp inside each bubble, bottom-right corner, small grey text
- Message status icons (sent bubble only):
  - Single grey tick: sent
  - Double grey tick: delivered
  - Double Egyptian Blue tick: read
- Tap and hold on any message to show: Reply, React, Star, Copy, Delete options (bottom sheet)
- Swipe right on a message to trigger reply (shows reply preview above input)
- Emoji reaction bar (6 emojis: 👍 ❤️ 😂 😮 😢 🙏) on long press

**Message Input Bar:**
- Sticky to keyboard (KeyboardAvoidingView)
- Left: attachment icon (opens bottom sheet with: Camera, Gallery, Document, Location)
- Center: text input, multi-line, auto-grows up to 5 lines, pill shaped
- Right: when input is empty → microphone icon (voice note); when typing → send button (Egyptian Blue)
- Emoji picker toggle (smiley face icon)

**Image Messages:**
- Tapping opens full-screen image viewer with pinch-to-zoom
- Shows download button top-right

**Sending Logic:**
1. User types and taps send → message immediately appears in UI with `status: 'sending'`
2. Write to Firestore `chats/{chatId}/messages` → status updates to `sent`
3. Update `chats/{chatId}` document with `lastMessage` and increment receiver's `unreadCount`
4. When receiver opens chat → mark all messages as `read`, reset their `unreadCount` to 0
5. Update `readBy` array on each message → sender sees blue double ticks

**Typing Indicator:**
- Write `isTyping: { [userId]: boolean }` to the chat document when user is typing (debounced 1s)
- Receiver sees animated three-dot bubble (like WhatsApp)

**Deliverable:** Full real-time chat with text and images, working read receipts and typing indicator.

---

### PHASE 5 — Voice Notes

**Goal:** Record, send, and play back voice notes with waveform visualization.

**Recording UX:**
- User presses and holds the microphone icon
- Haptic feedback on press start
- Input bar transforms into a recording bar showing:
  - Red animated recording dot
  - Recording duration timer (MM:SS)
  - Waveform visualization (animated bars reacting to mic input level)
  - "Slide to cancel" hint text with left arrow
- Swipe left on the bar → cancel recording (no send)
- Swipe up → lock recording (release finger, recording continues hands-free, send button appears)
- Release finger (without swiping) → stop and send

**Sending a Voice Note:**
1. Stop recording → get audio file URI from `expo-av`
2. Upload file to Supabase Storage bucket `voice-notes` at path `{chatId}/{messageId}.m4a`
3. Create message document with `type: 'audio'`, `mediaUrl`, `audioDuration`

**Voice Note Bubble:**
- Play/pause button (Egyptian Blue)
- Waveform bar visualization (pre-computed from file, bars highlight as audio plays)
- Duration text (shows remaining time during playback, total time when idle)
- Playback speed toggle: 1x → 1.5x → 2x (tap the speed badge)
- Sent bubbles: white waveform bars on Egyptian Blue
- Received bubbles: Egyptian Blue waveform bars on light background

**Playback Logic:**
- Use `expo-av` Audio object
- Only one voice note can play at a time — pause any currently playing note when another starts
- Audio continues playing if user scrolls away (message stays highlighted)
- Respect device silent mode toggle (same behavior as WhatsApp)

**Deliverable:** Full voice note record/send/play cycle working end-to-end.

---

### PHASE 6 — Group Chat

**Goal:** Create and participate in group chats.

**New Group Flow:**
1. Screen 1 — Add Participants:
   - Searchable contacts list
   - Selected contacts shown as avatar chips at top
   - "Next" button activates when ≥ 1 contact selected (max 256 participants)
2. Screen 2 — Group Info:
   - Group avatar picker (camera icon)
   - Group name input (required)
   - Group description input (optional)
   - "Create Group" button

**Group Chat Room differences from 1-on-1:**
- Sender name shown above each received bubble (in Egyptian Blue)
- Tapping sender name opens their profile
- Group header shows participant count: "CamChat Fam · 12 participants"
- Info icon in header opens Group Info screen
- Group Info screen shows:
  - Group avatar + name + description
  - Admin controls: Edit group info, Add participants, Remove participant
  - Leave Group option (red, bottom of screen)
  - Full participant list with admin badges

**Group Firestore Logic:**
- `type: 'group'` in the chat document
- `createdBy` is the group admin
- Add/remove participants updates the `participants` array
- All `unreadCount` logic applies per-user same as direct chats

**Deliverable:** Groups can be created, messages sent, participants managed.

---

### PHASE 7 — Status / Stories

**Goal:** Post and view 24-hour statuses exactly like WhatsApp Status.

**Status List Screen (Status Tab):**
- My Status row at top:
  - If no status → "+" icon, "Add Status" text
  - If has status → avatar with Egyptian Blue ring, "My Status", time of latest status
- Recent Updates section: contacts who have statuses (unseen = Egyptian Blue ring, seen = grey ring)
- Muted Updates section (collapsed by default)

**Adding a Status:**
- Tap "My Status" → bottom sheet with options: Camera, Gallery (Photo/Video), Text
- Text status: full-screen color picker (preset Cameroonian-palette backgrounds), large text input centered
- Photo/video: tap or gallery-picked, optional caption input at bottom
- "Post" button → upload to Supabase Storage bucket `statuses` → write to `statuses` collection with `expiresAt = now + 24hrs`

**Status Viewer (Full Screen):**
- Launched from tapping a contact's status ring
- Full-screen media display (like Instagram Stories)
- Progress bars at top (one segment per status item from this user)
- Auto-advance after each segment completes
- Tap right half to go forward, tap left half to go back
- Hold to pause
- Swipe down to dismiss
- Reply input bar at bottom ("Reply to [Name]'s status...") → sends a direct message
- View count shown (own status only): eye icon + number

**Expiry Logic:**
- Client-side: filter out statuses where `expiresAt < now` before rendering
- Cloud Function (or scheduled job): delete expired status documents from Firestore and associated files from Supabase Storage every hour

**Deliverable:** Full status post, view, auto-expire, and reply cycle working.

---

### PHASE 8 — Voice & Video Calls

**Goal:** Real-time voice and video calling via Agora.io.

**Agora.io Setup:**
- Create an Agora.io project in the Agora Console
- Obtain App ID and App Certificate
- Use Agora's token server (or Cloud Function) to generate temporary tokens for each call
- Install `react-native-agora` package

**Initiating a Call:**
- Tap voice/video call icon in chat room header
- Generate a unique channel name (e.g., `call_{callerId}_{receiverId}_{timestamp}`)
- Generate Agora token via backend/Cloud Function for both caller and receiver
- Write a `calls` document to Firestore with `status: 'ringing'`, `agoraChannelName`, `agoraToken`, caller and receiver IDs
- Navigate caller to the Call Screen and join the Agora channel

**Incoming Call:**
- Use Firestore `onSnapshot` to listen for new call documents where `receiverId` = current userId and `status = 'ringing'`
- Show full-screen incoming call UI (even if app is backgrounded — use push notification with high-priority FCM)
- Incoming call UI:
  - Blurred avatar of caller on full-screen background
  - Caller name large centered
  - "Voice Call" or "Video Call" label
  - Decline button (red, left) and Accept button (green, right)
  - Ringtone plays using `expo-av`

**Call Screen:**
- Use `react-native-agora` RtcEngine to manage the call
- Video call: local video feed small (bottom-right corner, draggable), remote video full-screen using AgoraView
- Voice call: large avatar centered on dark background
- Controls row at bottom:
  - Mute microphone toggle (`muteLocalAudioStream`)
  - Toggle camera (video only, `enableLocalVideo`)
  - Flip camera (video only, `switchCamera`)
  - Speaker toggle (`setEnableSpeakerphone`)
  - End call (red, `leaveChannel`)
- Timer showing call duration
- On end call: leave Agora channel, update `calls` document `status: 'ended'`, `endedAt: now`, navigate back

**Call Log Screen (Calls Tab):**
- Each row: contact avatar, name, call type icon (phone or video), direction arrow (incoming/outgoing), timestamp
- Missed calls shown in red
- Tap any row to call back

**Deliverable:** Full voice and video calling working through Agora.io channels.

---

### PHASE 9 — Push Notifications

**Goal:** Receive notifications for messages, calls, and status replies when app is backgrounded.

**Setup:**
1. Configure `expo-notifications` with FCM
2. Request notification permissions on app start
3. Save FCM token to Firestore `users/{userId}.fcmToken` on every app launch (tokens rotate)

**Notification Triggers (Firebase Cloud Functions):**
- New message → notify all participants except sender
- Incoming call → notify receiver (high-priority, heads-up)
- Status reply → notify status owner

**Notification Content by Type:**
| Trigger | Title | Body |
|---|---|---|
| Text message | Contact name | Message text preview |
| Image | Contact name | "📷 Photo" |
| Voice note | Contact name | "🎤 Voice note" |
| Incoming call | Contact name | "📞 Incoming voice call" |
| Video call | Contact name | "📹 Incoming video call" |
| Status reply | Contact name | "Replied to your status" |

**Notification Tap Behavior:**
- Message notification → open that specific chat room
- Call notification → open call screen (accept/decline)
- Status reply → open that DM thread

**Deliverable:** Notifications fire correctly for all event types, tapping routes to the right screen.

---

### PHASE 10 — Settings & Profile Polish

**Goal:** Complete settings screen and profile management.

**Settings Screen:**
- Profile row at top (avatar, name, about) → taps to open Edit Profile
- Sections:
  1. **Account** → Privacy, Security, Change Number
  2. **Chats** → Chat Backup, Chat Wallpaper, Font Size
  3. **Notifications** → Message Notifications, Group Notifications, Call Ringtone
  4. **Storage** → Data Usage, Auto-Download Settings
  5. **Language** → English / Français toggle (updates `users/{userId}.language`)
  6. **Help** → FAQ, Contact Support, Report a Bug
  7. **Log Out** (red text, bottom)

**Privacy Settings:**
- Last seen: Everyone / My Contacts / Nobody
- Profile photo: Everyone / My Contacts / Nobody
- About: Everyone / My Contacts / Nobody
- Read receipts: on/off toggle

**Chat Wallpaper:**
- Choose from preset wallpapers (include 3 Cameroonian-themed options: Mount Cameroon, Waza savanna, Bamileke textile pattern as subtle repeating tile)
- Or set solid Egyptian Blue
- Or default white

**Edit Profile:**
- Change avatar (camera or gallery)
- Edit display name
- Edit about/bio
- Tap phone number to view (not editable without Change Number flow)

**Deliverable:** Settings fully navigable, language toggle works, privacy settings saved to Firestore.

---

## Cameroonian Cultural Details (Apply Throughout)

- Default country code: 🇨🇲 +237 pre-selected everywhere a phone field appears
- Default about text: `"Hey, I'm on CamChat 🦁"`
- Language toggle between French and English (affects all UI strings — use i18n-js or i18next for this)
- French UI strings for key screens:
  - "Discuter" (Chats), "Statuts" (Status), "Appels" (Calls), "Paramètres" (Settings)
  - "Envoyer un message" (Type a message), "Appuyer pour enregistrer" (Hold to record)
- Notification sound: use a short balafon or djembe-inspired tone (custom .mp3 in assets/sounds/)
- Onboarding illustrations should use warm African skin tones and Cameroonian cultural context
- Empty state messages with personality:
  - No chats: "No chats yet. Start the conversation! 🦁"
  - No statuses: "None of your contacts have posted a status today."
  - No calls: "Your call log is empty. Time to catch up!"

---

## Performance Rules (Enforce in Every Phase)

- Never fetch all messages at once — paginate with Firestore `limit(30)` and load more on scroll up
- All Firestore listeners must be unsubscribed in `useEffect` cleanup functions
- All images displayed via `expo-image` (not React Native `<Image>`) for caching
- Audio files must be released (`sound.unloadAsync()`) when component unmounts
- All screens must have a loading skeleton state (not a spinner) while data fetches
- Use `React.memo` on `MessageBubble` and chat row components to prevent unnecessary re-renders
- Compress images before upload using `expo-image-manipulator` (max 1200px width, 80% quality)

---

## Development Notes for Claude Code

- Use TypeScript strict mode throughout — no `any` types
- Every component must have explicit prop types (no implicit props)
- All Firebase calls must be wrapped in try/catch with user-facing error handling
- Use Zustand stores for all shared state — no prop drilling
- All Firestore `onSnapshot` listeners must be set up in custom hooks (under `hooks/`)
- All date formatting must use `date-fns` — never use `.toLocaleDateString()` directly
- Never hardcode strings — all user-facing text goes through the i18n utility
- Always test auth edge cases: user with no contacts, fresh install, session expiry