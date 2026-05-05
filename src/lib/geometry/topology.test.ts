import { describe, it, expect } from 'vitest';
import { getWallPath, isInteriorSplit, splitRoomPolygons, getRoomVertices, getOrderedVertexIds } from './topology';
import { RoomObject, WallSnap, Vector2d } from '../../types';

describe('topology helpers', () => {
  const mockRoom: RoomObject = {
    id: 'r1',
    vertices: [
      { id: 'v0', x: 0, y: 0 },
      { id: 'v1', x: 100, y: 0 },
      { id: 'v2', x: 100, y: 100 },
      { id: 'v3', x: 0, y: 100 }
    ],
    edges: [
      { id: 'e0', startVertexId: 'v0', endVertexId: 'v1' },
      { id: 'e1', startVertexId: 'v1', endVertexId: 'v2' },
      { id: 'e2', startVertexId: 'v2', endVertexId: 'v3' },
      { id: 'e3', startVertexId: 'v3', endVertexId: 'v0' }
    ],
    isClosed: true
  };

  it('getOrderedVertexIds returns IDs in sequence for closed rooms', () => {
    const room: RoomObject = {
      id: 'r1',
      vertices: [
        { id: 'v1', x: 100, y: 0 },
        { id: 'v0', x: 0, y: 0 },
        { id: 'v2', x: 100, y: 100 },
      ],
      edges: [
        { id: 'e1', startVertexId: 'v0', endVertexId: 'v1' },
        { id: 'e2', startVertexId: 'v1', endVertexId: 'v2' },
        { id: 'e3', startVertexId: 'v2', endVertexId: 'v0' }
      ],
      isClosed: true
    };
    // Should start at vertices[0] = v1. Order: v1 -> v2 -> v0
    expect(getOrderedVertexIds(room)).toEqual(['v1', 'v2', 'v0']);
  });

  it('getOrderedVertexIds finds the start of a chain for open rooms', () => {
    const room: RoomObject = {
      id: 'r1',
      vertices: [
        { id: 'v1', x: 100, y: 0 },
        { id: 'v0', x: 0, y: 0 }, // v0 is start of chain (no incoming)
        { id: 'v2', x: 100, y: 100 },
      ],
      edges: [
        { id: 'e1', startVertexId: 'v0', endVertexId: 'v1' },
        { id: 'e2', startVertexId: 'v1', endVertexId: 'v2' }
      ],
      isClosed: false
    };
    // Should detect v0 as start. Order: v0, v1, v2
    expect(getOrderedVertexIds(room)).toEqual(['v0', 'v1', 'v2']);
  });

  it('getWallPath returns vertices between snaps', () => {
    // Start on P0-P1 (segment 0) at t=0.5 -> (50, 0)
    const startSnap: WallSnap = { roomId: 'r1', segmentIndex: 0, t: 0.5 };
    // End on P2-P3 (segment 2) at t=0.5 -> (50, 100)
    const endSnap: WallSnap = { roomId: 'r1', segmentIndex: 2, t: 0.5 };

    // Path from end to start (forward)
    // End is on segment 2. Next vertex is P3 (idx 3).
    // Start is on segment 0. Next vertex is P1 (idx 1).
    // vertices: P3, P0.
    const path = getWallPath(mockRoom, endSnap, startSnap);
    expect(path).toEqual([{ x: 0, y: 100 }, { x: 0, y: 0 }]);
  });

  it('getWallPath returns the other set of vertices when swapped', () => {
    const startSnap: WallSnap = { roomId: 'r1', segmentIndex: 0, t: 0.5 };
    const endSnap: WallSnap = { roomId: 'r1', segmentIndex: 2, t: 0.5 };

    // Path from start to end (forward)
    // Start is on segment 0. Next vertex is P1 (idx 1).
    // End is on segment 2. Next vertex is P3 (idx 3).
    // vertices: P1, P2.
    const path = getWallPath(mockRoom, startSnap, endSnap);
    expect(path).toEqual([{ x: 100, y: 0 }, { x: 100, y: 100 }]);
  });

  it('generates two valid room polygons for a rectangle midpoint-to-midpoint split', () => {
    // Square (0,0) to (100,100)
    // P0: (0,0), P1: (100,0), P2: (100,100), P3: (0,100)
    const mid1Snap: WallSnap = { roomId: 'r1', segmentIndex: 0, t: 0.5 }; // (50, 0)
    const mid2Snap: WallSnap = { roomId: 'r1', segmentIndex: 2, t: 0.5 }; // (50, 100)
    
    const A = { x: 50, y: 0 };
    const B = { x: 50, y: 100 };

    const { room1Points, room2Points } = splitRoomPolygons(mockRoom, [A], B, mid1Snap, mid2Snap);

    // Path BA: from mid2 to mid1 forward -> visits P3, then stops at P0? 
    // No, getWallPath(mid2, mid1) -> walks forward from mid2.Next is P3. Next is P0. Stops because P0 is end vertex of segment 0.
    // vertices: [P3, P0]
    expect(room1Points).toEqual([
      { x: 50, y: 0 },
      { x: 50, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 0 }
    ]);
    
    // Path AB: from mid1 to mid2 forward -> visits P1, then P2.
    // vertices: [P1, P2]
    expect(room2Points).toEqual([
      { x: 50, y: 100 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ]);
  });

  it('handles splitting a single wall segment (slicing)', () => {
    // Slicing a piece out of the top wall (segment 0)
    // From t=0.2 to t=0.8 on segment 0
    const startSnap: WallSnap = { roomId: 'r1', segmentIndex: 0, t: 0.2 }; // (20, 0)
    const endSnap: WallSnap = { roomId: 'r1', segmentIndex: 0, t: 0.8 };   // (80, 0)
    const A = { x: 20, y: 0 };
    const B = { x: 80, y: 0 };
    const Pmid = { x: 50, y: -20 }; // A "bump" outside (not a split into interior)
    
    // In this case isInteriorSplit would return false if Pmid is outside.
    // But let's assume it's a split into the interior
    const PmidIn = { x: 50, y: 20 };
    
    const { room1Points, room2Points } = splitRoomPolygons(mockRoom, [A, PmidIn], B, startSnap, endSnap);

    // Path BA: from end (0.8) to start (0.2) forward.
    // Must go around the room.
    expect(room1Points).toEqual([
      { x: 20, y: 0 },
      { x: 50, y: 20 },
      { x: 80, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 0 }
    ]);

    // Path AB: from start (0.2) to end (0.8) forward.
    // Special case same segment tStart < tEnd -> immediate connection.
    expect(room2Points).toEqual([
      { x: 80, y: 0 },
      { x: 50, y: 20 },
      { x: 20, y: 0 }
    ]);
  });

  it('detects interior split correctly for various segments', () => {
    // Room: CW rectangle
    // Top wall (0): (0,0) to (100,0). normal (0, -1). Y > 0 is inside.
    const topSnap: WallSnap = { roomId: 'r1', segmentIndex: 0, t: 0.5 };
    const A = { x: 50, y: 0 };
    expect(isInteriorSplit(mockRoom, [A], { x: 50, y: 10 }, topSnap)).toBe(true);
    expect(isInteriorSplit(mockRoom, [A], { x: 50, y: -10 }, topSnap)).toBe(false);

    // Right wall (1): (100,0) to (100,100). normal (1, 0). X < 100 is inside.
    const rightSnap: WallSnap = { roomId: 'r1', segmentIndex: 1, t: 0.5 };
    const B = { x: 100, y: 50 };
    expect(isInteriorSplit(mockRoom, [B], { x: 90, y: 50 }, rightSnap)).toBe(true);
    expect(isInteriorSplit(mockRoom, [B], { x: 110, y: 50 }, rightSnap)).toBe(false);
  });

  it('supports splitting from different wall interior points (L-split)', () => {
    // From top midpoint (50,0) to right midpoint (100,50)
    const startSnap: WallSnap = { roomId: 'r1', segmentIndex: 0, t: 0.5 };
    const endSnap: WallSnap = { roomId: 'r1', segmentIndex: 1, t: 0.5 };
    const A = { x: 50, y: 0 };
    const B = { x: 100, y: 50 };

    const { room1Points, room2Points } = splitRoomPolygons(mockRoom, [A], B, startSnap, endSnap);

    // Path BA: from right midpoint forward to top midpoint.
    // visits P2, P3, P0.
    expect(room1Points).toEqual([
      { x: 50, y: 0 },
      { x: 100, y: 50 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 0 }
    ]);

    // Path AB: from top midpoint forward to right midpoint.
    // visits P1 only.
    expect(room2Points).toEqual([
      { x: 100, y: 50 },
      { x: 50, y: 0 },
      { x: 100, y: 0 }
    ]);
  });

  it('getRoomVertices preserves ordered boundary for topology-first rooms', () => {
    const room: RoomObject = {
      id: 'r1',
      vertices: [
        { id: 'v0', x: 0, y: 0 },                
        { id: 'v1', x: 100, y: 0 },
        { id: 'v2', x: 100, y: 100 }
      ],
      edges: [
        { id: 'e1', startVertexId: 'v0', endVertexId: 'v1' },
        { id: 'e2', startVertexId: 'v1', endVertexId: 'v2' },
        { id: 'e3', startVertexId: 'v2', endVertexId: 'v0' }
      ],
      isClosed: true
    };
    
    // The traversal order is based on edge connectivity.
    // v0->v1->v2->v0
    const vertices = getRoomVertices(room);
    expect(vertices).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ]);
  });

  it('supports multi-segment interior splits', () => {
    // From top midpoint (50,0) to bottom midpoint (50,100) via center (60,50)
    const startSnap: WallSnap = { roomId: 'r1', segmentIndex: 0, t: 0.5 };
    const endSnap: WallSnap = { roomId: 'r1', segmentIndex: 2, t: 0.5 };
    const A = { x: 50, y: 0 };
    const Pmid = { x: 60, y: 50 };
    const B = { x: 50, y: 100 };

    const { room1Points, room2Points } = splitRoomPolygons(mockRoom, [A, Pmid], B, startSnap, endSnap);

    expect(room1Points).toEqual([
      { x: 50, y: 0 },
      { x: 60, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 0 }
    ]);

    expect(room2Points).toEqual([
      { x: 50, y: 100 },
      { x: 60, y: 50 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ]);
  });
});
