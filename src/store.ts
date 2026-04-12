import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vector2d, RoomObject, FurnitureObject, DimensionObject, AppMode, HistoryEntry, LayerType, EdgeMap, WallAttachment } from './types';
import { getDistance, scalePoints } from './lib/geometry';

export interface AppState {
  scale: number;
  position: Vector2d;
  
  // App Mode & Layers
  mode: AppMode;
  activeLayer: LayerType;
  
  // Data
  projectName: string;
  pixelsPerCm: number;
  backgroundImage: string | null;
  backgroundVisible: boolean;
  backgroundOpacity: number;
  backgroundPosition: Vector2d;
  backgroundScale: number;
  backgroundRotation: number;
  calibrationPoints: Vector2d[] | null;
  tempCalibrationDist: number | null;
  
  // Settings
  orthoMode: boolean;
  snapToGrid: boolean;
  snapToImage: boolean;
  gridVisible: boolean;
  isAltPressed: boolean;
  edgeMap: EdgeMap | null;
  wallThickness: number; // in cm
  wallHeight: number; // in cm
  
  // Room Drawing
  roomPoints: Vector2d[];
  rooms: RoomObject[];
  wallAttachments: WallAttachment[];
  selectedRoomId: string | null;
  selectedWallIndex: number | null;
  selectedAttachmentId: string | null;
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
  setProjectName: (name: string) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundVisible: (visible: boolean) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundTransform: (transform: { x?: number, y?: number, scale?: number, rotation?: number }) => void;
  setCalibrationPoints: (points: Vector2d[] | null) => void;
  setTempCalibrationDist: (dist: number | null) => void;
  setOrthoMode: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setSnapToImage: (enabled: boolean) => void;
  setGridVisible: (visible: boolean) => void;
  setIsAltPressed: (pressed: boolean) => void;
  setEdgeMap: (map: EdgeMap | null) => void;
  setWallThickness: (thickness: number) => void;
  setWallHeight: (height: number) => void;
  
  // Room Actions
  addRoomPoint: (point: Vector2d) => void;
  closeRoom: () => void;
  setDimensionInput: (input: string) => void;
  setSelectedRoomId: (id: string | null) => void;
  setSelectedWallIndex: (index: number | null) => void;
  updateRoom: (id: string, updates: Partial<RoomObject>) => void;
  deleteRoom: (id: string) => void;
  setSelectedAttachmentId: (id: string | null) => void;
  addWallAttachment: (attachment: Omit<WallAttachment, 'id'>) => void;
  updateWallAttachment: (id: string, updates: Partial<WallAttachment>) => void;
  deleteWallAttachment: (id: string) => void;

  // Furniture Actions
  addFurniture: (item: Omit<FurnitureObject, 'id'>) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  setSelectedId: (id: string | null) => void;
  deleteSelected: () => void;
  copySelected: () => void;
  paste: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

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
  saveProject: () => Promise<void>;
  
  // 3D Preview
  show3d: boolean;
  setShow3d: (show: boolean) => void;

