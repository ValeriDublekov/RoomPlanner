import { Vector2d } from '../../types';
import { getDistance, getDistanceToSegment } from './mathUtils';

/**
 * Checks if two polygons intersect using the Separating Axis Theorem (SAT).
 */
export const checkPolygonsIntersect = (poly1: Vector2d[], poly2: Vector2d[]): boolean => {
  const getAxes = (poly: Vector2d[]) => {
    const axes = [];
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      // Normal (perpendicular)
      axes.push({ x: -edge.y, y: edge.x });
    }
    return axes;
  };

  const project = (poly: Vector2d[], axis: Vector2d) => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of poly) {
      const dot = p.x * axis.x + p.y * axis.y;
      if (dot < min) min = dot;
      if (dot > max) max = dot;
    }
    return { min, max };
  };

  const axes = [...getAxes(poly1), ...getAxes(poly2)];

  for (const axis of axes) {
    const proj1 = project(poly1, axis);
    const proj2 = project(poly2, axis);
    if (proj1.max < proj2.min || proj2.max < proj1.min) {
      return false; // Gap found
    }
  }

  return true;
};

/**
 * Checks if a polygon intersects with a line segment.
 */
export const checkPolygonLineIntersect = (poly: Vector2d[], p1: Vector2d, p2: Vector2d): boolean => {
  const linePoly = [p1, p2];
  
  const getAxes = (p: Vector2d[]) => {
    const axes = [];
    for (let i = 0; i < p.length - (p.length === 2 ? 1 : 0); i++) {
      const v1 = p[i];
      const v2 = p[(i + 1) % p.length];
      const edge = { x: v2.x - v1.x, y: v2.y - v1.y };
      axes.push({ x: -edge.y, y: edge.x });
    }
    return axes;
  };

  const project = (p: Vector2d[], axis: Vector2d) => {
    let min = Infinity;
    let max = -Infinity;
    for (const pt of p) {
      const dot = pt.x * axis.x + pt.y * axis.y;
      if (dot < min) min = dot;
      if (dot > max) max = dot;
    }
    return { min, max };
  };

  const axes = [...getAxes(poly), ...getAxes(linePoly)];
  const lineEdge = { x: p2.x - p1.x, y: p2.y - p1.y };
  axes.push({ x: -lineEdge.y, y: lineEdge.x });

  for (const axis of axes) {
    if (axis.x === 0 && axis.y === 0) continue;
    const proj1 = project(poly, axis);
    const proj2 = project(linePoly, axis);
    if (proj1.max < proj2.min || proj2.max < proj1.min) {
      return false;
    }
  }
  return true;
};

/**
 * Checks if a circle intersects with a polygon.
 */
export const checkCirclePolygonIntersect = (center: Vector2d, radius: number, poly: Vector2d[]): boolean => {
  for (const p of poly) {
    if (getDistance(center, p) <= radius) return true;
  }

  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const result = getDistanceToSegment(center, p1, p2);
    if (typeof result === 'object' && result.distance <= radius) return true;
  }

  return isPointInPolygon(center, poly);
};

/**
 * Checks if a point is inside a polygon.
 */
export const isPointInPolygon = (point: Vector2d, poly: Vector2d[]): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (((poly[i].y > point.y) !== (poly[j].y > point.y)) &&
        (point.x < (poly[j].x - poly[i].x) * (point.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)) {
      inside = !inside;
    }
  }
  return inside;
};

/**
 * Checks if two circles intersect.
 */
export const checkCirclesIntersect = (c1: Vector2d, r1: number, c2: Vector2d, r2: number): boolean => {
  return getDistance(c1, c2) <= (r1 + r2);
};

/**
 * Checks if a circle intersects with a line segment.
 */
export const checkCircleLineIntersect = (center: Vector2d, radius: number, p1: Vector2d, p2: Vector2d): boolean => {
  const result = getDistanceToSegment(center, p1, p2);
  return typeof result === 'object' && result.distance <= radius;
};
