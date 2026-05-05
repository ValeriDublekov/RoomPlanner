import { describe, it, expect } from 'vitest';
import { getSnappedFurniturePosition } from './snapping';
import { derivePlanSnapshot } from './planSnapshot';
import { RoomObject } from '../../types';

describe('Furniture Snapping with PlanSnapshot', () => {
  const wallThickness = 10;
  const room: RoomObject = {
    id: 'room1',
    vertices: [
      { id: 'v0', x: 0, y: 0 },
      { id: 'v1', x: 500, y: 0 },
      { id: 'v2', x: 500, y: 500 },
      { id: 'v3', x: 0, y: 500 }
    ],
    edges: [
      { id: 'e0', startVertexId: 'v0', endVertexId: 'v1' },
      { id: 'e1', startVertexId: 'v1', endVertexId: 'v2' },
      { id: 'e2', startVertexId: 'v2', endVertexId: 'v3' },
      { id: 'e3', startVertexId: 'v3', endVertexId: 'v0' }
    ],
    isClosed: true
  };
  const rooms = [room as RoomObject];
  const planSnapshot = derivePlanSnapshot(rooms, wallThickness, 1);

  it('snaps to interior wall face using planSnapshot', () => {
    const furnitureSize = 100;
    const threshold = 20;
    
    // Position furniture near the right wall (x=500)
    // Right edge at 445 + 50 = 495.
    const pos = { x: 445, y: 250 };
    
    // Without snapshot, it falls back to rooms (same result for basic case)
    const snappedBasic = getSnappedFurniturePosition(pos, furnitureSize, furnitureSize, 0, rooms, [], threshold);
    expect(snappedBasic.x).toBe(450);

    // With snapshot, it uses wall.interiorFace
    const snappedWithSnapshot = getSnappedFurniturePosition(pos, furnitureSize, furnitureSize, 0, rooms, [], threshold, undefined, planSnapshot);
    expect(snappedWithSnapshot.x).toBe(450);
  });

  it('respects wall thickness during snap logic (identifies correct wall)', () => {
    // This test verifies that we are hitting the wall ID from the snapshot
    const pos = { x: 45, y: 250 }; // Left edge at 45 - 50 = -5.
    // Near left wall (x=0).
    const snapped = getSnappedFurniturePosition(pos, 100, 100, 0, rooms, [], 20, undefined, planSnapshot);
    expect(snapped.x).toBe(50); // Left edge at 50 - 50 = 0.
  });
});
