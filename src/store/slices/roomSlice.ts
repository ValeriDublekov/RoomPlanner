import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { Vector2d, RoomObject, WallAttachment, FurnitureObject } from '../../types';
import { getDistance } from '../../lib/geometry';

export interface RoomSlice {
  roomPoints: Vector2d[];
  rooms: RoomObject[];
  wallAttachments: WallAttachment[];
  selectedRoomId: string | null;
  selectedWallIndex: number | null;
  selectedAttachmentId: string | null;
  dimensionInput: string;
  wallThickness: number;
  wallHeight: number;

  setWallThickness: (thickness: number) => void;
  setWallHeight: (height: number) => void;
  addRoomPoint: (point: Vector2d) => void;
  closeRoom: () => void;
  finishRoom: () => void;
  setDimensionInput: (input: string) => void;
  setSelectedRoomId: (id: string | null) => void;
  setSelectedWallIndex: (index: number | null) => void;
  updateRoom: (id: string, updates: Partial<RoomObject>) => void;
  updateRoomPoint: (roomId: string, pointIndex: number, newPos: Vector2d) => void;
  splitWallSegment: (roomId: string, segmentIndex: number, pos: Vector2d) => void;
  moveWallSegment: (roomId: string, segmentIndex: number, delta: Vector2d) => void;
  removeRoomVertex: (roomId: string, pointIndex: number) => void;
  continueRoom: (roomId: string) => void;
  closeOpenRoom: (roomId: string) => void;
  deleteRoom: (id: string) => void;
  setSelectedAttachmentId: (id: string | null) => void;
  addWallAttachment: (attachment: Omit<WallAttachment, 'id'>) => void;
  updateWallAttachment: (id: string, updates: Partial<WallAttachment>) => void;
  deleteWallAttachment: (id: string) => void;
}

export const createRoomSlice: StateCreator<AppState, [], [], RoomSlice> = (set, get) => ({
  roomPoints: [],
  rooms: [],
  wallAttachments: [],
  selectedRoomId: null,
  selectedWallIndex: null,
  selectedAttachmentId: null,
  dimensionInput: '',
  wallThickness: 20,
  wallHeight: 250,

  setWallThickness: (wallThickness) => set({ wallThickness }),
  setWallHeight: (wallHeight) => set({ wallHeight }),
  
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

    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };

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
      points: uniquePoints,
      isClosed: true
    };

    return {
      rooms: [...state.rooms, newRoom],
      roomPoints: [],
      dimensionInput: '',
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  finishRoom: () => set((state) => {
    if (state.roomPoints.length < 2) return state;
    
    state.saveHistory();
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    
    const newRoom: RoomObject = {
      id: Math.random().toString(36).substr(2, 9),
      points: [...state.roomPoints],
      isClosed: false
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

  updateRoomPoint: (roomId, pointIndex, newPos) => set((state) => ({
    rooms: state.rooms.map(r => {
      if (r.id !== roomId) return r;
      const newPoints = [...r.points];
      newPoints[pointIndex] = newPos;
      return { ...r, points: newPoints };
    })
  })),

  splitWallSegment: (roomId, segmentIndex, pos) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return state;

    const newRooms = state.rooms.map(r => {
      if (r.id !== roomId) return r;
      const newPoints = [...r.points];
      newPoints.splice(segmentIndex + 1, 0, pos);
      return { ...r, points: newPoints };
    });

    const newAttachments = state.wallAttachments.map(a => {
      if (a.roomId !== roomId) return a;
      if (a.wallSegmentIndex > segmentIndex) {
        return { ...a, wallSegmentIndex: a.wallSegmentIndex + 1 };
      }
      if (a.wallSegmentIndex === segmentIndex) {
        if (a.positionAlongWall < 0.5) {
          return { ...a, positionAlongWall: a.positionAlongWall * 2 };
        } else {
          return { ...a, wallSegmentIndex: a.wallSegmentIndex + 1, positionAlongWall: (a.positionAlongWall - 0.5) * 2 };
        }
      }
      return a;
    });

    return { rooms: newRooms, wallAttachments: newAttachments };
  }),

  moveWallSegment: (roomId, segmentIndex, delta) => set((state) => ({
    rooms: state.rooms.map(r => {
      if (r.id !== roomId) return r;
      const newPoints = [...r.points];
      const p1Idx = segmentIndex;
      const p2Idx = (segmentIndex + 1) % r.points.length;
      if (!r.isClosed && segmentIndex === r.points.length - 1) return r;
      newPoints[p1Idx] = { x: newPoints[p1Idx].x + delta.x, y: newPoints[p1Idx].y + delta.y };
      newPoints[p2Idx] = { x: newPoints[p2Idx].x + delta.x, y: newPoints[p2Idx].y + delta.y };
      return { ...r, points: newPoints };
    })
  })),

  removeRoomVertex: (roomId, pointIndex) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room || room.points.length <= 2) return state;

    const newRooms = state.rooms.map(r => {
      if (r.id !== roomId) return r;
      const newPoints = [...r.points];
      newPoints.splice(pointIndex, 1);
      return { ...r, points: newPoints };
    });

    const newAttachments = state.wallAttachments.filter(a => {
      if (a.roomId !== roomId) return true;
      return a.wallSegmentIndex !== pointIndex && a.wallSegmentIndex !== (pointIndex - 1 + room.points.length) % room.points.length;
    }).map(a => {
      if (a.roomId !== roomId) return a;
      if (a.wallSegmentIndex > pointIndex) {
        return { ...a, wallSegmentIndex: a.wallSegmentIndex - 1 };
      }
      return a;
    });

    return { rooms: newRooms, wallAttachments: newAttachments };
  }),

  continueRoom: (roomId) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return state;
    
    state.saveHistory();
    return {
      roomPoints: [...room.points],
      rooms: state.rooms.filter(r => r.id !== roomId),
      wallAttachments: state.wallAttachments.filter(a => a.roomId !== roomId),
      mode: 'draw-room',
      selectedRoomId: null
    };
  }),

  closeOpenRoom: (roomId) => set((state) => {
    state.saveHistory();
    return {
      rooms: state.rooms.map(r => r.id === roomId ? { ...r, isClosed: true } : r),
      selectedRoomId: roomId
    };
  }),

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
    const newAttachment: WallAttachment = { 
      ...attachment, 
      id: Math.random().toString(36).substr(2, 9),
      flipY: true,
      curtainType: 'none',
      frameColor: '#ffffff',
      thinCurtainColor: '#ffffff',
      thickCurtainColor: '#f1f5f9'
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
});
