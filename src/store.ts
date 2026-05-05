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
      version: 4,
      
      /**
       * Migrate persisted state to the current version.
       * Note: This only runs for LocalStorage persistence.
       * For cloud/file persistence migrations, see src/store/slices/projectSlice.ts (loadState).
       */
      migrate: (persistedState: unknown, version: number): unknown => {
        const state = persistedState as any;
        
        if (version < 1 && state && state.rooms) {
          // Fix for early experimental data structures
          state.rooms = state.rooms.map((room: any) => ({
            ...room,
            points: Array.isArray(room.points) ? room.points : []
          }));
        }

        if (version < 2 && state && state.furniture) {
          state.furniture = state.furniture.map(migrateFurnitureMaterials);
        }

        if (version < 4 && state && state.rooms) {
          state.rooms = state.rooms.map((room: any) => {
            let vertices = room.vertices;
            let edges = room.edges;
            let startVertexId = room.startVertexId;
            
            if ((!vertices || version < 4) && (room.points || vertices)) {
              // If we are migrating from points OR fixing a broken topology migration
              const points = room.points || vertices.map((v: any) => ({ x: v.x, y: v.y }));
              
              vertices = points.map((p: any, i: number) => ({
                id: i.toString(),
                x: p.x,
                y: p.y
              }));
              
              startVertexId = "0";
              const edgeCount = room.isClosed ? vertices.length : vertices.length - 1;
              edges = [];
              for (let i = 0; i < edgeCount; i++) {
                edges.push({
                  id: `${room.id}-edge-${i}`,
                  startVertexId: i.toString(),
                  endVertexId: ((i + 1) % vertices.length).toString()
                });
              }
            }
            
            const { points: _points, ...rest } = room;
            return {
              ...rest,
              vertices: vertices || [],
              edges: edges || [],
              startVertexId: startVertexId || (vertices?.[0]?.id)
            };
          });
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

