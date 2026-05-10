/**
 * Status Store
 * Manages status/stories state
 */

import { create } from 'zustand';
import type { Status, StatusGroup } from '../types';

interface StatusState {
  myStatuses: Status[];
  contactStatuses: StatusGroup[];
  isLoading: boolean;

  // Actions
  setMyStatuses: (statuses: Status[]) => void;
  addMyStatus: (status: Status) => void;
  removeMyStatus: (statusId: string) => void;

  setContactStatuses: (statusGroups: StatusGroup[]) => void;
  markStatusViewed: (userId: string, statusId: string) => void;

  setLoading: (loading: boolean) => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  myStatuses: [],
  contactStatuses: [],
  isLoading: false,

  setMyStatuses: (myStatuses) => set({ myStatuses }),

  addMyStatus: (status) =>
    set((state) => ({
      myStatuses: [status, ...state.myStatuses],
    })),

  removeMyStatus: (statusId) =>
    set((state) => ({
      myStatuses: state.myStatuses.filter((s) => s.id !== statusId),
    })),

  setContactStatuses: (contactStatuses) => set({ contactStatuses }),

  markStatusViewed: (userId, statusId) =>
    set((state) => ({
      contactStatuses: state.contactStatuses.map((group) => {
        if (group.userId !== userId) return group;

        const updatedStatuses = group.statuses.map((status) =>
          status.id === statusId
            ? { ...status, viewedBy: [...status.viewedBy, userId] }
            : status
        );

        const hasUnviewed = updatedStatuses.some(
          (s) => !s.viewedBy.includes(userId)
        );

        return {
          ...group,
          statuses: updatedStatuses,
          hasUnviewed,
        };
      }),
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));

export default useStatusStore;
