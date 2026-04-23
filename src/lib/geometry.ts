import { Vector2d, EdgeMap } from '../types';

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
  
  // In Y-down:
  // Right-hand normal: (dy/len, -dx/len)
  // Left-hand normal: (-dy/len, dx/len)
  // For CW winding, Right-hand normal points OUTSIDE.
  // For CCW winding, Left-hand normal points OUTSIDE.
  if (isCW) {
    return { x: dy / len, y: -dx / len };
  } else {
    return { x: -dy / len, y: dx / len };
  }
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

/**
 * Finds the nearest vertex (corner) within a threshold.
 */
export const getSnappedPosition = (
  pos: Vector2d,
  rooms: { points: Vector2d[] }[],
  furniture: { x: number; y: number; width: number; height: number }[],
  threshold: number,
  edgeMap: EdgeMap | null = null,
  bgTransform: { x: number, y: number, scale: number, rotation: number } | null = null,
  lastPoint: Vector2d | null = null
): Vector2d => {
  let nearest = { ...pos };
  let minDist = threshold;

  // 1. Check room corners and furniture corners first (Vector Snapping)
  // Check room corners
  for (const room of rooms) {
    for (const p of room.points) {
      const d = getDistance(pos, p);
      if (d < minDist) {
        minDist = d;
        nearest = { ...p };
      }
    }
    
    // Check wall segments (edges)
    for (let i = 0; i < room.points.length; i++) {
      const p1 = room.points[i];
      const p2 = room.points[(i + 1) % room.points.length];
      const result = getDistanceToSegment(pos, p1, p2);
      if (result.distance < minDist) {
        minDist = result.distance;
        nearest = result.point;
      }
    }
  }

  // Check furniture corners and edges
  for (const f of furniture) {
    const vertices = getFurnitureVertices(f as any); 
    
    // Check corners
    for (const v of vertices) {
      const d = getDistance(pos, v);
      if (d < minDist) {
        minDist = d;
        nearest = { ...v };
      }
    }

    // Check furniture edges
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const result = getDistanceToSegment(pos, v1, v2);
      if (result.distance < minDist) {
        minDist = result.distance;
        nearest = result.point;
      }
    }
  }

  // 2. If no vector vertex found within threshold, check Edge Map (Image Snapping)
  if (minDist === threshold && edgeMap && bgTransform) {
    // Search radius in image pixels, derived from the world-space threshold
    const radius = Math.max(8, threshold / bgTransform.scale);
    
    // Inverse transform: world -> image space
    const rad = (bgTransform.rotation * Math.PI) / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);
    
    const dx = pos.x - bgTransform.x;
    const dy = pos.y - bgTransform.y;
    
    const imgX = (dx * cos - dy * sin) / bgTransform.scale;
    const imgY = (dx * sin + dy * cos) / bgTransform.scale;
    
    let lastImgX = -1;
    let lastImgY = -1;
    if (lastPoint) {
      const ldx = lastPoint.x - bgTransform.x;
      const ldy = lastPoint.y - bgTransform.y;
      lastImgX = (ldx * cos - ldy * sin) / bgTransform.scale;
      lastImgY = (ldx * sin + ldy * cos) / bgTransform.scale;
    }

    const startX = Math.floor(imgX - radius);
    const endX = Math.ceil(imgX + radius);
    const startY = Math.floor(imgY - radius);
    const endY = Math.ceil(imgY + radius);
    
    let bestImgX = -1;
    let bestImgY = -1;
    let minScore = Infinity;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (x >= 0 && x < edgeMap.width && y >= 0 && y < edgeMap.height) {
          if (edgeMap.data[y * edgeMap.width + x] === 1) {
            // Count neighbors to detect intersections/corners
            let neighbors = 0;
            for (let ny = -1; ny <= 1; ny++) {
              for (let nx = -1; nx <= 1; nx++) {
                if (nx === 0 && ny === 0) continue;
                const nix = x + nx;
                const niy = y + ny;
                if (nix >= 0 && nix < edgeMap.width && niy >= 0 && niy < edgeMap.height) {
                  if (edgeMap.data[niy * edgeMap.width + nix] === 1) neighbors++;
                }
              }
            }

            const d = Math.sqrt(Math.pow(x - imgX, 2) + Math.pow(y - imgY, 2));
            
            // Prioritize distance primarily.
            // Give extra "gravitational bonus" to intersections/junctions (neighbors > 2)
            // or endpoints (neighbors == 1)
            let junctionBonus = (neighbors > 2 || neighbors === 1) ? 3.0 : 0.0;
            
            // If we have a last point, give bonus if this pixel is roughly in the direction of drawing
            let directionBonus = 0;
            if (lastImgX !== -1) {
              const dx1 = x - lastImgX;
              const dy1 = y - lastImgY;
              const dx2 = imgX - lastImgX;
              const dy2 = imgY - lastImgY;
              const mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
              const mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
              if (mag1 > 0 && mag2 > 0) {
                const dot = (dx1 * dx2 + dy1 * dy2) / (mag1 * mag2);
                if (dot > 0.98) directionBonus = 2.0; // High alignment bonus
              }
            }

            const score = d - junctionBonus - directionBonus;

            if (score < minScore) {
              minScore = score;
              bestImgX = x;
              bestImgY = y;
            }
          }
        }
      }
    }
    
    if (bestImgX !== -1) {
      // Convert back to world space
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      
      const worldX = bgTransform.x + (bestImgX * cosR - bestImgY * sinR) * bgTransform.scale;
      const worldY = bgTransform.y + (bestImgX * sinR + bestImgY * cosR) * bgTransform.scale;
      
      nearest = { x: worldX, y: worldY };
    }
  }

  return nearest;
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
  // A line segment is just a very thin polygon
  const linePoly = [p1, p2];
  
  // SAT for polygon vs line segment
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
  // Add axis perpendicular to the line itself
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
  // 1. Check if any vertex is inside the circle
  for (const p of poly) {
    if (getDistance(center, p) <= radius) return true;
  }

  // 2. Check if any edge intersects the circle
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const result = getDistanceToSegment(center, p1, p2);
    if (typeof result === 'object' && result.distance <= radius) return true;
  }

  // 3. Check if center is inside the polygon (Winding Number or Ray Casting)
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (((poly[i].y > center.y) !== (poly[j].y > center.y)) &&
        (center.x < (poly[j].x - poly[i].x) * (center.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)) {
      inside = !inside;
    }
  }
  return inside;
};

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
/**
 * Snaps a furniture-like rectangle (center-based) to walls and other furniture.
 */
