import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { Vector2d, RoomObject, WallAttachment, FurnitureObject, BeamObject } from '../../types';
import { getDistance } from '../../lib/geometry';
import { INTERIOR_THEMES } from '../../lib/themes';

const syncBeams = (rooms: RoomObject[], beams: BeamObject[]): BeamObject[] => {
  return beams.map(beam => {
    if (!beam.p1Attachment && !beam.p2Attachment) return beam;

    let newP1 = { ...beam.p1 };
    let newP2 = { ...beam.p2 };

    if (beam.p1Attachment) {
      const room = rooms.find(r => r.id === beam.p1Attachment?.roomId);
      if (room) {
        const p1 = room.points[beam.p1Attachment.wallIndex];
        const p2 = room.points[(beam.p1Attachment.wallIndex + 1) % room.points.length];
        if (p1 && p2) {
          const t = beam.p1Attachment.t;
          newP1 = {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
          };
          console.log(`[syncBeams] Updated p1 for beam ${beam.id}`, { t, newP1, wallIdx: beam.p1Attachment.wallIndex });
        }
      }
    }

    if (beam.p2Attachment) {
      const room = rooms.find(r => r.id === beam.p2Attachment?.roomId);
      if (room) {
        const p1 = room.points[beam.p2Attachment.wallIndex];
        const p2 = room.points[(beam.p2Attachment.wallIndex + 1) % room.points.length];
        if (p1 && p2) {
          const t = beam.p2Attachment.t;
          newP2 = {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
          };
          console.log(`[syncBeams] Updated p2 for beam ${beam.id}`, { t, newP2, wallIdx: beam.p2Attachment.wallIndex });
        }
      }
    }

    return { ...beam, p1: newP1, p2: newP2 };
  });
};

export interface RoomSlice {
  roomPoints: Vector2d[];
  rooms: RoomObject[];
  wallAttachments: WallAttachment[];
  beams: BeamObject[];
  selectedRoomId: string | null;
  selectedWallIndex: number | null;
  selectedAttachmentId: string | null;
  selectedBeamId: string | null;
  dimensionInput: string;
  wallThickness: number;
  wallHeight: number;

  setWallThickness: (thickness: number) => void;
  setWallHeight: (height: number) => void;
  addRoomPoint: (point: Vector2d) => void;
  clearRoomPoints: () => void;
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
  flipSelectedAttachment: () => void;
  addBeam: (beam: BeamObject) => void;
  updateBeam: (id: string, updates: Partial<BeamObject>) => void;
  deleteBeam: (id: string) => void;
  setSelectedBeamId: (id: string | null) => void;
}

