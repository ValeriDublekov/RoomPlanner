import { describe, it, expect } from 'vitest';
import { getSnappedPosition } from './snapping';
import { derivePlanSnapshot } from './planSnapshot';
import { RoomObject } from '../../types';

describe('Snapping with PlanSnapshot', () => {
  const wallThickness = 20;

  const room1: RoomObject = {
    id: 'room1',
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

  const room2: RoomObject = {
    id: 'room2',
    vertices: [
      { id: 'v1', x: 100, y: 0 },
      { id: 'v4', x: 200, y: 0 },
      { id: 'v5', x: 200, y: 100 },
      { id: 'v2', x: 100, y: 100 }
    ],
    edges: [
      { id: 'e4', startVertexId: 'v1', endVertexId: 'v4' },
      { id: 'e5', startVertexId: 'v4', endVertexId: 'v5' },
      { id: 'e6', startVertexId: 'v5', endVertexId: 'v2' },
      { id: 'e7', startVertexId: 'v2', endVertexId: 'v1' }
    ],
    isClosed: true
  };

  const snapshot = derivePlanSnapshot([room1, room2], wallThickness, 1);

  it('snaps to shared interior corner (deduplicated)', () => {
    // Exactly above the corner. Distance to corner is 2.
    // Distance to horizontal edges is 2. Vertex should win on tie.
    const pos = { x: 100, y: -2 }; 
    const threshold = 10;
    const snapped = getSnappedPosition(pos, [], [], threshold, null, null, null, snapshot);
    
    // Should snap to (100, 0)
    expect(snapped.x).toBe(100);
    expect(snapped.y).toBe(0);
  });

  it('snaps to shared interior wall segment (deduplicated)', () => {
    const pos = { x: 98, y: 50 };
    const threshold = 10;
    const snapped = getSnappedPosition(pos, [], [], threshold, null, null, null, snapshot);
    
    // Should snap to the shared wall x=100
    expect(snapped.x).toBe(100);
    expect(snapped.y).toBe(50);
  });

  it('snaps to exterior corner of a wall', () => {
    // Room 1 corner (0,0), outward normal for top edge (0, -1)
    // Room 1 vertical edge normal is (-1, 0)
    // Mitered exterior corner is at (-20, -20)
    
    const pos = { x: -22, y: -22 };
    const threshold = 10;
    const snapped = getSnappedPosition(pos, [], [], threshold, null, null, null, snapshot);
    
    // Should snap to mitered corner (-20, -20)
    expect(snapped.x).toBe(-20);
    expect(snapped.y).toBe(-20);
  });

  it('snaps to exterior face of a wall', () => {
    // Room 1 top edge y=0, normal (0, -1), wallThickness 20 -> exterior y = -20
    const pos = { x: 50, y: -18 };
    const threshold = 10;
    const snapped = getSnappedPosition(pos, [], [], threshold, null, null, null, snapshot);
    
    expect(snapped.x).toBe(50);
    expect(snapped.y).toBe(-20);
  });

  it('preserves current corner snapping for interior points', () => {
    const pos = { x: -2, y: -2 };
    const threshold = 10;
    const snapped = getSnappedPosition(pos, [], [], threshold, null, null, null, snapshot);
    
    expect(snapped.x).toBe(0);
    expect(snapped.y).toBe(0);
  });
});
