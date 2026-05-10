/**
 * Call Store
 * Manages active call state
 */

import { create } from 'zustand';
import type { Call, CallType, CallStatus, UserProfile } from '../types';

interface CallState {
  activeCall: Call | null;
  remoteUser: UserProfile | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isCameraOn: boolean;
  callDuration: number;

  // Actions
  setActiveCall: (call: Call | null) => void;
  setRemoteUser: (user: UserProfile | null) => void;
  updateCallStatus: (status: CallStatus) => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void;
  setCallDuration: (duration: number) => void;
  resetCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  remoteUser: null,
  isMuted: false,
  isSpeakerOn: false,
  isCameraOn: true,
  callDuration: 0,

  setActiveCall: (activeCall) => set({ activeCall }),

  setRemoteUser: (remoteUser) => set({ remoteUser }),

  updateCallStatus: (status) =>
    set((state) => ({
      activeCall: state.activeCall
        ? { ...state.activeCall, status }
        : null,
    })),

  toggleMute: () =>
    set((state) => ({ isMuted: !state.isMuted })),

  toggleSpeaker: () =>
    set((state) => ({ isSpeakerOn: !state.isSpeakerOn })),

  toggleCamera: () =>
    set((state) => ({ isCameraOn: !state.isCameraOn })),

  setCallDuration: (callDuration) => set({ callDuration }),

  resetCall: () =>
    set({
      activeCall: null,
      remoteUser: null,
      isMuted: false,
      isSpeakerOn: false,
      isCameraOn: true,
      callDuration: 0,
    }),
}));

export default useCallStore;
