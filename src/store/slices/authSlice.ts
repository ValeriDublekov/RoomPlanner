import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { User } from 'firebase/auth';

export interface AuthSlice {
  currentUser: User | null;
  isAuthLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  setIsAuthLoading: (loading: boolean) => void;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set) => ({
  currentUser: null,
  isAuthLoading: true,
  setCurrentUser: (user) => set({ currentUser: user }),
  setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
});
