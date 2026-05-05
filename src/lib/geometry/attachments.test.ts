import { describe, it, expect } from 'vitest';
import { getAttachmentTransform, resolveNearestWall } from './attachments';
import { RoomObject, WallAttachment } from '../../types';
import { derivePlanSnapshot } from './planSnapshot';

describe('Attachment Geometry', () => {
  const mockRooms: RoomObject[] = [
    {
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
    },
  ];

  const mockAttachment: WallAttachment = {
    id: 'att-1',
    roomId: 'room-1',
    type: 'door',
    wallSegmentIndex: 0, // Top wall (0,0) to (100,0)
    positionAlongWall: 0.5,
    width: 80,
    flipY: true,
  };

  it('calculates correct transform for an attachment', () => {
    const snapshot = derivePlanSnapshot(mockRooms, 20, 1);
    const transform = getAttachmentTransform(mockAttachment, snapshot);
    expect(transform).not.toBeNull();
    if (transform) {
      expect(transform.position).toEqual({ x: 50, y: 0 });
      expect(transform.rotation).toBe(0);
      // Top wall in clockwise (0,0)->(100,0) has normal (0,-1) if interior is (50,50)
      // Wait, let's check normal expectation. Interior is center.
      // (100-0, 0-0) = (100, 0). Tangent. 
      // Normal should be (0, -1) or (0, 1).
      expect(Math.abs(transform.normal.y)).toBe(1);
      expect(transform.normal.x).toBe(0);
    }
  });

  it('resolves nearest wall from snapshot', () => {
    const snapshot = derivePlanSnapshot(mockRooms, 20, 1);
    
    // Near middle of top wall
    const pointNearWall = { x: 50, y: 5 };
    const result = resolveNearestWall(pointNearWall, snapshot, 20);
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.roomId).toBe('room-1');
      expect(result.wallSegmentIndex).toBe(0);
      expect(result.positionAlongWall).toBeCloseTo(0.5);
    }
  });

  it('returns null if no wall is within threshold', () => {
    const snapshot = derivePlanSnapshot(mockRooms, 20, 1);
    const pointFarAway = { x: 200, y: 200 };
    const result = resolveNearestWall(pointFarAway, snapshot, 20);
    expect(result).toBeNull();
  });
});