  // Helpers
  resetView: () => void;
  fitToScreen: (width: number, height: number) => void;
  newProject: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      scale: 1,
  position: { x: 0, y: 0 },
  mode: 'select',
  activeLayer: 'furniture',
  projectName: 'New Project',
  pixelsPerCm: 1,
  backgroundImage: null,
  backgroundVisible: true,
  backgroundOpacity: 0.5,
  backgroundPosition: { x: 0, y: 0 },
  backgroundScale: 1,
  backgroundRotation: 0,
  calibrationPoints: null,
  tempCalibrationDist: null,
  orthoMode: false,
  snapToGrid: true,
  snapToImage: true,
  gridVisible: true,
  isAltPressed: false,
  edgeMap: null,
  wallThickness: 20,
  wallHeight: 250,
  roomPoints: [],
  rooms: [],
  wallAttachments: [],
  selectedRoomId: null,
  selectedWallIndex: null,
  selectedAttachmentId: null,
  dimensionInput: '',
  furniture: [],
  selectedId: null,
  clipboard: null,
  measurePoints: [],
  lastMeasurement: null,
  dimensions: [],
  selectedDimensionId: null,
  history: [],
  show3d: false,

  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),
  setMode: (mode) => set({ mode, roomPoints: [], measurePoints: [], dimensionInput: '', selectedId: null, selectedRoomId: null, selectedDimensionId: null }),
  setActiveLayer: (activeLayer) => set({ activeLayer, selectedId: null, selectedRoomId: null, selectedDimensionId: null }),
  setPixelsPerCm: (pixelsPerCm) => set({ pixelsPerCm }),
  setProjectName: (projectName) => set({ projectName }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  setBackgroundVisible: (backgroundVisible) => set({ backgroundVisible }),
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
  setSnapToImage: (snapToImage) => set({ snapToImage }),
  setGridVisible: (gridVisible) => set({ gridVisible }),
  setIsAltPressed: (isAltPressed) => set({ isAltPressed }),
  setEdgeMap: (edgeMap) => set({ edgeMap }),
  setWallThickness: (wallThickness) => set({ wallThickness }),
  setWallHeight: (wallHeight) => set({ wallHeight }),

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
    history: [...state.history, { 
      rooms: state.rooms, 
      furniture: state.furniture, 
      dimensions: state.dimensions,
      wallAttachments: state.wallAttachments 
    } as any].slice(-50)
  })),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    return {
      rooms: previous.rooms,
      furniture: previous.furniture,
      dimensions: previous.dimensions,
      wallAttachments: (previous as any).wallAttachments || state.wallAttachments,
      history: state.history.slice(0, -1),
      selectedId: null,
      selectedRoomId: null,
      selectedDimensionId: null,
      selectedAttachmentId: null
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
  setSelectedRoomId: (selectedRoomId) => set({ 
    selectedRoomId,
    selectedWallIndex: null,
    selectedAttachmentId: null,
    selectedId: null,
    selectedDimensionId: null
  }),
  setSelectedWallIndex: (selectedWallIndex) => set({ selectedWallIndex }),
  updateRoom: (id, updates) => set((state) => ({
    rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  deleteRoom: (id) => set((state) => {
    state.saveHistory();
    return {
      rooms: state.rooms.filter(r => r.id !== id),
      wallAttachments: state.wallAttachments.filter(a => a.roomId !== id),
      selectedRoomId: null
    };
  }),
  setSelectedAttachmentId: (selectedAttachmentId) => set({ selectedAttachmentId }),
  addWallAttachment: (attachment) => set((state) => {
    state.saveHistory();
    const newAttachment = { 
      ...attachment, 
      id: Math.random().toString(36).substr(2, 9),
      flipY: true // Default to outside wall
    };
    return { wallAttachments: [...state.wallAttachments, newAttachment] };
  }),
  updateWallAttachment: (id, updates) => set((state) => ({
    wallAttachments: state.wallAttachments.map(a => a.id === id ? { ...a, ...updates } : a)
  })),
  deleteWallAttachment: (id) => set((state) => {
    state.saveHistory();
    return {
      wallAttachments: state.wallAttachments.filter(a => a.id !== id),
      selectedAttachmentId: null
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

  bringToFront: (id) => set((state) => {
    const item = state.furniture.find(f => f.id === id);
    if (!item) return state;
    state.saveHistory();
    return {
      furniture: [...state.furniture.filter(f => f.id !== id), item]
    };
  }),
  sendToBack: (id) => set((state) => {
    const item = state.furniture.find(f => f.id === id);
    if (!item) return state;
    state.saveHistory();
    return {
      furniture: [item, ...state.furniture.filter(f => f.id !== id)]
    };
  }),
  bringForward: (id) => set((state) => {
    const index = state.furniture.findIndex(f => f.id === id);
    if (index === -1 || index === state.furniture.length - 1) return state;
    state.saveHistory();
    const newFurniture = [...state.furniture];
    [newFurniture[index], newFurniture[index + 1]] = [newFurniture[index + 1], newFurniture[index]];
    return { furniture: newFurniture };
  }),
  sendBackward: (id) => set((state) => {
    const index = state.furniture.findIndex(f => f.id === id);
    if (index === -1 || index === 0) return state;
    state.saveHistory();
    const newFurniture = [...state.furniture];
    [newFurniture[index], newFurniture[index - 1]] = [newFurniture[index - 1], newFurniture[index]];
    return { furniture: newFurniture };
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
      furniture: Array.isArray(data.furniture) ? data.furniture : [],
      dimensions: Array.isArray(data.dimensions) ? data.dimensions : [],
      wallAttachments: Array.isArray(data.wallAttachments) 
        ? data.wallAttachments.map((a: any) => ({ ...a, flipY: a.flipY ?? true })) 
        : [],
      pixelsPerCm: (typeof data.pixelsPerCm === 'number' && data.pixelsPerCm > 0) ? data.pixelsPerCm : 1,
      projectName: typeof data.projectName === 'string' ? data.projectName : 'Loaded Project',
      backgroundImage: typeof data.backgroundImage === 'string' ? data.backgroundImage : null,
      backgroundPosition: data.backgroundPosition || { x: 0, y: 0 },
      backgroundScale: typeof data.backgroundScale === 'number' ? data.backgroundScale : 1,
      backgroundRotation: typeof data.backgroundRotation === 'number' ? data.backgroundRotation : 0,
      backgroundOpacity: typeof data.backgroundOpacity === 'number' ? data.backgroundOpacity : 0.5,
      backgroundVisible: typeof data.backgroundVisible === 'boolean' ? data.backgroundVisible : true,
      selectedId: null,
      selectedRoomId: null,
      selectedDimensionId: null,
      roomPoints: [],
      dimensionInput: '',
      history: []
    };
  }),

  saveProject: async () => {
    const state = get();
    const data = {
      projectName: state.projectName,
      rooms: state.rooms,
      furniture: state.furniture,
      dimensions: state.dimensions,
      wallAttachments: state.wallAttachments,
      pixelsPerCm: state.pixelsPerCm,
      backgroundImage: state.backgroundImage,
      backgroundPosition: state.backgroundPosition,
      backgroundScale: state.backgroundScale,
      backgroundRotation: state.backgroundRotation,
      backgroundOpacity: state.backgroundOpacity,
      backgroundVisible: state.backgroundVisible,
      version: '1.0'
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    // Sanitize filename but allow Unicode (Cyrillic etc)
    const sanitizedName = state.projectName.trim() || 'room-plan';
    const fileName = `${sanitizedName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')}.json`;

    // Try modern File System Access API
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Room Plan JSON',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('File Picker failed, falling back to download link', err);
      }
    }

    // Fallback to classic download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },

  setShow3d: (show3d) => set({ show3d }),

  resetView: () => set({ scale: 1, position: { x: 0, y: 0 } }),

  fitToScreen: (width, height) => set((state) => {
    const allPoints: Vector2d[] = [];
    
    state.rooms.forEach(r => allPoints.push(...r.points));
    state.furniture.forEach(f => {
      allPoints.push({ x: f.x, y: f.y });
      allPoints.push({ x: f.x + f.width, y: f.y + f.height });
    });
    state.dimensions.forEach(d => {
      allPoints.push(d.p1);
      allPoints.push(d.p2);
    });

    if (allPoints.length === 0) return { scale: 1, position: { x: 0, y: 0 } };

    const minX = Math.min(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const padding = 50;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in too much, max 1:1

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      scale: newScale,
      position: {
        x: width / 2 - centerX * newScale,
        y: height / 2 - centerY * newScale
      }
    };
  }),

  newProject: () => set({
    rooms: [],
    furniture: [],
    dimensions: [],
    wallAttachments: [],
    backgroundImage: null,
    projectName: 'New Project',
    pixelsPerCm: 1,
    history: [],
    selectedId: null,
    selectedRoomId: null,
    selectedDimensionId: null,
    selectedAttachmentId: null,
    roomPoints: [],
    calibrationPoints: null,
    tempCalibrationDist: null,
    measurePoints: [],
    lastMeasurement: null,
    scale: 1,
    position: { x: 0, y: 0 },
    activeLayer: 'blueprint',
    mode: 'select'
  }),
}), {
  name: 'room-planner-storage',
  partialize: (state) => {
    // Exclude large or temporary fields from localStorage
    const { 
      history, 
      backgroundImage, 
      roomPoints, 
      measurePoints, 
      lastMeasurement,
      clipboard,
      ...rest 
    } = state;
    return rest;
  },
}));
