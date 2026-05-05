import { Vector2d, WallAttachment, PlanSnapshot, WallGeometry } from '../../types';
import { getDistance } from './mathUtils';

export interface AttachmentTransform {
  position: Vector2d;
  rotation: number;
  normal: Vector2d;
  interiorPoint: Vector2d;
  exteriorPoint: Vector2d;
}

/**
 * Calculates the transform for a wall attachment using a pre-calculated PlanSnapshot.
 */
export const getAttachmentTransform = (
  attachment: WallAttachment,
  snapshot: PlanSnapshot
): AttachmentTransform | null => {
  const wall = snapshot.walls.find(
    (w) => w.roomId === attachment.roomId && w.segmentIndex === attachment.wallSegmentIndex
  );
  if (!wall) return null;

  const t = attachment.positionAlongWall;

  const interiorPoint = {
    x: wall.interiorFace.p1.x + (wall.interiorFace.p2.x - wall.interiorFace.p1.x) * t,
    y: wall.interiorFace.p1.y + (wall.interiorFace.p2.y - wall.interiorFace.p1.y) * t,
  };

  const exteriorPoint = {
    x: wall.exteriorFace.p1.x + (wall.exteriorFace.p2.x - wall.exteriorFace.p1.x) * t,
    y: wall.exteriorFace.p1.y + (wall.exteriorFace.p2.y - wall.exteriorFace.p1.y) * t,
  };

  const { p1, p2 } = wall.referenceSegment;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const position = attachment.flipY ? interiorPoint : exteriorPoint;

  return {
    position,
    rotation: angle,
    normal: wall.normal,
    interiorPoint,
    exteriorPoint,
  };
};

/**
 * Finds the nearest wall segment for placing an attachment using the geometry snapshot.
 */
export const resolveNearestWall = (
  point: Vector2d,
  snapshot: PlanSnapshot,
  threshold: number
): { roomId: string; wallSegmentIndex: number; positionAlongWall: number; wall: WallGeometry } | null => {
  let nearest = null;
  let minDist = threshold;

  for (const wall of snapshot.walls) {
    const faces = [wall.interiorFace, wall.exteriorFace];
    for (const face of faces) {
      const { p1, p2 } = face;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const l2 = dx * dx + dy * dy;
      if (l2 === 0) continue;

      let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / l2;
      t = Math.max(0, Math.min(1, t));

      const projection = {
        x: p1.x + t * dx,
        y: p1.y + t * dy,
      };

      const d = getDistance(point, projection);
      if (d < minDist) {
        minDist = d;
        nearest = {
          roomId: wall.roomId,
          wallSegmentIndex: wall.segmentIndex,
          positionAlongWall: t,
          wall,
        };
      }
    }
  }

  return nearest;
};