export const createRoomSlice: StateCreator<AppState, [], [], RoomSlice> = (set, get) => ({
  roomPoints: [],
  rooms: [],
  wallAttachments: [],
  beams: [],
  selectedRoomId: null,
  selectedWallIndex: null,
  selectedAttachmentId: null,
  selectedBeamId: null,
  dimensionInput: '',
  wallThickness: 20,
  wallHeight: 250,

  setWallThickness: (wallThickness) => set({ wallThickness }),
  setWallHeight: (wallHeight) => set((state) => {
    // Automatically update air conditioners to stay near the new ceiling height
    const newFurniture = state.furniture.map(f => {
      if (f.furnitureType === 'air-conditioner') {
        const acHeightPx = f.height3d || (30 * state.pixelsPerCm);
        const wallHeightPx = wallHeight * state.pixelsPerCm;
        const gapPx = 10 * state.pixelsPerCm;
        return { ...f, elevation: wallHeightPx - acHeightPx - gapPx };
      }
      return f;
    });
    return { wallHeight, furniture: newFurniture };
  }),
  
  addRoomPoint: (point) => set((state) => ({ roomPoints: [...state.roomPoints, point] })),
  
  clearRoomPoints: () => set({ roomPoints: [] }),
  
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

    const activeThemeId = state.activeThemeId;
    const activeTheme = INTERIOR_THEMES.find(t => t.id === activeThemeId);

    const newRoom: RoomObject = {
      id: Math.random().toString(36).substr(2, 9),
      points: uniquePoints,
      isClosed: true,
      wallTypes: uniquePoints.map(() => 'wall'),
      railingStyles: uniquePoints.map(() => 'metal-bars'),
      materials: {
        wallBase: { 
          source: 'theme', 
          value: activeTheme ? activeTheme.wallColors.base : '#f8fafc' 
        }
      }
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
    
    const activeThemeId = state.activeThemeId;
    const activeTheme = INTERIOR_THEMES.find(t => t.id === activeThemeId);

    const newRoom: RoomObject = {
      id: Math.random().toString(36).substr(2, 9),
      points: [...state.roomPoints],
      isClosed: false,
      wallTypes: state.roomPoints.map(() => 'wall'),
      railingStyles: state.roomPoints.map(() => 'metal-bars'),
      materials: {
        wallBase: { 
          source: 'theme', 
          value: activeTheme ? activeTheme.wallColors.base : '#f8fafc' 
        }
      }
    };

    return {
      rooms: [...state.rooms, newRoom],
      roomPoints: [],
      dimensionInput: '',
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  setDimensionInput: (dimensionInput) => set({ dimensionInput }),
  
  setSelectedRoomId: (selectedRoomId) => {
    console.log('setSelectedRoomId called with:', selectedRoomId);
    set({ 
      selectedRoomId,
      selectedWallIndex: null,
      selectedAttachmentId: null,
      selectedId: null,
      selectedIds: [],
      selectedBeamId: null,
      selectedDimensionId: null
    });
  },

  setSelectedWallIndex: (selectedWallIndex) => {
    console.log('setSelectedWallIndex called with:', selectedWallIndex);
    set({ selectedWallIndex });
  },
  
  updateRoom: (id, updates) => set((state) => ({
    rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  updateRoomPoint: (roomId, pointIndex, newPos) => set((state) => {
    const newRooms = state.rooms.map(r => {
      if (r.id !== roomId) return r;
      const newPoints = [...r.points];
      newPoints[pointIndex] = newPos;
      return { ...r, points: newPoints };
    });
    return {
      rooms: newRooms,
      beams: syncBeams(newRooms, state.beams)
    };
  }),

  splitWallSegment: (roomId, segmentIndex, pos) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return state;

    const newRooms = state.rooms.map(r => {
      if (r.id !== roomId) return r;
      const newPoints = [...r.points];
      newPoints.splice(segmentIndex + 1, 0, pos);
      
      const newWallColors = [...(r.wallColors || [])];
      if (newWallColors.length > segmentIndex) {
        newWallColors.splice(segmentIndex + 1, 0, newWallColors[segmentIndex] || '');
      }
      
      const newWallTypes = [...(r.wallTypes || [])];
      if (newWallTypes.length > segmentIndex) {
        newWallTypes.splice(segmentIndex + 1, 0, newWallTypes[segmentIndex] || 'wall');
      }

      const newRailingStyles = [...(r.railingStyles || [])];
      if (newRailingStyles.length > segmentIndex) {
        newRailingStyles.splice(segmentIndex + 1, 0, newRailingStyles[segmentIndex] || 'metal-bars');
      }

      return { 
        ...r, 
        points: newPoints,
        wallColors: newWallColors,
        wallTypes: newWallTypes,
        railingStyles: newRailingStyles
      };
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

    const newBeams = state.beams.map(b => {
      const updated = { ...b };
      if (b.p1Attachment && b.p1Attachment.roomId === roomId) {
        if (b.p1Attachment.wallIndex > segmentIndex) {
          updated.p1Attachment = { ...b.p1Attachment, wallIndex: b.p1Attachment.wallIndex + 1 };
        } else if (b.p1Attachment.wallIndex === segmentIndex) {
          if (b.p1Attachment.t < 0.5) {
            updated.p1Attachment = { ...b.p1Attachment, t: b.p1Attachment.t * 2 };
          } else {
            updated.p1Attachment = { ...b.p1Attachment, wallIndex: b.p1Attachment.wallIndex + 1, t: (b.p1Attachment.t - 0.5) * 2 };
          }
        }
      }
      if (b.p2Attachment && b.p2Attachment.roomId === roomId) {
        if (b.p2Attachment.wallIndex > segmentIndex) {
          updated.p2Attachment = { ...b.p2Attachment, wallIndex: b.p2Attachment.wallIndex + 1 };
        } else if (b.p2Attachment.wallIndex === segmentIndex) {
          if (b.p2Attachment.t < 0.5) {
            updated.p2Attachment = { ...b.p2Attachment, t: b.p2Attachment.t * 2 };
          } else {
            updated.p2Attachment = { ...b.p2Attachment, wallIndex: b.p2Attachment.wallIndex + 1, t: (b.p2Attachment.t - 0.5) * 2 };
          }
        }
      }
      return updated;
    });

    return { 
      rooms: newRooms, 
      wallAttachments: newAttachments,
      beams: syncBeams(newRooms, newBeams)
    };
  }),

  moveWallSegment: (roomId, segmentIndex, delta) => set((state) => {
    const newRooms = state.rooms.map(r => {
      if (r.id !== roomId) return r;
      const newPoints = [...r.points];
      const p1Idx = segmentIndex;
      const p2Idx = (segmentIndex + 1) % r.points.length;
      if (!r.isClosed && segmentIndex === r.points.length - 1) return r;
      newPoints[p1Idx] = { x: newPoints[p1Idx].x + delta.x, y: newPoints[p1Idx].y + delta.y };
      newPoints[p2Idx] = { x: newPoints[p2Idx].x + delta.x, y: newPoints[p2Idx].y + delta.y };
      return { ...r, points: newPoints };
    });
    return {
      rooms: newRooms,
      beams: syncBeams(newRooms, state.beams)
    };
  }),

  removeRoomVertex: (roomId, pointIndex) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room || room.points.length <= 2) return state;

    const newRooms = state.rooms.map(r => {
      if (r.id !== roomId) return r;
      const newPoints = [...r.points];
      newPoints.splice(pointIndex, 1);
      
      const newWallColors = [...(r.wallColors || [])];
      if (newWallColors.length > pointIndex) {
        newWallColors.splice(pointIndex, 1);
      }
      
      const newWallTypes = [...(r.wallTypes || [])];
      if (newWallTypes.length > pointIndex) {
        newWallTypes.splice(pointIndex, 1);
      }

      const newRailingStyles = [...(r.railingStyles || [])];
      if (newRailingStyles.length > pointIndex) {
        newRailingStyles.splice(pointIndex, 1);
      }

      return { 
        ...r, 
        points: newPoints,
        wallColors: newWallColors,
        wallTypes: newWallTypes,
        railingStyles: newRailingStyles
      };
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

    const newBeams = state.beams.filter(b => {
      const p1Att = b.p1Attachment;
      const p2Att = b.p2Attachment;
      if (p1Att && p1Att.roomId === roomId) {
        if (p1Att.wallIndex === pointIndex || p1Att.wallIndex === (pointIndex - 1 + room.points.length) % room.points.length) return false;
      }
      if (p2Att && p2Att.roomId === roomId) {
        if (p2Att.wallIndex === pointIndex || p2Att.wallIndex === (pointIndex - 1 + room.points.length) % room.points.length) return false;
      }
      return true;
    }).map(b => {
      const updated = { ...b };
      if (updated.p1Attachment && updated.p1Attachment.roomId === roomId && updated.p1Attachment.wallIndex > pointIndex) {
        updated.p1Attachment = { ...updated.p1Attachment, wallIndex: updated.p1Attachment.wallIndex - 1 };
      }
      if (updated.p2Attachment && updated.p2Attachment.roomId === roomId && updated.p2Attachment.wallIndex > pointIndex) {
        updated.p2Attachment = { ...updated.p2Attachment, wallIndex: updated.p2Attachment.wallIndex - 1 };
      }
      return updated;
    });

    return { 
      rooms: newRooms, 
      wallAttachments: newAttachments,
      beams: syncBeams(newRooms, newBeams)
    };
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

  setSelectedAttachmentId: (id) => set({ 
    selectedAttachmentId: id,
    selectedId: null,
    selectedIds: [],
    selectedRoomId: null,
    selectedWallIndex: null,
    selectedBeamId: null,
    selectedDimensionId: null
  }),
  
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
  
  flipSelectedAttachment: () => set((state) => {
    if (!state.selectedAttachmentId) return state;
    const attachment = state.wallAttachments.find(a => a.id === state.selectedAttachmentId);
    if (!attachment || attachment.type !== 'door') return state;

    const updates: Partial<WallAttachment> = {};
    if (!attachment.flipX && !attachment.flipY) {
      updates.flipX = true;
    } else if (attachment.flipX && !attachment.flipY) {
      updates.flipY = true;
    } else if (attachment.flipX && attachment.flipY) {
      updates.flipX = false;
    } else {
      updates.flipX = false;
      updates.flipY = false;
    }

    return {
      wallAttachments: state.wallAttachments.map(a => a.id === attachment.id ? { ...a, ...updates } : a)
    };
  }),
  
  addBeam: (beam) => set((state) => {
    state.saveHistory();
    const newBeam: BeamObject = {
      ...beam,
      colorType: 'manual',
      manualColor: beam.color
    };
    return { beams: [...state.beams, newBeam] };
  }),

  updateBeam: (id, updates) => set((state) => ({
    beams: state.beams.map(b => b.id === id ? { ...b, ...updates } : b)
  })),

  deleteBeam: (id) => set((state) => {
    state.saveHistory();
    return {
      beams: state.beams.filter(b => b.id !== id),
      selectedBeamId: null
    };
  }),

  setSelectedBeamId: (id) => {
    console.log('setSelectedBeamId called with:', id);
    set({ 
      selectedBeamId: id,
      selectedId: null,
      selectedIds: [],
      selectedRoomId: null,
      selectedWallIndex: null,
      selectedAttachmentId: null,
      selectedDimensionId: null
    });
  },
});
