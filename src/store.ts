import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UISlice, createUISlice } from './store/slices/uiSlice';
import { RoomSlice, createRoomSlice } from './store/slices/roomSlice';
import { FurnitureSlice, createFurnitureSlice } from './store/slices/furnitureSlice';
import { DimensionSlice, createDimensionSlice } from './store/slices/dimensionSlice';
import { ProjectSlice, createProjectSlice } from './store/slices/projectSlice';
import { AuthSlice, createAuthSlice } from './store/slices/authSlice';
import { ThemeSlice, createThemeSlice } from './store/slices/themeSlice';
import { PERSISTED_KEYS, PersistedState } from './store/constants';
import { migrateFurnitureMaterials } from './lib/materials';

/**
 * All combined state slices
 */
export type AppState = UISlice & RoomSlice & FurnitureSlice & DimensionSlice & ProjectSlice & AuthSlice & ThemeSlice;

export const useStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createRoomSlice(...a),
      ...createFurnitureSlice(...a),
      ...createDimensionSlice(...a),
      ...createProjectSlice(...a),
      ...createAuthSlice(...a),
      ...createThemeSlice(...a),
    }),
    {
      name: 'floor-plan-storage',
      version: 2,
      
      /**
       * Migrate persisted state to the current version.
       * Note: This only runs for LocalStorage persistence.
       * For cloud/file persistence migrations, see src/store/slices/projectSlice.ts (loadState).
       */
      migrate: (persistedState: unknown, version: number): unknown => {
        const state = persistedState as PersistedState;
        
        if (version < 1 && state && state.rooms) {
          // Fix for early experimental data structures
          state.rooms = state.rooms.map(room => ({
            ...room,
            points: Array.isArray(room.points) ? room.points : []
          }));
        }

        if (version < 2 && state && state.furniture) {
          state.furniture = state.furniture.map(migrateFurnitureMaterials);
        }
        
        return state;
      },

      /**
       * Strictly filter which state keys are saved to LocalStorage.
       * Uses PERSISTED_KEYS from constants to ensure consistency across the app.
       */
      partialize: (state): PersistedState => {
        return PERSISTED_KEYS.reduce((acc, key) => {
          // @ts-expect-error - dynamic key assignment based on trusted list
          acc[key] = state[key];
          return acc;
        }, {} as PersistedState);
      },
      
      storage: createJSONStorage(() => localStorage),
    }
  )
);

