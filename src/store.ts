import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UISlice, createUISlice } from './store/slices/uiSlice';
import { RoomSlice, createRoomSlice } from './store/slices/roomSlice';
import { FurnitureSlice, createFurnitureSlice } from './store/slices/furnitureSlice';
import { DimensionSlice, createDimensionSlice } from './store/slices/dimensionSlice';
import { ProjectSlice, createProjectSlice } from './store/slices/projectSlice';

export type AppState = UISlice & RoomSlice & FurnitureSlice & DimensionSlice & ProjectSlice;

export const useStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createRoomSlice(...a),
      ...createFurnitureSlice(...a),
      ...createDimensionSlice(...a),
      ...createProjectSlice(...a),
    }),
    {
      name: 'floor-plan-storage',
      partialize: (state) => ({
        projectName: state.projectName,
        pixelsPerCm: state.pixelsPerCm,
        rooms: state.rooms,
        furniture: state.furniture,
        dimensions: state.dimensions,
        wallAttachments: state.wallAttachments,
        wallThickness: state.wallThickness,
        wallHeight: state.wallHeight,
        backgroundImage: state.backgroundImage,
        backgroundPosition: state.backgroundPosition,
        backgroundScale: state.backgroundScale,
        backgroundRotation: state.backgroundRotation,
        backgroundOpacity: state.backgroundOpacity,
      }),
    }
  )
);
