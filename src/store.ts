import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UISlice, createUISlice } from './store/slices/uiSlice';
import { RoomSlice, createRoomSlice } from './store/slices/roomSlice';
import { FurnitureSlice, createFurnitureSlice } from './store/slices/furnitureSlice';
import { DimensionSlice, createDimensionSlice } from './store/slices/dimensionSlice';
import { ProjectSlice, createProjectSlice } from './store/slices/projectSlice';
import { AuthSlice, createAuthSlice } from './store/slices/authSlice';

export type AppState = UISlice & RoomSlice & FurnitureSlice & DimensionSlice & ProjectSlice & AuthSlice;

export const useStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createRoomSlice(...a),
      ...createFurnitureSlice(...a),
      ...createDimensionSlice(...a),
      ...createProjectSlice(...a),
      ...createAuthSlice(...a),
    }),
    {
      name: 'floor-plan-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 && persistedState && persistedState.rooms) {
          persistedState.rooms = persistedState.rooms.map((room: any) => ({
            ...room,
            points: Array.isArray(room.points) ? room.points : []
          }));
        }
        return persistedState;
      },
      partialize: (state) => ({
        projectId: state.projectId,
        projectName: state.projectName,
        pixelsPerCm: state.pixelsPerCm,
        rooms: state.rooms,
        furniture: state.furniture,
        dimensions: state.dimensions,
        wallAttachments: state.wallAttachments,
        wallThickness: state.wallThickness,
        wallHeight: state.wallHeight,
        backgroundImage: state.backgroundImage,
        backgroundVisible: state.backgroundVisible,
        backgroundPosition: state.backgroundPosition,
        backgroundScale: state.backgroundScale,
        backgroundRotation: state.backgroundRotation,
        backgroundOpacity: state.backgroundOpacity,
      }),
    }
  )
);
