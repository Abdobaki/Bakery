import { AppSettings, Shift, User } from '@bakery/core';
import { create } from 'zustand';
import { getActiveShift, getAppSettings } from '../db/queries';

interface AppState {
  currentUser: User | null;
  activeShift: Shift | null;
  settings: AppSettings | null;
  isOffline: boolean;
  refreshTrigger: number;

  setCurrentUser: (user: User | null) => void;
  setActiveShift: (shift: Shift | null) => void;
  loadInitialData: () => Promise<void>;
  triggerRefresh: () => void;
  setOfflineStatus: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  activeShift: null,
  settings: null,
  isOffline: true,
  refreshTrigger: 0,

  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveShift: (shift) => set({ activeShift: shift }),
  setOfflineStatus: (status) => set({ isOffline: status }),

  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),

  loadInitialData: async () => {
    try {
      const settings = await getAppSettings();
      const activeShift = await getActiveShift();
      set({ settings, activeShift });
    } catch (e) {
      console.error('Failed to load initial app data:', e);
    }
  }
}));
