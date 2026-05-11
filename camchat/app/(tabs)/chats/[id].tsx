/**
 * Chat Detail Screen
 * Full chat room with messages, input, and real-time updates
 * Supports both 1-on-1 and group chats
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Colors, Typography, Spacing, Radius } from '../../../constants';
import { t } from '../../../lib/i18n';
import { formatLastSeen } from '../../../utils/formatters';
import { MessageBubble, MessageInput, DateSeparator } from '../../../components/chat';
import PendingMessageBubble from '../../../components/chat/PendingMessageBubble';
import { TypingIndicator } from '../../../components/chat/TypingIndicator';
import { MessageActionsSheet } from '../../../components/chat/MessageActionsSheet';
import { AttachmentPicker } from '../../../components/chat/AttachmentPicker';
import { ImageViewer } from '../../../components/ui/ImageViewer';
import { VideoViewer } from '../../../components/ui/VideoViewer';
import { useMessages } from '../../../hooks/useMessages';
import { useChat } from '../../../hooks/useChat';
import { useVoicePlayback } from '../../../hooks/useVoicePlayback';
import { useVoiceNoteCache } from '../../../hooks/useVoiceNoteCache';
import { usePendingMessages } from '../../../hooks/usePendingMessages';
import { useAuthStore } from '../../../store/authStore';
import { getChatById } from '../../../lib/chat';
import { getUsersByIds } from '../../../lib/contacts';
import { uploadVoiceNoteFromUri, uploadChatMediaFromUri } from '../../../lib/storage';
import type { Message, Chat, ReplyReference, UserProfile, LocationData } from '../../../types';

// Helper to check if two dates are on different days
function isDifferentDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
}

// Type for list items (message, date separator, or pending message)
type ListItem =
  | { type: 'message'; data: Message }
  | { type: 'separator'; date: Date; key: string }
  | { type: 'pending'; data: import('../../../hooks/usePendingMessages').PendingMessage };

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getParticipant } = useChat();

  // Chat state
  const [chat, setChat] = useState<Chat | null>(null);
  const [participant, setParticipant] = useState<UserProfile | null>(null);
  const [participants, setParticipants] = useState<Map<string, UserProfile>>(new Map());
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // UI state
  const [replyingTo, setReplyingTo] = useState<{
    message: Message;
    name: string;
    text: string;
  } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [videoViewerUrl, setVideoViewerUrl] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // Voice playback hook
  const {
    isPlaying: isPlayingVoice,
    currentPosition: voicePosition,
    playbackSpeed,
    activeMessageId: playingMessageId,
    play: playVoiceNote,
    pause: pauseVoiceNote,
    toggleSpeed: toggleVoiceSpeed,
  } = useVoicePlayback();

  // Voice note cache hook
  const voiceCache = useVoiceNoteCache();

  // Pending messages hook for optimistic UI
  const {
    pendingMessages,
    addPending,
    updateProgress,
    markAsSending,
    markAsFailed,
    removePending,
    retryPending,
  } = usePendingMessages();

  // Load chat data
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId) return;

      setIsLoadingChat(true);
      const result = await getChatById(chatId);

      if (result.success && result.chat) {
        setChat(result.chat);

        // Get participants (excluding current user)
        const participantIds = result.chat.participants.filter(
          (p) => p !== user?.uid
        );

        if (participantIds.length > 0) {
          // First try to get from cache, then fetch missing from Firestore
          const participantMap = new Map<string, UserProfile>();
          const missingIds: string[] = [];

          for (const id of participantIds) {
            const cached = getParticipant(id);
            if (cached) {
              participantMap.set(id, cached);
            } else {
              missingIds.push(id);
            }
          }

          // Fetch missing participants from Firestore
          if (missingIds.length > 0) {
            console.log('📡 Fetching participant data from Firestore:', missingIds);
            const users = await getUsersByIds(missingIds);
            for (const u of users) {
              const profile: UserProfile = {
                uid: u.uid,
                displayName: u.displayName,
                avatarUrl: u.avatarUrl,
                about: u.about,
                isOnline: u.isOnline,
                lastSeen: u.lastSeen,
              };
              participantMap.set(u.uid, profile);
            }
          }

          setParticipants(participantMap);

          // For direct chats, also set the single participant
          if (result.chat.type === 'direct' && participantIds.length === 1) {
            setParticipant(participantMap.get(participantIds[0]) || null);
          }
        }
      }
      setIsLoadingChat(false);
    };

    loadChat();
  }, [chatId, user?.uid, getParticipant]);

  // Messages hook
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    typingUsers,
    sendText,
    sendImage,
    sendVideo,
    sendVoice,
    sendDocument,
    sendLocation,
    setTyping,
    reactToMessage,
    toggleStar,
    deleteMessage,
  } = useMessages({
    chatId: chatId || '',
    participants: chat?.participants || [],
  });

  // Build list items with date separators and pending messages
  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    let lastDate: Date | null = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);

      // Add date separator if different day
      if (!lastDate || isDifferentDay(lastDate, messageDate)) {
        items.push({
          type: 'separator',
          date: messageDate,
          key: `separator-${messageDate.toISOString().split('T')[0]}`,
        });
        lastDate = messageDate;
      }

      items.push({ type: 'message', data: message });
    });

    // Add pending messages at the end (they show with optimistic UI)
    pendingMessages.forEach((pending) => {
      // Add today separator if needed for pending messages
      const today = new Date();
      if (!lastDate || isDifferentDay(lastDate, today)) {
        items.push({
          type: 'separator',
          date: today,
          key: `separator-${today.toISOString().split('T')[0]}`,
        });
        lastDate = today;
      }
      items.push({ type: 'pending', data: pending });
    });

    return items;
  }, [messages, pendingMessages]);

  // Get participant name for header
  const participantName = useMemo(() => {
    if (chat?.type === 'group') {
      return chat.groupName || 'Group';
    }
    return participant?.displayName || 'Chat';
  }, [chat, participant]);

  // Get participant name by ID (for group messages)
  const getParticipantName = useCallback(
    (senderId: string): string => {
      if (senderId === user?.uid) return t('common.you');
      const p = participants.get(senderId);
      return p?.displayName || 'Unknown';
    },
    [participants, user?.uid]
  );

  // Get participant avatar by ID (for group messages)
  const getParticipantAvatar = useCallback(
    (senderId: string): string | undefined => {
      return participants.get(senderId)?.avatarUrl;
    },
    [participants]
  );

  // Get online status text
  const statusText = useMemo(() => {
    if (chat?.type === 'group') {
      if (typingUsers.length > 0) {
        const typingName = getParticipantName(typingUsers[0]);
        return `${typingName} ${t('chats.typing').toLowerCase()}`;
      }
      return `${chat.participants.length} ${t('groups.participants').toLowerCase()}`;
    }

    if (typingUsers.length > 0) {
      return t('chats.typing');
    }
    if (participant?.isOnline) {
      return t('chats.online');
    }
    if (participant?.lastSeen) {
      return formatLastSeen(participant.lastSeen);
    }
    return '';
  }, [chat, typingUsers, participant, getParticipantName]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const replyRef: ReplyReference | undefined = replyingTo
        ? {
            messageId: replyingTo.message.id,
            senderId: replyingTo.message.senderId,
            text: replyingTo.text,
            type: replyingTo.message.type,
          }
        : undefined;

      setReplyingTo(null);
      await sendText(text, replyRef);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sendText, replyingTo]
  );

  // Handle message long press
  const handleMessageLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActionsSheet(true);
  }, []);

  // Handle image press
  const handleImagePress = useCallback((imageUrl: string) => {
    setImageViewerUrl(imageUrl);
  }, []);

  // Handle video press
  const handleVideoPress = useCallback((videoUrl: string) => {
    setVideoViewerUrl(videoUrl);
  }, []);

  // Handle reply action
  const handleReply = useCallback(() => {
    if (selectedMessage) {
      const senderName =
        selectedMessage.senderId === user?.uid
          ? 'You'
          : participant?.displayName || 'User';

      setReplyingTo({
        message: selectedMessage,
        name: senderName,
        text: selectedMessage.text || selectedMessage.type,
      });
    }
    setShowActionsSheet(false);
    setSelectedMessage(null);
  }, [selectedMessage, user?.uid, participant]);

  // Handle reaction
  const handleReaction = useCallback(
    async (emoji: string) => {
      if (selectedMessage) {
        await reactToMessage(selectedMessage.id, emoji);
      }
      setShowActionsSheet(false);
      setSelectedMessage(null);
    },
    [selectedMessage, reactToMessage]
  );

  // Handle star
  const handleStar = useCallback(async () => {
    if (selectedMessage) {
      await toggleStar(selectedMessage.id, !selectedMessage.isStarred);
    }
    setShowActionsSheet(false);
    setSelectedMessage(null);
  }, [selectedMessage, toggleStar]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (selectedMessage?.text) {
      const Clipboard = await import('expo-clipboard').then((m) => m.default);
      await Clipboard.setStringAsync(selectedMessage.text);
      Alert.alert('', t('messages.copied'));
    }
    setShowActionsSheet(false);
    setSelectedMessage(null);
  }, [selectedMessage]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (selectedMessage) {
      Alert.alert(
        t('messages.deleteMessage'),
        t('messages.deleteConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              await deleteMessage(selectedMessage.id);
            },
          },
        ]
      );
    }
    setShowActionsSheet(false);
    setSelectedMessage(null);
  }, [selectedMessage, deleteMessage]);

  // Helper to scroll to bottom after sending
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Generate video thumbnail
  const generateVideoThumbnail = useCallback(async (videoUri: string): Promise<string | undefined> => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000, // 1 second into the video
      });
      console.log('🎬 Generated video thumbnail:', uri);
      return uri;
    } catch (error) {
      console.warn('Failed to generate video thumbnail:', error);
      return undefined;
    }
  }, []);

  // Handle camera capture
  const handleCamera = useCallback(async () => {
    console.log('📸 handleCamera called');

    if (!chatId || !user?.uid) {
      console.log('❌ handleCamera: No chatId or user');
      return;
    }

    let pendingId: string | null = null;

    try {
      // Request camera permission
      console.log('📸 Requesting camera permission...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Camera permission status:', status);

      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('attachments.cameraPermission'));
        return;
      }

      // Launch camera
      console.log('📸 Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        videoMaxDuration: 60,
      });

      console.log('📸 Camera result:', result.canceled ? 'canceled' : 'captured');

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const isVideo = asset.type === 'video';
      const mediaType = isVideo ? 'video' : 'image';

      // Generate thumbnail for video
      let thumbnailUri: string | undefined;
      if (isVideo) {
        thumbnailUri = await generateVideoThumbnail(asset.uri);
      }

      // Add pending message for optimistic UI
      pendingId = addPending({
        type: mediaType,
        localUri: isVideo && thumbnailUri ? thumbnailUri : asset.uri,
      });

      console.log(`📸 Uploading ${mediaType} from camera...`);
      scrollToBottom();

      const uploadResult = await uploadChatMediaFromUri(
        chatId,
        user.uid,
        asset.uri,
        mediaType,
        (progress) => updateProgress(pendingId!, progress)
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log(`✅ ${mediaType} uploaded:`, uploadResult.url);
      markAsSending(pendingId);

      if (isVideo) {
        // Upload thumbnail and send video with thumbnail URL
        let thumbnailUrl: string | undefined;
        if (thumbnailUri) {
          const thumbResult = await uploadChatMediaFromUri(chatId, user.uid, thumbnailUri, 'image');
          if (thumbResult.success && thumbResult.url) {
            thumbnailUrl = thumbResult.url;
          }
        }
        await sendVideo(uploadResult.url, thumbnailUrl);
      } else {
        await sendImage(uploadResult.url);
      }

      // Remove pending message after successful send
      removePending(pendingId);
      scrollToBottom();
    } catch (error) {
      console.error('Camera error:', error);
      // Mark pending message as failed
      if (pendingId) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        markAsFailed(pendingId, errorMessage);
      }
    }
  }, [chatId, user?.uid, sendImage, sendVideo, scrollToBottom, addPending, updateProgress, markAsSending, markAsFailed, removePending, generateVideoThumbnail]);

  // Handle gallery picker
  const handleGallery = useCallback(async () => {
    console.log('🖼️ handleGallery called');

    if (!chatId || !user?.uid) {
      console.log('❌ handleGallery: No chatId or user');
      return;
    }

    let pendingId: string | null = null;

    try {
      // Request media library permission
      console.log('🖼️ Requesting media library permission...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🖼️ Media library permission status:', status);

      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('attachments.galleryPermission'));
        return;
      }

      // Pick media
      console.log('🖼️ Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        videoMaxDuration: 60,
        allowsMultipleSelection: false,
      });

      console.log('🖼️ Image picker result:', result.canceled ? 'canceled' : 'selected');

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const isVideo = asset.type === 'video';
      const mediaType = isVideo ? 'video' : 'image';

      // Generate thumbnail for video
      let thumbnailUri: string | undefined;
      if (isVideo) {
        thumbnailUri = await generateVideoThumbnail(asset.uri);
      }

      // Add pending message for optimistic UI
      pendingId = addPending({
        type: mediaType,
        localUri: isVideo && thumbnailUri ? thumbnailUri : asset.uri,
      });

      console.log(`🖼️ Uploading ${mediaType} from gallery...`);
      scrollToBottom();

      const uploadResult = await uploadChatMediaFromUri(
        chatId,
        user.uid,
        asset.uri,
        mediaType,
        (progress) => updateProgress(pendingId!, progress)
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log(`✅ ${mediaType} uploaded:`, uploadResult.url);
      markAsSending(pendingId);

      if (isVideo) {
        // Upload thumbnail and send video with thumbnail URL
        let thumbnailUrl: string | undefined;
        if (thumbnailUri) {
          const thumbResult = await uploadChatMediaFromUri(chatId, user.uid, thumbnailUri, 'image');
          if (thumbResult.success && thumbResult.url) {
            thumbnailUrl = thumbResult.url;
          }
        }
        await sendVideo(uploadResult.url, thumbnailUrl);
      } else {
        await sendImage(uploadResult.url);
      }

      // Remove pending message after successful send
      removePending(pendingId);
      scrollToBottom();
    } catch (error) {
      console.error('Gallery error:', error);
      // Mark pending message as failed
      if (pendingId) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        markAsFailed(pendingId, errorMessage);
      }
    }
  }, [chatId, user?.uid, sendImage, sendVideo, scrollToBottom, addPending, updateProgress, markAsSending, markAsFailed, removePending, generateVideoThumbnail]);

  // Handle document picker
  const handleDocument = useCallback(async () => {
    console.log('📄 handleDocument called');

    if (!chatId || !user?.uid) {
      console.log('❌ handleDocument: No chatId or user');
      return;
    }

    let pendingId: string | null = null;

    try {
      console.log('📄 Launching document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      console.log('📄 Document picker result:', result.canceled ? 'canceled' : 'selected');

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      // Add pending message for optimistic UI
      pendingId = addPending({
        type: 'document',
        localUri: asset.uri,
        fileName: asset.name,
        fileSize: asset.size,
      });

      console.log('📄 Uploading document:', asset.name);
      scrollToBottom();

      const uploadResult = await uploadChatMediaFromUri(
        chatId,
        user.uid,
        asset.uri,
        'document',
        (progress) => updateProgress(pendingId!, progress)
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log('✅ Document uploaded:', uploadResult.url);
      markAsSending(pendingId);

      await sendDocument(uploadResult.url, asset.name, asset.size || 0);

      // Remove pending message after successful send
      removePending(pendingId);
      scrollToBottom();
    } catch (error) {
      console.error('Document error:', error);
      // Mark pending message as failed
      if (pendingId) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        markAsFailed(pendingId, errorMessage);
      }
    }
  }, [chatId, user?.uid, sendDocument, scrollToBottom, addPending, updateProgress, markAsSending, markAsFailed, removePending]);

  // Handle location sharing
  const handleLocation = useCallback(async () => {
    try {
      // Check current permission status first
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

      // If permission not determined, request it
      if (currentStatus !== 'granted') {
        console.log('📍 Requesting location permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('common.error'), t('attachments.locationPermission'));
          return;
        }
      }

      setIsUploading(true);
      console.log('📍 Getting current GPS location...');

      // Get actual GPS location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        // Timeout after 15 seconds
        timeInterval: 15000,
      });

      console.log('📍 GPS coordinates:', location.coords.latitude, location.coords.longitude);

      // Try to get address from actual GPS coordinates
      let label = 'My Location';
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          label = [address.street, address.city, address.country]
            .filter(Boolean)
            .join(', ');
        }
        console.log('📍 Address resolved:', label);
      } catch (e) {
        console.log('Could not reverse geocode, using coordinates');
        label = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      }

      const locationData: LocationData = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        label,
      };

      console.log('✅ Location obtained:', locationData);

      await sendLocation(locationData);
      scrollToBottom();
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(t('common.error'), t('attachments.locationFailed'));
    } finally {
      setIsUploading(false);
    }
  }, [sendLocation, scrollToBottom]);

  // Store selected attachment type for delayed execution
  const pendingAttachmentType = useRef<'camera' | 'gallery' | 'document' | 'location' | null>(null);

  // Execute the pending attachment action after modal closes
  const executePendingAttachment = useCallback(async () => {
    const type = pendingAttachmentType.current;
    if (!type) return;

    pendingAttachmentType.current = null;

    console.log(`📎 Executing attachment action: ${type}`);

    try {
      switch (type) {
        case 'camera':
          await handleCamera();
          break;
        case 'gallery':
          await handleGallery();
          break;
        case 'document':
          await handleDocument();
          break;
        case 'location':
          await handleLocation();
          break;
      }
    } catch (error) {
      console.error(`❌ Error executing ${type} attachment:`, error);
      Alert.alert(t('common.error'), t('attachments.sendFailed'));
    }
  }, [handleCamera, handleGallery, handleDocument, handleLocation]);

  // Handle attachment selection - store the type and close modal
  const handleAttachment = useCallback(
    (type: 'camera' | 'gallery' | 'document' | 'location') => {
      console.log(`📎 Attachment selected: ${type}`);

      // Store the type for later execution
      pendingAttachmentType.current = type;

      // Close the picker
      setShowAttachmentPicker(false);
    },
    []
  );

  // Effect to execute attachment action after modal closes
  useEffect(() => {
    if (!showAttachmentPicker && pendingAttachmentType.current) {
      // Wait for modal animation to complete, then use InteractionManager
      const timer = setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          executePendingAttachment();
        });
      }, 400); // Longer delay to ensure modal is fully closed

      return () => clearTimeout(timer);
    }
  }, [showAttachmentPicker, executePendingAttachment]);

  // Handle voice call
  const handleVoiceCall = useCallback(async () => {
    if (!user?.uid || !participant?.uid) return;

    try {
      const { createCall } = await import('../../../lib/calls');
      const result = await createCall(user.uid, participant.uid, 'voice');

      if (result.success && result.call) {
        router.push({
          pathname: '/call/[callId]',
          params: { callId: result.call.id, isIncoming: 'false' },
        });
      } else {
        Alert.alert(t('common.error'), result.error || 'Failed to start call');
      }
    } catch (error) {
      console.error('Error starting voice call:', error);
      Alert.alert(t('common.error'), 'Failed to start call');
    }
  }, [user?.uid, participant?.uid]);

  // Handle video call
  const handleVideoCall = useCallback(async () => {
    if (!user?.uid || !participant?.uid) return;

    try {
      const { createCall } = await import('../../../lib/calls');
      const result = await createCall(user.uid, participant.uid, 'video');

      if (result.success && result.call) {
        router.push({
          pathname: '/call/[callId]',
          params: { callId: result.call.id, isIncoming: 'false' },
        });
      } else {
        Alert.alert(t('common.error'), result.error || 'Failed to start call');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      Alert.alert(t('common.error'), 'Failed to start call');
    }
  }, [user?.uid, participant?.uid]);

  // Handle text change for typing indicator
  const handleTextChange = useCallback(
    (text: string) => {
      setTyping(text.length > 0);
    },
    [setTyping]
  );

  // Handle voice note send
  const handleSendVoiceNote = useCallback(
    async (uri: string, duration: number) => {
      if (!chatId || !user?.uid) return;

      console.log('🎤 Uploading voice note:', uri);

      // Upload voice note to Supabase Storage
      const uploadResult = await uploadVoiceNoteFromUri(chatId, user.uid, uri);

      if (!uploadResult.success || !uploadResult.url) {
        console.error('❌ Failed to upload voice note:', uploadResult.error);
        Alert.alert('Error', 'Failed to upload voice note. Please try again.');
        return;
      }

      console.log('✅ Voice note uploaded:', uploadResult.url);

      // Mark as cached so sender doesn't need to "download" their own voice note
      voiceCache.markAsCached(uploadResult.url, uri);

      // Send message with the uploaded URL
      await sendVoice(uploadResult.url, duration);

      // Scroll to bottom
      scrollToBottom();
    },
    [chatId, user?.uid, sendVoice, scrollToBottom, voiceCache]
  );

  // Handle voice note download
  const handleVoiceNoteDownload = useCallback(
    async (message: Message) => {
      if (!message.mediaUrl) return;
      await voiceCache.download(message.mediaUrl, message.id);
    },
    [voiceCache]
  );

  // Handle voice note play - uses cached local file or remote URL for sent messages
  const handleVoiceNotePlay = useCallback(
    async (message: Message) => {
      if (!message.mediaUrl) return;

      const isSentByMe = message.senderId === user?.uid;

      // Check if downloaded in cache
      let localUri = voiceCache.getLocalUri(message.mediaUrl);

      if (localUri) {
        // Play from local cache
        playVoiceNote(localUri, message.id);
        return;
      }

      // For sent messages, play directly from remote URL (no download needed)
      if (isSentByMe) {
        console.log('▶️ Playing sent voice note from remote URL');
        playVoiceNote(message.mediaUrl, message.id);
        return;
      }

      // For received messages, download first
      console.log('📥 Downloading voice note before playing...');
      localUri = await voiceCache.download(message.mediaUrl, message.id);

      if (localUri) {
        playVoiceNote(localUri, message.id);
      }
    },
    [voiceCache, playVoiceNote, user?.uid]
  );

  // Handle retry of a pending message
  const handleRetryPending = useCallback(
    async (pendingId: string) => {
      const pending = retryPending(pendingId);
      if (!pending || !chatId || !user?.uid) return;

      // Re-upload based on type
      try {
        if (pending.type === 'image' || pending.type === 'video') {
          if (!pending.localUri) return;
          const uploadResult = await uploadChatMediaFromUri(
            chatId,
            user.uid,
            pending.localUri,
            pending.type,
            (progress) => updateProgress(pendingId, progress)
          );

          if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.error || 'Upload failed');
          }

          markAsSending(pendingId);

          if (pending.type === 'video') {
            await sendVideo(uploadResult.url, pending.localUri);
          } else {
            await sendImage(uploadResult.url);
          }

          removePending(pendingId);
        } else if (pending.type === 'document' && pending.localUri) {
          const uploadResult = await uploadChatMediaFromUri(
            chatId,
            user.uid,
            pending.localUri,
            'document',
            (progress) => updateProgress(pendingId, progress)
          );

          if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.error || 'Upload failed');
          }

          markAsSending(pendingId);
          await sendDocument(uploadResult.url, pending.fileName || 'document', pending.fileSize || 0);
          removePending(pendingId);
        }
      } catch (error) {
        console.error('Retry failed:', error);
        markAsFailed(pendingId, error instanceof Error ? error.message : 'Upload failed');
      }
    },
    [chatId, user?.uid, retryPending, updateProgress, markAsSending, markAsFailed, removePending, sendImage, sendVideo, sendDocument]
  );

  // Handle cancel of a pending message
  const handleCancelPending = useCallback((pendingId: string) => {
    removePending(pendingId);
  }, [removePending]);

  // Render list item
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'separator') {
        return <DateSeparator date={item.date} />;
      }

      // Handle pending messages (optimistic UI)
      if (item.type === 'pending') {
        const pending = item.data;
        return (
          <PendingMessageBubble
            message={pending}
            onRetry={() => handleRetryPending(pending.id)}
            onCancel={() => handleCancelPending(pending.id)}
          />
        );
      }

      const message = item.data;
      const isSent = message.senderId === user?.uid;
      const isThisMessagePlaying = playingMessageId === message.id;
      const isGroupChat = chat?.type === 'group';
      const showSenderInfo = isGroupChat && !isSent;

      // Voice note cache state
      // Sent voice notes are always "downloaded" (user doesn't need to download their own)
      const isVoiceNote = message.type === 'audio' && message.mediaUrl;
      const isVoiceNoteDownloaded = isVoiceNote
        ? (isSent || voiceCache.isDownloaded(message.mediaUrl!))
        : true;
      const isVoiceNoteDownloading = isVoiceNote && !isSent
        ? voiceCache.isDownloading(message.mediaUrl!)
        : false;
      const voiceNoteDownloadProgress = isVoiceNote && !isSent
        ? voiceCache.getProgress(message.mediaUrl!)
        : 0;

      // Determine the media press handler based on type
      const getMediaPressHandler = () => {
        if (!message.mediaUrl) return undefined;
        if (message.type === 'image') {
          return () => handleImagePress(message.mediaUrl!);
        }
        if (message.type === 'video') {
          return () => handleVideoPress(message.mediaUrl!);
        }
        return undefined;
      };

      return (
        <MessageBubble
          message={message}
          isSent={isSent}
          isGroupChat={isGroupChat}
          senderName={showSenderInfo ? getParticipantName(message.senderId) : undefined}
          senderAvatar={showSenderInfo ? getParticipantAvatar(message.senderId) : undefined}
          onLongPress={() => handleMessageLongPress(message)}
          onImagePress={getMediaPressHandler()}
          // Voice note playback props
          isPlayingVoiceNote={isThisMessagePlaying && isPlayingVoice}
          voiceNotePosition={isThisMessagePlaying ? voicePosition : 0}
          voiceNotePlaybackSpeed={playbackSpeed}
          onVoiceNotePlay={() => handleVoiceNotePlay(message)}
          onVoiceNotePause={pauseVoiceNote}
          onVoiceNoteSpeedToggle={toggleVoiceSpeed}
          // Voice note download props
          isVoiceNoteDownloaded={isVoiceNoteDownloaded}
          isVoiceNoteDownloading={isVoiceNoteDownloading}
          voiceNoteDownloadProgress={voiceNoteDownloadProgress}
          onVoiceNoteDownload={() => handleVoiceNoteDownload(message)}
        />
      );
    },
    [
      user?.uid,
      chat?.type,
      handleMessageLongPress,
      handleImagePress,
      handleVideoPress,
      playingMessageId,
      isPlayingVoice,
      voicePosition,
      playbackSpeed,
      handleVoiceNotePlay,
      pauseVoiceNote,
      toggleVoiceSpeed,
      voiceCache,
      handleVoiceNoteDownload,
      getParticipantName,
      getParticipantAvatar,
      handleRetryPending,
      handleCancelPending,
    ]
  );

  // Key extractor
  const keyExtractor = useCallback((item: ListItem) => {
    if (item.type === 'separator') {
      return item.key;
    }
    if (item.type === 'pending') {
      return `pending-${item.data.id}`;
    }
    return item.data.id;
  }, []);

  if (isLoadingChat) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>

        <Pressable
          style={styles.headerInfo}
          onPress={() => {
            if (chat?.type === 'group' && chatId) {
              router.push(`/group/${chatId}`);
            } else if (participant) {
              router.push(`/profile/${participant.uid}`);
            }
          }}
        >
          <View style={styles.avatarContainer}>
            {chat?.type === 'group' ? (
              chat.groupAvatarUrl ? (
                <Image
                  source={{ uri: chat.groupAvatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="people" size={20} color={Colors.textSecondary} />
                </View>
              )
            ) : participant?.avatarUrl ? (
              <Image
                source={{ uri: participant.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color={Colors.textSecondary} />
              </View>
            )}
            {chat?.type === 'direct' && participant?.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName} numberOfLines={1}>
              {participantName}
            </Text>
            <Text
              style={[
                styles.headerStatus,
                typingUsers.length > 0 && styles.typingStatus,
              ]}
              numberOfLines={1}
            >
              {statusText}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          {chat?.type === 'direct' && (
            <>
              <Pressable onPress={handleVideoCall} style={styles.headerButton}>
                <Ionicons name="videocam" size={22} color={Colors.textInverse} />
              </Pressable>
              <Pressable onPress={handleVoiceCall} style={styles.headerButton}>
                <Ionicons name="call" size={22} color={Colors.textInverse} />
              </Pressable>
            </>
          )}
          <Pressable
            onPress={() => {
              if (chat?.type === 'group' && chatId) {
                router.push(`/group/${chatId}`);
              }
            }}
            style={styles.headerButton}
          >
            <Ionicons
              name={chat?.type === 'group' ? 'information-circle-outline' : 'ellipsis-vertical'}
              size={22}
              color={Colors.textInverse}
            />
          </Pressable>
        </View>
      </View>

      {/* Uploading indicator */}
      {isUploading && (
        <View style={styles.uploadingBar}>
          <ActivityIndicator size="small" color={Colors.textInverse} />
          <Text style={styles.uploadingText}>{t('attachments.uploading')}</Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.messagesContainer}>
          {isLoadingMessages ? (
            <View style={styles.loadingMessages}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <Ionicons name="chatbubble-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('messages.noMessages')}</Text>
              <Text style={styles.emptySubtext}>{t('messages.startConversation')}</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={listItems}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            />
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <View style={styles.typingContainer}>
              <TypingIndicator />
            </View>
          )}
        </View>

        {/* Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendVoiceNote={handleSendVoiceNote}
          onAttachPress={() => setShowAttachmentPicker(true)}
          onCameraPress={handleCamera}
          onTextChange={handleTextChange}
          replyingTo={
            replyingTo
              ? { name: replyingTo.name, text: replyingTo.text }
              : null
          }
          onCancelReply={() => setReplyingTo(null)}
          disabled={isSending || isUploading}
        />
      </KeyboardAvoidingView>

      {/* Message Actions Bottom Sheet */}
      <MessageActionsSheet
        visible={showActionsSheet}
        message={selectedMessage}
        onClose={() => {
          setShowActionsSheet(false);
          setSelectedMessage(null);
        }}
        onReply={handleReply}
        onReact={handleReaction}
        onStar={handleStar}
        onCopy={handleCopy}
        onDelete={handleDelete}
      />

      {/* Attachment Picker Bottom Sheet */}
      <AttachmentPicker
        visible={showAttachmentPicker}
        onClose={() => setShowAttachmentPicker(false)}
        onSelect={handleAttachment}
      />

      {/* Image Viewer */}
      {imageViewerUrl && (
        <ImageViewer
          imageUrl={imageViewerUrl}
          onClose={() => setImageViewerUrl(null)}
        />
      )}

      {/* Video Viewer */}
      {videoViewerUrl && (
        <VideoViewer
          videoUrl={videoViewerUrl}
          onClose={() => setVideoViewerUrl(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  headerStatus: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  typingStatus: {
    color: Colors.accent,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: Spacing.sm,
  },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.xs,
  },
  uploadingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
    marginLeft: Spacing.sm,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  typingContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});
