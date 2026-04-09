import { create } from 'zustand';

export interface Vector2d {
  x: number;
  y: number;
}

export interface RoomObject {
  id: string;
  points: Vector2d[];
}

export interface FurnitureObject {
  id: string;
  type: 'box' | 'polygon';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  points?: Vector2d[];
}

export interface AppState {
  scale: number;
  position: Vector2d;
  
  // App Mode
  mode: 'select' | 'draw-room' | 'draw-furniture' | 'calibrate' | 'add-box';
  
  // Data
  pixelsPerCm: number;
  backgroundImage: string | null;
  backgroundOpacity: number;
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
  
  // History
  history: { rooms: RoomObject[]; furniture: FurnitureObject[] }[];
  
  // Actions
  setScale: (scale: number) => void;
  setPosition: (position: Vector2d) => void;
  setMode: (mode: AppState['mode']) => void;
  setPixelsPerCm: (ratio: number) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
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
  pixelsPerCm: 1,
  backgroundImage: null,
  backgroundOpacity: 0.5,
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
  history: [],

  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),
  setMode: (mode) => set({ mode, roomPoints: [], dimensionInput: '', selectedId: null, selectedRoomId: null }),
  setPixelsPerCm: (pixelsPerCm) => set({ pixelsPerCm }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
  setCalibrationPoints: (calibrationPoints) => set({ calibrationPoints }),
  setTempCalibrationDist: (tempCalibrationDist) => set({ tempCalibrationDist }),
  setOrthoMode: (orthoMode) => set({ orthoMode }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),

  saveHistory: () => set((state) => ({
    history: [...state.history, { rooms: state.rooms, furniture: state.furniture }].slice(-50)
  })),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    return {
      rooms: previous.rooms,
      furniture: previous.furniture,
      history: state.history.slice(0, -1),
      selectedId: null,
      selectedRoomId: null
    };
  }),

  addRoomPoint: (point) => set((state) => ({ roomPoints: [...state.roomPoints, point] })),
  closeRoom: () => set((state) => {
    if (state.roomPoints.length < 3) return { roomPoints: [], dimensionInput: '' };
    
    const uniquePoints = state.roomPoints.filter((p, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
      return dist > 0.1;
    });

    if (uniquePoints.length < 3) return { roomPoints: [], dimensionInput: '' };

    const historyEntry = { rooms: state.rooms, furniture: state.furniture };

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
    const historyEntry = { rooms: state.rooms, furniture: state.furniture };
    return {
      rooms: state.rooms.filter(r => r.id !== id),
      selectedRoomId: null,
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  addFurniture: (item) => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture };
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
        
        updated.points = f.points.map(p => ({
          x: p.x * scaleX,
          y: p.y * scaleY
        }));
      }
      
      return updated;
    });

    return {
      furniture: newFurniture
    };
  }),
  setSelectedId: (selectedId) => set({ selectedId }),
  deleteSelected: () => set((state) => {
    if (!state.selectedId) return state;
    const historyEntry = { rooms: state.rooms, furniture: state.furniture };
    return {
      furniture: state.furniture.filter(f => f.id !== state.selectedId),
      selectedId: null,
      history: [...state.history, historyEntry].slice(-50)
    };
  }),
  copySelected: () => set((state) => ({
    clipboard: state.furniture.find(f => f.id === state.selectedId) || null
  })),
  paste: () => set((state) => {
    if (!state.clipboard) return state;
    const historyEntry = { rooms: state.rooms, furniture: state.furniture };
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
      pixelsPerCm: typeof data.pixelsPerCm === 'number' ? data.pixelsPerCm : state.pixelsPerCm,
      scale: 1,
      position: { x: 0, y: 0 },
      selectedId: null,
      selectedRoomId: null,
      roomPoints: [],
      dimensionInput: '',
      history: []
    };
  }),

  resetView: () => set({ scale: 1, position: { x: 0, y: 0 } }),
}));
