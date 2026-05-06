import { Vector2d } from '../../types';
import { getOutwardNormal } from './polygonUtils';

/**
 * Calculates a set of points offset from the given points by a certain thickness.
 * This can be used to generate the outer boundary of a wall.
 * 
 * Uses miter joins for corners.
 */
export const offsetPoints = (points: Vector2d[], thickness: number | number[], isClosed: boolean): Vector2d[] => {
  const result: Vector2d[] = [];
  const len = points.length;
  if (len < 2) return points;

  const getT = (idx: number) => Array.isArray(thickness) ? thickness[Math.max(0, Math.min(thickness.length - 1, idx))] : thickness;

  for (let i = 0; i < len; i++) {
    const p = points[i];
    
    // For open paths, the ends just move along the normal of the adjacent segment
    if (!isClosed) {
      if (i === 0) {
        const n = getOutwardNormal(points, 0);
        const t = getT(0);
        result.push({ x: p.x + n.x * t, y: p.y + n.y * t });
        continue;
      }
      if (i === len - 1) {
        const n = getOutwardNormal(points, len - 2);
        const t = getT(len - 2);
        result.push({ x: p.x + n.x * t, y: p.y + n.y * t });
        continue;
      }
    }

    const prevIdx = (i - 1 + len) % len;
    const n1 = getOutwardNormal(points, prevIdx);
    const n2 = getOutwardNormal(points, i);
    const t1 = getT(prevIdx);
    const t2 = getT(i);

    const det = n1.x * n2.y - n1.y * n2.x;

    let dX: number;
    let dY: number;

    if (Math.abs(det) < 0.0001) {
      // Parallel or opposite segments
      dX = n1.x * t1;
      dY = n1.y * t1;
    } else {
      dX = (t1 * n2.y - t2 * n1.y) / det;
      dY = (n1.x * t2 - n2.x * t1) / det;
      
      const dLen = Math.sqrt(dX * dX + dY * dY);
      const limit = Math.max(t1, t2) * 5;
      if (dLen > limit && dLen > 0.0001) {
        dX = (dX / dLen) * limit;
        dY = (dY / dLen) * limit;
      }
    }

    result.push({
      x: p.x + dX,
      y: p.y + dY
    });
  }
  return result;
};

/**
 * Represents a single wall segment's polygon geometry.
 */
export interface WallPolygon {
  inner: [Vector2d, Vector2d];
  outer: [Vector2d, Vector2d];
  index: number;
}

/**
 * Derives the wall polygons for a room based on its points and thickness.
 * This provides a unified source of truth for 2D, 3D, and DXF.
 */
export const getRoomWallPolygons = (
  roomPoints: Vector2d[], 
  thickness: number, 
  isClosed: boolean
): WallPolygon[] => {
  const outerPoints = offsetPoints(roomPoints, thickness, isClosed);
  const segments: WallPolygon[] = [];
  
  const count = isClosed ? roomPoints.length : roomPoints.length - 1;
  for (let i = 0; i < count; i++) {
    const nextIdx = (i + 1) % roomPoints.length;
    segments.push({
      inner: [roomPoints[i], roomPoints[nextIdx]],
      outer: [outerPoints[i], outerPoints[nextIdx]],
      index: i
    });
  }
  
  return segments;
};

/**
 * Calculates the center, length, angle, and normal for a wall segment.
 * This helper encapsulates the "outward" wall offset logic used by 3D and labels.
 */
export const getWallSegmentGeometry = (
  points: Vector2d[],
  index: number,
  thickness: number
) => {
  if (points.length < 2) return null;

  const p1 = points[index];
  const p2 = points[(index + 1) % points.length];
  const normal = getOutwardNormal(points, index);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // Center is offset outwards by half thickness
  const centerX = midX + normal.x * (thickness / 2);
  const centerY = midY + normal.y * (thickness / 2);

  return {
    centerX,
    centerY,
    length,
    angle,
    normal,
    p1,
    p2
  };
};
