import { create } from 'zustand';
import { Vector2d, RoomObject, FurnitureObject, DimensionObject, AppMode, HistoryEntry, LayerType } from './types';
import { getDistance, scalePoints } from './lib/geometry';

export interface AppState {
  scale: number;
  position: Vector2d;
  
  // App Mode & Layers
  mode: AppMode;
  activeLayer: LayerType;
  
  // Data
  pixelsPerCm: number;
  backgroundImage: string | null;
  backgroundOpacity: number;
  backgroundPosition: Vector2d;
  backgroundScale: number;
  backgroundRotation: number;
  calibrationPoints: Vector2d[] | null;
  tempCalibrationDist: number | null;
  
  // Settings
  orthoMode: boolean;
  snapToGrid: boolean;
  
  // Room Drawing
  roomPoints: Vector2d[];
  rooms: RoomObject[];
  selectedRoomId: string | null;
  dimensionInput: string;
  
  // Furniture
  furniture: FurnitureObject[];
  selectedId: string | null;
  clipboard: FurnitureObject | null;
  
  // Measurement
  measurePoints: Vector2d[];
  lastMeasurement: number | null;
  
  // Dimensions
  dimensions: DimensionObject[];
  selectedDimensionId: string | null;
  
  // History
  history: HistoryEntry[];
  
  // Actions
  setScale: (scale: number) => void;
  setPosition: (position: Vector2d) => void;
  setMode: (mode: AppMode) => void;
  setActiveLayer: (layer: LayerType) => void;
  setPixelsPerCm: (ratio: number) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundTransform: (transform: { x?: number, y?: number, scale?: number, rotation?: number }) => void;
  setCalibrationPoints: (points: Vector2d[] | null) => void;
  setTempCalibrationDist: (dist: number | null) => void;
  setOrthoMode: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  
  // Room Actions
  addRoomPoint: (point: Vector2d) => void;
  closeRoom: () => void;
  setDimensionInput: (input: string) => void;
  setSelectedRoomId: (id: string | null) => void;
  deleteRoom: (id: string) => void;

  // Furniture Actions
  addFurniture: (item: Omit<FurnitureObject, 'id'>) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  setSelectedId: (id: string | null) => void;
  deleteSelected: () => void;
  copySelected: () => void;
  paste: () => void;

  // Measurement Actions
  addMeasurePoint: (point: Vector2d) => void;
  resetMeasurement: () => void;

  // Dimension Actions
  addDimension: (p1: Vector2d, p2: Vector2d) => void;
  deleteDimension: (id: string) => void;
  setSelectedDimensionId: (id: string | null) => void;
  
  // Global Actions
  undo: () => void;
  saveHistory: () => void;
  moveView: (dx: number, dy: number) => void;
  
  // Persistence
  loadState: (data: any) => void;
  
  // Helpers
  resetView: () => void;
}

