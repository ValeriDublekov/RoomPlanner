import { RoomObject, WallGeometry, PlanSnapshot, SharedWall, Vector2d } from '../../types';
import { getOutwardNormal } from './polygonUtils';
import { getRoomVertices } from './topology';
import { offsetPoints } from './walls';
import { getDistanceToSegment } from './mathUtils';

const EPSILON = 1.0; // 1cm tolerance for snapping/matching

/**
 * Checks if two segments are effectively the same physical wall.
 * They should be collinear and share a significant overlap.
 */
const areSegmentsShared = (
  s1: { p1: Vector2d; p2: Vector2d },
  s2: { p1: Vector2d; p2: Vector2d }
): boolean => {
  const d1 = { x: s1.p2.x - s1.p1.x, y: s1.p2.y - s1.p1.y };
  const d2 = { x: s2.p2.x - s2.p1.x, y: s2.p2.y - s2.p1.y };
  const l1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
  const l2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);

  if (l1 < EPSILON || l2 < EPSILON) return false;

  // 1. Parallelism check (normalized cross product)
  const cross = Math.abs(d1.x * d2.y - d1.y * d2.x);
  if (cross / (l1 * l2) > 0.01) return false;

  // 2. Collinearity check (p1 of s1 must be on line of s2)
  // We use distance to full line instead of segment for pure collinearity check
  const distToLine = Math.abs(d2.y * s1.p1.x - d2.x * s1.p1.y + s2.p2.x * s2.p1.y - s2.p2.y * s2.p1.x) / l2;
  if (distToLine > EPSILON) return false;

  // 3. Overlap check
  const p1_on_s2 = getDistanceToSegment(s1.p1, s2.p1, s2.p2).distance < EPSILON;
  const p2_on_s2 = getDistanceToSegment(s1.p2, s2.p1, s2.p2).distance < EPSILON;
  const p3_on_s1 = getDistanceToSegment(s2.p1, s1.p1, s1.p2).distance < EPSILON;
  const p4_on_s1 = getDistanceToSegment(s2.p2, s1.p1, s1.p2).distance < EPSILON;

  // If both endpoints of s1 are on s2, s1 is a subset of s2
  if (p1_on_s2 && p2_on_s2) return true;
  // If both endpoints of s2 are on s1, s2 is a subset of s1
  if (p3_on_s1 && p4_on_s1) return true;
  
  // Partial overlap: must share at least one endpoint on the other segment 
  // AND NOT just at a single vertex point sharing.
  // Actually, if they are parallel and collinear, sharing one internal point is enough.
  // We can check if midpoints are on the other segment.
  const mid1 = { x: (s1.p1.x + s1.p2.x) / 2, y: (s1.p1.y + s1.p2.y) / 2 };
  const mid2 = { x: (s2.p1.x + s2.p2.x) / 2, y: (s2.p1.y + s2.p2.y) / 2 };
  
  if (getDistanceToSegment(mid1, s2.p1, s2.p2).distance < EPSILON) return true;
  if (getDistanceToSegment(mid2, s1.p1, s1.p2).distance < EPSILON) return true;

  return false;
};

/**
 * Derives normalized wall records from rooms and a constant wall thickness.
 * 
 * Invariants:
 * - Room points are treated as the interior polygon.
 * - Walls are extruded outwards using the polygon's outward normal.
 * - Shared walls are detected and linked via sharedWallId.
 */
export const derivePlanSnapshot = (rooms: RoomObject[], wallThickness: number, pixelsPerCm: number = 20): PlanSnapshot => {
  const roomSegments = rooms.map(room => {
    const points = getRoomVertices(room);
    if (points.length < 2) {
      return { room, points, count: 0, segments: [] };
    }
    const count = room.isClosed ? points.length : points.length - 1;
    const segments = [];
    for (let i = 0; i < count; i++) {
       segments.push({
         roomId: room.id,
         segmentIndex: i,
         p1: points[i],
         p2: points[(i + 1) % points.length]
       });
    }
    return { room, points, count, segments };
  });

  const sharedWalls: SharedWall[] = [];
  const sharedIdMap = new Map<string, string>(); // roomId-segmentIndex -> sharedId

  for (let i = 0; i < roomSegments.length; i++) {
    const r1 = roomSegments[i];
    for (let j = i + 1; j < roomSegments.length; j++) {
      const r2 = roomSegments[j];
      
      for (const s1 of r1.segments) {
        if (sharedIdMap.has(`${r1.room.id}-${s1.segmentIndex}`)) continue;
        
        for (const s2 of r2.segments) {
          if (sharedIdMap.has(`${r2.room.id}-${s2.segmentIndex}`)) continue;

          if (areSegmentsShared(s1, s2)) {
             const sharedId = `sw-${r1.room.id}-${s1.segmentIndex}-${r2.room.id}-${s2.segmentIndex}`;
             sharedIdMap.set(`${r1.room.id}-${s1.segmentIndex}`, sharedId);
             sharedIdMap.set(`${r2.room.id}-${s2.segmentIndex}`, sharedId);
             
             sharedWalls.push({
               id: sharedId,
               segments: [
                 { roomId: r1.room.id, segmentIndex: s1.segmentIndex },
                 { roomId: r2.room.id, segmentIndex: s2.segmentIndex }
               ]
             });
             break;
          }
        }
      }
    }
  }

  const walls: WallGeometry[] = [];
  
  for (const { room, points, count } of roomSegments) {
     if (count < 1) continue;
     
     const thicknesses = new Array(count).fill(0).map((_, i) => {
        const isShared = sharedIdMap.has(`${room.id}-${i}`);
        return isShared ? (wallThickness * pixelsPerCm) / 2 : wallThickness * pixelsPerCm;
     });
     
     const outerPoints = offsetPoints(points, thicknesses, room.isClosed);
     
     for (let i = 0; i < count; i++) {
       const p1 = points[i];
       const p2 = points[(i + 1) % points.length];
       const op1 = outerPoints[i];
       const op2 = outerPoints[(i + 1) % points.length];
       const normal = getOutwardNormal(points, i);
       
       const sharedId = sharedIdMap.get(`${room.id}-${i}`);

       walls.push({
         id: `${room.id}-wall-${i}`,
         roomId: room.id,
         segmentIndex: i,
         referenceSegment: { p1, p2 },
         interiorFace: { p1, p2 },
         exteriorFace: { p1: op1, p2: op2 },
         wallBandPolygon: [p1, p2, op2, op1],
         normal,
         thickness: wallThickness,
         sharedWallId: sharedId,
         isInternal: room.internalWalls?.[i]
       });
     }
  }

  return {
    walls,
    sharedWalls,
    generatedAt: Date.now(),
  };
};
