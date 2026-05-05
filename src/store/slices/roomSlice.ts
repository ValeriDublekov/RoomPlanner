import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { Vector2d, RoomObject, WallAttachment, FurnitureObject, BeamObject, WallSnap, Vertex, Edge, BeamAttachment } from '../../types';
import { getDistance, getWallPath, splitRoomPolygons, isInteriorSplit } from '../../lib/geometry';
import { getRoomVertices, getOrderedVertexIds } from '../../lib/geometry/topology';
import { INTERIOR_THEMES } from '../../lib/themes';

const syncBeams = (rooms: RoomObject[], beams: BeamObject[]): BeamObject[] => {
  return beams.map(beam => {
    if (!beam.p1Attachment && !beam.p2Attachment) return beam;

    let newP1 = { ...beam.p1 };
    let newP2 = { ...beam.p2 };

    if (beam.p1Attachment) {
      const room = rooms.find(r => r.id === beam.p1Attachment?.roomId);
      if (room) {
        const points = getRoomVertices(room);
        const p1 = points[beam.p1Attachment.wallIndex];
        const p2 = points[(beam.p1Attachment.wallIndex + 1) % points.length];
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
        const points = getRoomVertices(room);
        const p1 = points[beam.p2Attachment.wallIndex];
        const p2 = points[(beam.p2Attachment.wallIndex + 1) % points.length];
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

const generateTopology = (points: Vector2d[], isClosed: boolean) => {
  const vertices = points.map((p) => ({ 
    id: Math.random().toString(36).substr(2, 9), 
    x: p.x, 
    y: p.y 
  }));
  
  const startVertexId = vertices.length > 0 ? vertices[0].id : undefined;
  const edgeCount = isClosed ? vertices.length : vertices.length - 1;
  const edges = [];
  
  for (let i = 0; i < edgeCount; i++) {
    edges.push({
      id: Math.random().toString(36).substr(2, 9),
      startVertexId: vertices[i].id,
      endVertexId: vertices[(i + 1) % vertices.length].id
    });
  }
  
  return { vertices, edges, startVertexId };
};

export interface RoomSlice {
  roomPoints: Vector2d[];
  roomPointsSnaps: (WallSnap | undefined)[];
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
  addRoomPoint: (point: Vector2d, snap?: WallSnap) => void;
  clearRoomPoints: () => void;
  closeRoom: () => void;
  closeRoomWithWall: (endSnap: WallSnap) => void;
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
  roomPointsSnaps: [],
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
  
  addRoomPoint: (point, snap) => set((state) => ({ 
    roomPoints: [...state.roomPoints, point],
    roomPointsSnaps: [...state.roomPointsSnaps, snap]
  })),
  
  clearRoomPoints: () => set({ roomPoints: [], roomPointsSnaps: [] }),
  
  closeRoom: () => set((state) => {
    if (state.roomPoints.length < 3) return { roomPoints: [], roomPointsSnaps: [], dimensionInput: '' };
    
    const uniquePoints = state.roomPoints.filter((p, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      const dist = getDistance(p, prev);
      return dist > 0.1;
    });

    if (uniquePoints.length < 3) return { roomPoints: [], roomPointsSnaps: [], dimensionInput: '' };

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
        roomPointsSnaps: [],
        mode: 'select',
        selectedId: newFurniture.id,
        history: [...state.history, historyEntry].slice(-50)
      };
    }

    const activeThemeId = state.activeThemeId;
    const activeTheme = INTERIOR_THEMES.find(t => t.id === activeThemeId);

    const { vertices, edges, startVertexId } = generateTopology(uniquePoints, true);
    const newRoom: RoomObject = {
      id: Math.random().toString(36).substr(2, 9),
      vertices,
      edges,
      startVertexId,
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
      roomPointsSnaps: [],
      dimensionInput: '',
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  closeRoomWithWall: (endSnap) => {
    const state = get();
    const startSnap = state.roomPointsSnaps[0];
    if (!startSnap || startSnap.roomId !== endSnap.roomId || state.roomPoints.length < 1) {
      return; 
    }

    const room = state.rooms.find(r => r.id === startSnap.roomId);
    if (!room) return;

    const points = getRoomVertices(room);
    const p1 = points[endSnap.segmentIndex];
    const p2 = points[(endSnap.segmentIndex + 1) % points.length];
    const endPoint = {
      x: p1.x + endSnap.t * (p2.x - p1.x),
      y: p1.y + endSnap.t * (p2.y - p1.y)
    };

    const isSplit = isInteriorSplit(room, state.roomPoints, endPoint, startSnap);
    
    state.saveHistory();
    const activeThemeId = state.activeThemeId;
    const activeTheme = INTERIOR_THEMES.find(t => t.id === activeThemeId);

    if (isSplit) {
      const { room1Points, room2Points } = splitRoomPolygons(
        room,
        state.roomPoints,
        endPoint,
        startSnap,
        endSnap
      );

      // Identify which segments are internal
      // In r1, the segments from drawnPoints start to endPoint are internal.
      // drawnPoints.length is the number of segments in the split line.
      const splitLineSegmentCount = state.roomPoints.length;
      const internalR1 = room1Points.map((_, i) => i < splitLineSegmentCount);
      const internalR2 = room2Points.map((_, i) => i < splitLineSegmentCount);

      const { vertices: v1, edges: e1, startVertexId: s1 } = generateTopology(room1Points, true);
      const r1: RoomObject = {
        id: Math.random().toString(36).substr(2, 9),
        vertices: v1,
        edges: e1,
        startVertexId: s1,
        isClosed: true,
        wallTypes: room1Points.map(() => 'wall'),
        internalWalls: internalR1,
        railingStyles: room1Points.map(() => 'metal-bars'),
        materials: room.materials || {
          wallBase: { 
            source: 'theme', 
            value: activeTheme ? activeTheme.wallColors.base : '#f8fafc' 
          }
        }
      };

      const { vertices: v2, edges: e2, startVertexId: s2 } = generateTopology(room2Points, true);
      const r2: RoomObject = {
        id: Math.random().toString(36).substr(2, 9),
        vertices: v2,
        edges: e2,
        startVertexId: s2,
        isClosed: true,
        wallTypes: room2Points.map(() => 'wall'),
        internalWalls: internalR2,
        railingStyles: room2Points.map(() => 'metal-bars'),
        materials: room.materials || {
          wallBase: { 
            source: 'theme', 
            value: activeTheme ? activeTheme.wallColors.base : '#f8fafc' 
          }
        }
      };

      set({
        rooms: [...state.rooms.filter(r => r.id !== room.id), r1, r2],
        roomPoints: [],
        roomPointsSnaps: [],
        dimensionInput: ''
      });
    } else {
      // Classic attachment logic
      const path = getWallPath(room, endSnap, startSnap);
      const finalPoints = [...state.roomPoints, endPoint, ...path];
      
      if (finalPoints.length < 3) return;

      const { vertices: vf, edges: ef, startVertexId: sf } = generateTopology(finalPoints, true);
      const newRoom: RoomObject = {
        id: Math.random().toString(36).substr(2, 9),
        vertices: vf,
        edges: ef,
        startVertexId: sf,
        isClosed: true,
        wallTypes: finalPoints.map(() => 'wall'),
        railingStyles: finalPoints.map(() => 'metal-bars'),
        materials: {
          wallBase: { 
            source: 'theme', 
            value: activeTheme ? activeTheme.wallColors.base : '#f8fafc' 
          }
        }
      };

      set({
        rooms: [...state.rooms, newRoom],
        roomPoints: [],
        roomPointsSnaps: [],
        dimensionInput: ''
      });
    }
  },

  finishRoom: () => set((state) => {
    if (state.roomPoints.length < 2) return state;
    
    state.saveHistory();
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    
    const activeThemeId = state.activeThemeId;
    const activeTheme = INTERIOR_THEMES.find(t => t.id === activeThemeId);

    const { vertices, edges, startVertexId } = generateTopology(state.roomPoints, false);
    const newRoom: RoomObject = {
      id: Math.random().toString(36).substr(2, 9),
      vertices,
      edges,
      startVertexId,
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
      
      // Topology-first update
      const orderedIds = getOrderedVertexIds(r);
      const vertexId = orderedIds[pointIndex];
      
      if (vertexId) {
        const updatedVertices = r.vertices.map(v => 
          v.id === vertexId ? { ...v, x: newPos.x, y: newPos.y } : v
        );
        return { ...r, vertices: updatedVertices };
      }
      
      return r;
    });
    return {
      rooms: newRooms,
      beams: syncBeams(newRooms, state.beams)
    };
  }),

  splitWallSegment: (roomId, segmentIndex, pos) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return state;

    const orderedIds = getOrderedVertexIds(room);
    const n = orderedIds.length;
    if (segmentIndex < 0 || segmentIndex >= (room.isClosed ? n : n - 1)) return state;

    const v1Id = orderedIds[segmentIndex];
    const v2Id = orderedIds[(segmentIndex + 1) % n];

    // Get coordinates for t-calculation
    const vertices = room.vertices || [];
    const v1 = vertices.find(v => v.id === v1Id);
    const v2 = vertices.find(v => v.id === v2Id);
    if (!v1 || !v2) return state;

    const d1 = getDistance(v1, pos);
    const d2 = getDistance(pos, v2);
    const tSplit = (d1 + d2) > 0.001 ? d1 / (d1 + d2) : 0.5;

    const newVertexId = Math.random().toString(36).substr(2, 9);
    const newVertex: Vertex = { id: newVertexId, x: pos.x, y: pos.y };

    const newEdge1: Edge = { id: Math.random().toString(36).substr(2, 9), startVertexId: v1Id, endVertexId: newVertexId };
    const newEdge2: Edge = { id: Math.random().toString(36).substr(2, 9), startVertexId: newVertexId, endVertexId: v2Id };

    const newRooms = state.rooms.map(r => {
      if (r.id !== roomId) return r;
      
      const updatedVertices = [...r.vertices, newVertex];
      // Replace the old edge connecting v1 and v2 with two new ones
      const updatedEdges = r.edges.filter(e => !(e.startVertexId === v1Id && e.endVertexId === v2Id));
      updatedEdges.push(newEdge1, newEdge2);

      const splitArr = <T>(arr: T[] | undefined): T[] | undefined => {
        if (!arr) return arr;
        const result = [...arr];
        if (result.length > segmentIndex) {
          result.splice(segmentIndex + 1, 0, result[segmentIndex]);
        }
        return result;
      };

      const updated = {
        ...r,
        vertices: updatedVertices,
        edges: updatedEdges,
        wallColors: splitArr(r.wallColors),
        wallTypes: splitArr(r.wallTypes),
        railingStyles: splitArr(r.railingStyles),
        internalWalls: splitArr(r.internalWalls),
      };
      return updated;
    });

    const remapT = (t: number): { offset: number, newT: number } => {
      if (t < tSplit) {
        return { offset: 0, newT: tSplit > 0.001 ? t / tSplit : 0 };
      } else {
        return { offset: 1, newT: (1 - tSplit) > 0.001 ? (t - tSplit) / (1 - tSplit) : 0 };
      }
    };

    const newAttachments = state.wallAttachments.map(a => {
      if (a.roomId !== roomId) return a;
      if (a.wallSegmentIndex > segmentIndex) {
        return { ...a, wallSegmentIndex: a.wallSegmentIndex + 1 };
      }
      if (a.wallSegmentIndex === segmentIndex) {
        const { offset, newT } = remapT(a.positionAlongWall);
        return { ...a, wallSegmentIndex: a.wallSegmentIndex + offset, positionAlongWall: newT };
      }
      return a;
    });

    const newBeams = state.beams.map(b => {
      let updatedP1 = b.p1Attachment;
      let updatedP2 = b.p2Attachment;

      if (updatedP1 && updatedP1.roomId === roomId) {
        if (updatedP1.wallIndex > segmentIndex) {
          updatedP1 = { ...updatedP1, wallIndex: updatedP1.wallIndex + 1 };
        } else if (updatedP1.wallIndex === segmentIndex) {
          const { offset, newT } = remapT(updatedP1.t);
          updatedP1 = { ...updatedP1, wallIndex: updatedP1.wallIndex + offset, t: newT };
        }
      }
      if (updatedP2 && updatedP2.roomId === roomId) {
        if (updatedP2.wallIndex > segmentIndex) {
          updatedP2 = { ...updatedP2, wallIndex: updatedP2.wallIndex + 1 };
        } else if (updatedP2.wallIndex === segmentIndex) {
          const { offset, newT } = remapT(updatedP2.t);
          updatedP2 = { ...updatedP2, wallIndex: updatedP2.wallIndex + offset, t: newT };
        }
      }

      if (updatedP1 !== b.p1Attachment || updatedP2 !== b.p2Attachment) {
        return { ...b, p1Attachment: updatedP1, p2Attachment: updatedP2 };
      }
      return b;
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
      
      const orderedIds = getOrderedVertexIds(r);
      const n = orderedIds.length;
      if (n === 0) return r;
      
      const p1Idx = segmentIndex;
      const p2Idx = (segmentIndex + 1) % n;
      
      // If open room and moving last segment, only p1 move is valid for segmentIndex
      // because segmentIndex i connects vertex i and i+1.
      if (!r.isClosed && segmentIndex >= n - 1) return r;

      const v1Id = orderedIds[p1Idx];
      const v2Id = orderedIds[p2Idx];

      const updatedVertices = r.vertices.map(v => {
        if (v.id === v1Id || v.id === v2Id) {
          return { ...v, x: v.x + delta.x, y: v.y + delta.y };
        }
        return v;
      });
      return { ...r, vertices: updatedVertices };
    });

    return {
      rooms: newRooms,
      beams: syncBeams(newRooms, state.beams)
    };
  }),

  removeRoomVertex: (roomId, pointIndex) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return state;
    
    const orderedIds = getOrderedVertexIds(room);
    const n = orderedIds.length;
    if (n <= (room.isClosed ? 3 : 2)) return state;

    const vertexIdToRemove = orderedIds[pointIndex];
    
    // Geometry for remapping
    const oldPoints = getRoomVertices(room);
    const prevSegIdx = (pointIndex - 1 + n) % n;
    const currSegIdx = pointIndex;
    
    const pPrev = oldPoints[prevSegIdx];
    const pCurr = oldPoints[pointIndex];
    const pNext = oldPoints[(pointIndex + 1) % n];

    const l1 = pPrev && pCurr ? getDistance(pPrev, pCurr) : 0;
    const l2 = pCurr && pNext ? getDistance(pCurr, pNext) : 0;
    const lTotal = l1 + l2;

    const updatedRooms = state.rooms.map(r => {
      if (r.id !== roomId) return r;
      
      const newVertices = r.vertices.filter(v => v.id !== vertexIdToRemove);
      
      // Bridge the gap in edges
      const inEdge = r.edges.find(e => e.endVertexId === vertexIdToRemove);
      const outEdge = r.edges.find(e => e.startVertexId === vertexIdToRemove);
      
      const newEdges = r.edges.filter(e => e.id !== inEdge?.id && e.id !== outEdge?.id);
      
      if (inEdge && outEdge && inEdge.id !== outEdge.id) {
        newEdges.push({
          id: Math.random().toString(36).substr(2, 9),
          startVertexId: inEdge.startVertexId,
          endVertexId: outEdge.endVertexId
        });
      }

      const removeIdx = (arr: any[] | undefined) => {
        if (!arr) return arr;
        const res = [...arr];
        if (res.length > pointIndex) {
          res.splice(pointIndex, 1);
        }
        return res;
      };

      const updated = {
        ...r,
        vertices: newVertices,
        edges: newEdges,
        wallColors: removeIdx(r.wallColors),
        wallTypes: removeIdx(r.wallTypes),
        railingStyles: removeIdx(r.railingStyles),
        internalWalls: removeIdx(r.internalWalls),
      };
      return updated;
    });

    const remapT = (t: number, isL2: boolean): number => {
      if (lTotal < 0.001) return 0.5;
      return isL2 ? (l1 + t * l2) / lTotal : (t * l1) / lTotal;
    };

    const newAttachments = state.wallAttachments.map(a => {
      if (a.roomId !== roomId) return a;
      
      if (a.wallSegmentIndex === prevSegIdx) {
        return { ...a, positionAlongWall: remapT(a.positionAlongWall, false) };
      }
      if (a.wallSegmentIndex === currSegIdx) {
        // If it was on second merged part, move back to prevSegIdx
        return { ...a, wallSegmentIndex: prevSegIdx, positionAlongWall: remapT(a.positionAlongWall, true) };
      }
      if (a.wallSegmentIndex > pointIndex) {
        return { ...a, wallSegmentIndex: a.wallSegmentIndex - 1 };
      }
      return a;
    });

    const newBeams = state.beams.map(b => {
      const b1 = b.p1Attachment;
      const b2 = b.p2Attachment;

      const remapBeam = (att: BeamAttachment | undefined) => {
        if (!att || att.roomId !== roomId) return att;
        if (att.wallIndex === prevSegIdx) {
          return { ...att, t: remapT(att.t, false) };
        }
        if (att.wallIndex === currSegIdx) {
          return { ...att, wallIndex: prevSegIdx, t: remapT(att.t, true) };
        }
        if (att.wallIndex > pointIndex) {
          return { ...att, wallIndex: att.wallIndex - 1 };
        }
        return att;
      };

      const updatedP1 = remapBeam(b1);
      const updatedP2 = remapBeam(b2);

      if (updatedP1 !== b1 || updatedP2 !== b2) {
        return { ...b, p1Attachment: updatedP1, p2Attachment: updatedP2 };
      }
      return b;
    });

    return { 
      rooms: updatedRooms, 
      wallAttachments: newAttachments,
      beams: syncBeams(updatedRooms, newBeams)
    };
  }),

  continueRoom: (roomId) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return state;
    
    state.saveHistory();
    return {
      roomPoints: [...getRoomVertices(room)],
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