export const useStore = create<AppState>((set) => ({
  scale: 1,
  position: { x: 0, y: 0 },
  mode: 'select',
  activeLayer: 'furniture',
  pixelsPerCm: 1,
  backgroundImage: null,
  backgroundOpacity: 0.5,
  backgroundPosition: { x: 0, y: 0 },
  backgroundScale: 1,
  backgroundRotation: 0,
  calibrationPoints: null,
  tempCalibrationDist: null,
  orthoMode: false,
  snapToGrid: true,
  roomPoints: [],
  rooms: [],
  selectedRoomId: null,
  dimensionInput: '',
  furniture: [],
  selectedId: null,
  clipboard: null,
  measurePoints: [],
  lastMeasurement: null,
  dimensions: [],
  selectedDimensionId: null,
  history: [],

  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),
  setMode: (mode) => set({ mode, roomPoints: [], measurePoints: [], dimensionInput: '', selectedId: null, selectedRoomId: null, selectedDimensionId: null }),
  setActiveLayer: (activeLayer) => set({ activeLayer, selectedId: null, selectedRoomId: null, selectedDimensionId: null }),
  setPixelsPerCm: (pixelsPerCm) => set({ pixelsPerCm }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
  setBackgroundTransform: (transform) => set((state) => ({
    backgroundPosition: {
      x: transform.x ?? state.backgroundPosition.x,
      y: transform.y ?? state.backgroundPosition.y,
    },
    backgroundScale: transform.scale ?? state.backgroundScale,
    backgroundRotation: transform.rotation ?? state.backgroundRotation,
  })),
  setCalibrationPoints: (calibrationPoints) => set({ calibrationPoints }),
  setTempCalibrationDist: (tempCalibrationDist) => set({ tempCalibrationDist }),
  setOrthoMode: (orthoMode) => set({ orthoMode }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),

  addMeasurePoint: (point) => set((state) => {
    if (state.measurePoints.length === 0) {
      return { measurePoints: [point], lastMeasurement: null };
    } else {
      const p1 = state.measurePoints[0];
      const dist = getDistance(p1, point);
      
      if (state.mode === 'dimension') {
        const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions };
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
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions };
    return {
      dimensions: [...state.dimensions, { id: Math.random().toString(36).substr(2, 9), p1, p2 }],
      history: [...state.history, historyEntry].slice(-50)
    };
  }),
  deleteDimension: (id) => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions };
    return {
      dimensions: state.dimensions.filter(d => d.id !== id),
      selectedDimensionId: null,
      history: [...state.history, historyEntry].slice(-50)
    };
  }),
  setSelectedDimensionId: (selectedDimensionId) => set({ selectedDimensionId }),

  saveHistory: () => set((state) => ({
    history: [...state.history, { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions }].slice(-50)
  })),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    return {
      rooms: previous.rooms,
      furniture: previous.furniture,
      dimensions: previous.dimensions,
      history: state.history.slice(0, -1),
      selectedId: null,
      selectedRoomId: null,
      selectedDimensionId: null
    };
  }),

  addRoomPoint: (point) => set((state) => ({ roomPoints: [...state.roomPoints, point] })),
  closeRoom: () => set((state) => {
    if (state.roomPoints.length < 3) return { roomPoints: [], dimensionInput: '' };
    
    const uniquePoints = state.roomPoints.filter((p, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      const dist = getDistance(p, prev);
      return dist > 0.1;
    });

    if (uniquePoints.length < 3) return { roomPoints: [], dimensionInput: '' };

    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions };

    if (state.mode === 'draw-furniture') {
      const xs = uniquePoints.map(p => p.x);
      const ys = uniquePoints.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      const newFurniture: FurnitureObject = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'polygon',
        name: 'Custom Object',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        rotation: 0,
        points: uniquePoints.map(p => ({ x: p.x - minX, y: p.y - minY }))
      };

      return {
        furniture: [...state.furniture, newFurniture],
        roomPoints: [],
        dimensionInput: '',
        mode: 'select',
        selectedId: newFurniture.id,
        history: [...state.history, historyEntry].slice(-50)
      };
    }

    const newRoom: RoomObject = {
      id: Math.random().toString(36).substr(2, 9),
      points: uniquePoints
    };

    return {
      rooms: [...state.rooms, newRoom],
      roomPoints: [],
      dimensionInput: '',
      history: [...state.history, historyEntry].slice(-50)
    };
  }),
  setDimensionInput: (dimensionInput) => set({ dimensionInput }),
  setSelectedRoomId: (selectedRoomId) => set({ selectedRoomId }),
  deleteRoom: (id) => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions };
    return {
      rooms: state.rooms.filter(r => r.id !== id),
      selectedRoomId: null,
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  addFurniture: (item) => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions };
    return {
      furniture: [...state.furniture, { ...item, id: Math.random().toString(36).substr(2, 9) }],
      history: [...state.history, historyEntry].slice(-50)
    };
  }),
  updateFurniture: (id, updates) => set((state) => {
    const newFurniture = state.furniture.map(f => {
      if (f.id !== id) return f;
      
      const updated = { ...f, ...updates };
      
      // If width or height changed for a polygon, scale the points
      if (f.type === 'polygon' && f.points && (updates.width !== undefined || updates.height !== undefined)) {
        const scaleX = updates.width !== undefined ? updates.width / f.width : 1;
        const scaleY = updates.height !== undefined ? updates.height / f.height : 1;
        
        updated.points = scalePoints(f.points, scaleX, scaleY);
      }
      
      return updated;
    });

    return {
      furniture: newFurniture
    };
  }),
  setSelectedId: (selectedId) => set({ selectedId }),
  deleteSelected: () => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions };
    
    if (state.activeLayer === 'furniture' && state.selectedId) {
      return {
        furniture: state.furniture.filter(f => f.id !== state.selectedId),
        selectedId: null,
        history: [...state.history, historyEntry].slice(-50)
      };
    }
    
    if (state.activeLayer === 'room' && state.selectedRoomId) {
      return {
        rooms: state.rooms.filter(r => r.id !== state.selectedRoomId),
        selectedRoomId: null,
        history: [...state.history, historyEntry].slice(-50)
      };
    }

    if (state.activeLayer === 'annotation' && state.selectedDimensionId) {
      return {
        dimensions: state.dimensions.filter(d => d.id !== state.selectedDimensionId),
        selectedDimensionId: null,
        history: [...state.history, historyEntry].slice(-50)
      };
    }

    return state;
  }),
  copySelected: () => set((state) => ({
    clipboard: state.furniture.find(f => f.id === state.selectedId) || null
  })),
  paste: () => set((state) => {
    if (!state.clipboard) return state;
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions };
    const newId = Math.random().toString(36).substr(2, 9);
    const newItem = {
      ...state.clipboard,
      id: newId,
      x: state.clipboard.x + 20,
      y: state.clipboard.y + 20,
    };
    return {
      furniture: [...state.furniture, newItem],
      selectedId: newId,
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  moveView: (dx, dy) => set((state) => ({
    position: { x: state.position.x + dx, y: state.position.y + dy }
  })),

  loadState: (data) => set((state) => {
    if (!data || typeof data !== 'object') return state;
    
    let loadedRooms: RoomObject[] = [];
    if (Array.isArray(data.rooms)) {
      loadedRooms = data.rooms.map((r: any) => {
        if (Array.isArray(r)) return { id: Math.random().toString(36).substr(2, 9), points: r };
        return r;
      });
    }

    return {
      rooms: loadedRooms,
      furniture: Array.isArray(data.furniture) ? data.furniture : state.furniture,
      dimensions: Array.isArray(data.dimensions) ? data.dimensions : [],
      pixelsPerCm: typeof data.pixelsPerCm === 'number' ? data.pixelsPerCm : state.pixelsPerCm,
      scale: 1,
      position: { x: 0, y: 0 },
      selectedId: null,
      selectedRoomId: null,
      selectedDimensionId: null,
      roomPoints: [],
      dimensionInput: '',
      history: []
    };
  }),

  resetView: () => set({ scale: 1, position: { x: 0, y: 0 } }),
}));
