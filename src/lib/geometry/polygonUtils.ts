import { Vector2d, RoomObject } from '../../types';
import { getSignedArea, rotatePoint } from './mathUtils';
import { getRoomVertices } from './topology';

/**
 * Gets the outward normal vector for a segment of a polygon.
 */
export const getOutwardNormal = (points: Vector2d[], segmentIndex: number): Vector2d => {
  const p1 = points[segmentIndex];
  const p2 = points[(segmentIndex + 1) % points.length];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return { x: 0, y: 0 };
  
  const isCW = getSignedArea(points) >= 0;
  
  if (isCW) {
    return { x: dy / len, y: -dx / len };
  } else {
    return { x: -dy / len, y: dx / len };
  }
};

/**
 * Gets the world-space vertices of a furniture object.
 */
export const getFurnitureVertices = (f: { x: number; y: number; width: number; height: number; rotation: number }): Vector2d[] => {
  const center = { x: f.x + f.width / 2, y: f.y + f.height / 2 };
  return [
    rotatePoint({ x: f.x, y: f.y }, center, f.rotation),
    rotatePoint({ x: f.x + f.width, y: f.y }, center, f.rotation),
    rotatePoint({ x: f.x + f.width, y: f.y + f.height }, center, f.rotation),
    rotatePoint({ x: f.x, y: f.y + f.height }, center, f.rotation)
  ];
};

/**
 * Gets the wall segments of a room.
 * 
 * NOTE: The interior polygon is derived from the room's topology graph.
 * Wall geometry is rendered along these segments, representing
 * the boundary of that interior space.
 */
export const getWallSegments = (room: RoomObject) => {
  const segments = [];
  const points = getRoomVertices(room);
  
  const count = room.isClosed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const color = room.wallColors?.[i] || room.defaultWallColor || "#1e293b";
    segments.push({ p1, p2, index: i, color });
  }
  return segments;
};
