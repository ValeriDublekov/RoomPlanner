import { Vector2d } from '../../types';

/**
 * Calculates the Euclidean distance between two points.
 */
export const getDistance = (p1: Vector2d, p2: Vector2d): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Calculates the signed area of a polygon. 
 * Positive value indicates Clockwise winding in a Y-down coordinate system.
 */
export const getSignedArea = (points: Vector2d[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return area / 2;
};

/**
 * Calculates the area of a polygon using the Shoelace formula.
 */
export const calculateArea = (points: Vector2d[]): number => {
  return Math.abs(getSignedArea(points));
};

/**
 * Rotates a point around a pivot.
 */
export const rotatePoint = (point: Vector2d, pivot: Vector2d, angleDegrees: number): Vector2d => {
  const angle = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + (dx * cos - dy * sin),
    y: pivot.y + (dx * sin + dy * cos)
  };
};

/**
 * Snaps a point to the nearest orthogonal direction (horizontal or vertical) relative to a start point.
 */
export const getOrthoPoint = (start: Vector2d, end: Vector2d): Vector2d => {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  
  if (dx > dy) {
    return { x: end.x, y: start.y };
  } else {
    return { x: start.x, y: end.y };
  }
};

/**
 * Scales a set of points by a given factor.
 */
export const scalePoints = (points: Vector2d[], scaleX: number, scaleY: number): Vector2d[] => {
  return points.map(p => ({
    x: p.x * scaleX,
    y: p.y * scaleY
  }));
};

/**
 * Calculates the distance from a point to a line segment.
 */
export const getDistanceToSegment = (p: Vector2d, v: Vector2d, w: Vector2d): { distance: number, point: Vector2d } => {
  const l2 = Math.pow(getDistance(v, w), 2);
  if (l2 === 0) return { distance: getDistance(p, v), point: v };
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  };
  return {
    distance: getDistance(p, projection),
    point: projection
  };
};
