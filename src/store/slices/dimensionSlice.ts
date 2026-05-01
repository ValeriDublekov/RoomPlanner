import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { Vector2d, DimensionObject } from '../../types';
import { getDistance } from '../../lib/geometry';

export interface DimensionSlice {
  measurePoints: Vector2d[];
  lastMeasurement: number | null;
  dimensions: DimensionObject[];
  selectedDimensionId: string | null;

  addMeasurePoint: (point: Vector2d) => void;
  resetMeasurement: () => void;
  addDimension: (p1: Vector2d, p2: Vector2d) => void;
  deleteDimension: (id: string) => void;
  setSelectedDimensionId: (id: string | null) => void;
}

export const createDimensionSlice: StateCreator<AppState, [], [], DimensionSlice> = (set, get) => ({
  measurePoints: [],
  lastMeasurement: null,
  dimensions: [],
  selectedDimensionId: null,

  addMeasurePoint: (point) => set((state) => {
    if (state.measurePoints.length === 0) {
      return { measurePoints: [point], lastMeasurement: null };
    } else {
      const p1 = state.measurePoints[0];
      const dist = getDistance(p1, point);
      
      if (state.mode === 'dimension') {
        const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
        const newDimension: DimensionObject = {
          id: Math.random().toString(36).substr(2, 9),
          p1,
          p2: point
        };
        return { 
          measurePoints: [], 
          lastMeasurement: dist,
          dimensions: [...state.dimensions, newDimension],
          history: [...state.history, historyEntry].slice(-50)
        };
      }

      return { measurePoints: [], lastMeasurement: dist };
    }
  }),

  resetMeasurement: () => set({ measurePoints: [], lastMeasurement: null }),

  addDimension: (p1, p2) => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    return {
      dimensions: [...state.dimensions, { id: Math.random().toString(36).substr(2, 9), p1, p2 }],
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  deleteDimension: (id) => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    return {
      dimensions: state.dimensions.filter(d => d.id !== id),
      selectedDimensionId: null,
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  setSelectedDimensionId: (selectedDimensionId) => set({ 
    selectedDimensionId,
    selectedId: null,
    selectedIds: [],
    selectedRoomId: null,
    selectedWallIndex: null,
    selectedAttachmentId: null,
    selectedBeamId: null
  }),
});