export const getSnappedFurniturePosition = (
  centerPos: Vector2d,
  width: number,
  height: number,
  rotation: number,
  rooms: { id: string, points: Vector2d[] }[],
  furniture: { id: string, x: number; y: number; width: number; height: number; rotation: number }[],
  threshold: number,
  ignoredId?: string
): Vector2d => {
  let currentPos = { ...centerPos };
  let snappedTargetIds = new Set<string>();

  // Two passes for better corner snapping
  for (let pass = 0; pass < 2; pass++) {
    let bestSnap = null;
    let minSnapDist = Infinity;
    
    // Middle points of each side for snapping
    const sides = [
      rotatePoint({ x: 0, y: -height / 2 }, { x: 0, y: 0 }, rotation),
      rotatePoint({ x: 0, y: height / 2 }, { x: 0, y: 0 }, rotation),
      rotatePoint({ x: -width / 2, y: 0 }, { x: 0, y: 0 }, rotation),
      rotatePoint({ x: width / 2, y: 0 }, { x: 0, y: 0 }, rotation),
    ];

    const worldSides = sides.map(s => ({ x: s.x + currentPos.x, y: s.y + currentPos.y }));

    for (const side of worldSides) {
      // 1. Snap to Walls
      for (const room of rooms) {
        // Optimization: check if side is roughly near room
        if (!isPointInPolygon(side, room.points)) {
          // If outside, maybe we are snapping to external face? 
          // For now, only snap if near a wall from inside as most furniture is inside.
          // But actually, snapping should work regardless if minDist is small.
        }

        for (let i = 0; i < room.points.length; i++) {
          const wallId = `wall-${room.id}-${i}`;
          if (snappedTargetIds.has(wallId)) continue;

          const p1 = room.points[i];
          const p2 = room.points[(i + 1) % room.points.length];
          const result = getDistanceToSegment(side, p1, p2);
          
          if (result.distance < threshold && result.distance < minSnapDist) {
            minSnapDist = result.distance;
            bestSnap = {
              offsetX: result.point.x - side.x,
              offsetY: result.point.y - side.y,
              targetId: wallId
            };
          }
        }
      }

      // 2. Snap to Other Furniture
      for (const other of furniture) {
        if (other.id === ignoredId) continue;
        
        const targetId = `furniture-${other.id}`;
        if (snappedTargetIds.has(targetId)) continue;

        const otherVertices = getFurnitureVertices(other);
        for (let i = 0; i < otherVertices.length; i++) {
          const v1 = otherVertices[i];
          const v2 = otherVertices[(i + 1) % otherVertices.length];
          const result = getDistanceToSegment(side, v1, v2);
          
          if (result.distance < threshold && result.distance < minSnapDist) {
            minSnapDist = result.distance;
            bestSnap = {
              offsetX: result.point.x - side.x,
              offsetY: result.point.y - side.y,
              targetId: targetId
            };
          }
        }
      }
    }

    if (bestSnap) {
      currentPos.x += bestSnap.offsetX;
      currentPos.y += bestSnap.offsetY;
      snappedTargetIds.add(bestSnap.targetId);
    } else {
      break;
    }
  }

  return currentPos;
};

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
