import { describe, it, expect } from 'vitest';
import { derivePlanSnapshot } from './planSnapshot';
import { RoomObject } from '../../types';

describe('planSnapshot', () => {
  const mockRoom: RoomObject = {
    id: 'room-1',
    vertices: [
      { id: 'v0', x: 0, y: 0 },
      { id: 'v1', x: 100, y: 0 },
      { id: 'v2', x: 100, y: 100 },
      { id: 'v3', x: 0, y: 100 },
    ],
    edges: [
      { id: 'e0', startVertexId: 'v0', endVertexId: 'v1' },
      { id: 'e1', startVertexId: 'v1', endVertexId: 'v2' },
      { id: 'e2', startVertexId: 'v2', endVertexId: 'v3' },
      { id: 'e3', startVertexId: 'v3', endVertexId: 'v0' },
    ],
    isClosed: true,
  };

  it('should derive walls for a closed rectangular room', () => {
    const wallThickness = 10;
    const snapshot = derivePlanSnapshot([mockRoom], wallThickness, 1);

    expect(snapshot.walls).toHaveLength(4);
    
    // Check first wall (0,0 to 100,0)
    // Normal for CW rectangle top edge should be (0, -1) if Y is down?
    // Let's check getSignedArea for [0,0, 100,0, 100,100, 0,100]
    // (0*0 + 100*100 + 100*100 + 0*0) - (0*100 + 0*100 + 100*0 + 100*0) = 20000 / 2 = 10000 (Positive -> Clockwise)
    // For CW, normal is (dy/len, -dx/len)
    // dx = 100, dy = 0. Normal = (0, -100/100) = (0, -1). 
    // Outward normal for top edge of CW rectangle is indeed up (0,-1).
    
    const wall0 = snapshot.walls[0];
    expect(wall0.id).toBe('room-1-wall-0');
    expect(wall0.referenceSegment.p1).toEqual({ x: 0, y: 0 });
    expect(wall0.referenceSegment.p2).toEqual({ x: 100, y: 0 });
    expect(wall0.normal).toEqual({ x: 0, y: -1 });
    
    // Exterior face should be shifted by thickness and mitered
    expect(wall0.exteriorFace.p1).toEqual({ x: -10, y: -10 });
    expect(wall0.exteriorFace.p2).toEqual({ x: 110, y: -10 });
    
    // Wall band polygon
    expect(wall0.wallBandPolygon).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 110, y: -10 },
      { x: -10, y: -10 },
    ]);
  });

  it('should handle open rooms (unclosed)', () => {
    const openRoom: RoomObject = {
      id: 'room-2',
      vertices: [
        { id: 'v0', x: 0, y: 0 },
        { id: 'v1', x: 100, y: 0 },
        { id: 'v2', x: 100, y: 100 },
      ],
      edges: [
        { id: 'e0', startVertexId: 'v0', endVertexId: 'v1' },
        { id: 'e1', startVertexId: 'v1', endVertexId: 'v2' },
      ],
      isClosed: false,
    };

    const snapshot = derivePlanSnapshot([openRoom], 10, 1);
    expect(snapshot.walls).toHaveLength(2);
    expect(snapshot.walls[0].id).toBe('room-2-wall-0');
    expect(snapshot.walls[1].id).toBe('room-2-wall-1');
  });

  it('should treat shared walls as single thickness correctly', () => {
    const roomA: RoomObject = {
      id: 'room-a',
      vertices: [
        { id: 'v0', x: 0, y: 0 },
        { id: 'v1', x: 100, y: 0 },
        { id: 'v2', x: 100, y: 100 },
        { id: 'v3', x: 0, y: 100 },
      ],
      edges: [
        { id: 'e0', startVertexId: 'v0', endVertexId: 'v1' }, // top
        { id: 'e1', startVertexId: 'v1', endVertexId: 'v2' }, // right (shared)
        { id: 'e2', startVertexId: 'v2', endVertexId: 'v3' }, // bottom
        { id: 'e3', startVertexId: 'v3', endVertexId: 'v0' }, // left
      ],
      isClosed: true,
    };
    
    // Room B is to the right of Room A
    // CCW or CW, let's keep it consistent. A is [0,0]->[100,0]->[100,100]->[0,100] (CW)
    // B should also be CW for the algorithm? B is [100,0]->[200,0]->[200,100]->[100,100]
    const roomB: RoomObject = {
      id: 'room-b',
      vertices: [
        { id: 'v0', x: 100, y: 0 },
        { id: 'v1', x: 200, y: 0 },
        { id: 'v2', x: 200, y: 100 },
        { id: 'v3', x: 100, y: 100 },
      ],
      edges: [
        { id: 'e0', startVertexId: 'v0', endVertexId: 'v1' }, // top
        { id: 'e1', startVertexId: 'v1', endVertexId: 'v2' }, // right
        { id: 'e2', startVertexId: 'v2', endVertexId: 'v3' }, // bottom
        { id: 'e3', startVertexId: 'v3', endVertexId: 'v0' }, // left (shared)
      ],
      isClosed: true,
    };

    const wallThickness = 10;
    const snapshot = derivePlanSnapshot([roomA, roomB], wallThickness, 1);
    
    expect(snapshot.sharedWalls).toHaveLength(1);
    
    const wallA = snapshot.walls.find(w => w.roomId === 'room-a' && w.segmentIndex === 1);
    const wallB = snapshot.walls.find(w => w.roomId === 'room-b' && w.segmentIndex === 3);
    
    expect(wallA).toBeDefined();
    expect(wallB).toBeDefined();
    expect(wallA?.sharedWallId).toBeTruthy();
    expect(wallB?.sharedWallId).toEqual(wallA?.sharedWallId);

    // If both are drawn with their default offset outwards, 
    // wallA spans X from 100 to 110. wallB spans X from 100 to 90.
    // The total thickness would be 20.
    // We want the shared wall to be centered on X=100 with total thickness 10.
    // This means wallA should span X = 95 to 105, or we only use one wall and it spans 95 to 105.
    
    // Check points
    // inner face
    expect((wallA!.wallBandPolygon[0] as any).x).toBeCloseTo(100);
    // outer polygon should be shifted by thickness/2, i.e., 105
    expect((wallA!.wallBandPolygon[2] as any).x).toBeCloseTo(105);
    
    // For wallB
    expect((wallB!.wallBandPolygon[0] as any).x).toBeCloseTo(100);
    // outer should be 95
    expect((wallB!.wallBandPolygon[2] as any).x).toBeCloseTo(95);
  });

  it('should ignore rooms with less than 2 points', () => {
    const invalidRoom: RoomObject = {
      id: 'room-3',
      vertices: [{ id: 'v0', x: 0, y: 0 }],
      edges: [],
      isClosed: true,
    };

    const snapshot = derivePlanSnapshot([invalidRoom], 10, 1);
    expect(snapshot.walls).toHaveLength(0);
  });
});
