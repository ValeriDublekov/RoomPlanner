import { Vector2d } from '../types';

/**
 * Calculates the Euclidean distance between two points.
 */
export const getDistance = (p1: Vector2d, p2: Vector2d): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
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
 * Formats a distance in pixels to a human-readable string in centimeters.
 */
export const formatDistance = (pixels: number, pixelsPerCm: number): string => {
  return `${(pixels / pixelsPerCm).toFixed(1)} cm`;
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
 * Finds the nearest vertex (corner) within a threshold.
 */
export const getSnappedPosition = (
  pos: Vector2d,
  rooms: { points: Vector2d[] }[],
  furniture: { x: number; y: number; width: number; height: number }[],
  threshold: number
): Vector2d => {
  let nearest = { ...pos };
  let minDist = threshold;

  // Check room corners
  for (const room of rooms) {
    for (const p of room.points) {
      const d = getDistance(pos, p);
      if (d < minDist) {
        minDist = d;
        nearest = { ...p };
      }
    }
  }

  // Check furniture corners
  for (const f of furniture) {
    const corners = [
      { x: f.x, y: f.y },
      { x: f.x + f.width, y: f.y },
      { x: f.x, y: f.y + f.height },
      { x: f.x + f.width, y: f.y + f.height },
    ];
    for (const p of corners) {
      const d = getDistance(pos, p);
      if (d < minDist) {
        minDist = d;
        nearest = { ...p };
      }
    }
  }

  return nearest;
};
