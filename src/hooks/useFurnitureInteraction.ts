import { useState } from 'react';
import Konva from 'konva';
import { FurnitureObject, RoomObject, Vector2d } from '../types';
import { useStore } from '../store';
import { 
  getDistance,
  getDistanceToSegment, 
  getFurnitureVertices, 
  rotatePoint,
  checkPolygonsIntersect, 
  checkCirclePolygonIntersect,
  isPointInPolygon
} from '../lib/geometry';

export const useFurnitureInteraction = (
  shape: FurnitureObject,
  rooms: RoomObject[],
  allFurniture: FurnitureObject[],
  pixelsPerCm: number,
  scale: number,
  onChange: (newAttrs: Partial<FurnitureObject>) => void
) => {
  const [dragDistances, setDragDistances] = useState<{ p1: Vector2d, p2: Vector2d, dist: number }[]>([]);
  const [isColliding, setIsColliding] = useState(false);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!rooms.length) return;

    const node = e.target;
    const x = node.x();
    const y = node.y();
    const w = shape.width;
    const h = shape.height;
    const rotation = node.rotation();
    const snapThreshold = 15 / scale;
    
    let currentX = x;
    let currentY = y;
    let snappedWallIds = new Set<string>();

    for (let pass = 0; pass < 2; pass++) {
      let bestSnap = null;
      let minSnapDist = Infinity;
      let pointsToSnap: Vector2d[] = [];
      
      if (shape.type === 'group' && shape.children) {
        shape.children.forEach(child => {
          const cw = child.width;
          const ch = child.height;
          // child.x/y are relative to group top-left (0,0)
          // Group center is at (w/2, h/2)
          const cx = child.x - w / 2;
          const cy = child.y - h / 2;
          const midpoints = [
            { x: cx + cw / 2, y: cy },
            { x: cx + cw / 2, y: cy + ch },
            { x: cx, y: cy + ch / 2 },
            { x: cx + cw, y: cy + ch / 2 },
          ];
          midpoints.forEach(p => {
            pointsToSnap.push(rotatePoint(p, { x: 0, y: 0 }, rotation));
          });
        });
        const groupMidpoints = [
          { x: 0, y: -h / 2 },
          { x: 0, y: h / 2 },
          { x: -w / 2, y: 0 },
          { x: w / 2, y: 0 },
        ];
        groupMidpoints.forEach(p => {
          pointsToSnap.push(rotatePoint(p, { x: 0, y: 0 }, rotation));
        });
      } else {
        pointsToSnap = [
          rotatePoint({ x: 0, y: -h / 2 }, { x: 0, y: 0 }, rotation),
          rotatePoint({ x: 0, y: h / 2 }, { x: 0, y: 0 }, rotation),
          rotatePoint({ x: -w / 2, y: 0 }, { x: 0, y: 0 }, rotation),
          rotatePoint({ x: w / 2, y: 0 }, { x: 0, y: 0 }, rotation),
        ];
      }

      const worldPoints = pointsToSnap.map(p => ({ x: p.x + currentX, y: p.y + currentY }));

      for (const side of worldPoints) {
        for (const room of rooms) {
          const isInside = isPointInPolygon(side, room.points);
          if (!isInside) continue;

          for (let i = 0; i < room.points.length; i++) {
            const wallId = `${room.id}-${i}`;
            if (snappedWallIds.has(wallId)) continue;

            const p1 = room.points[i];
            const p2 = room.points[(i + 1) % room.points.length];
            const result = getDistanceToSegment(side, p1, p2);
            
            if (typeof result === 'object') {
              const distToFace = result.distance;
              if (distToFace < snapThreshold && distToFace < minSnapDist) {
                minSnapDist = distToFace;
                bestSnap = {
                  offsetX: result.point.x - side.x,
                  offsetY: result.point.y - side.y,
                  wallId
                };
              }
            }
          }
        }
      }

      if (bestSnap && !useStore.getState().isAltPressed) {
        currentX += bestSnap.offsetX;
        currentY += bestSnap.offsetY;
        snappedWallIds.add(bestSnap.wallId);
      } else {
        break;
      }
    }

    node.x(currentX);
    node.y(currentY);

    const finalPivot = { x: currentX, y: currentY };
    const finalSides = [
      rotatePoint({ x: currentX, y: currentY - h / 2 }, finalPivot, rotation),
      rotatePoint({ x: currentX, y: currentY + h / 2 }, finalPivot, rotation),
      rotatePoint({ x: currentX - w / 2, y: currentY }, finalPivot, rotation),
      rotatePoint({ x: currentX + w / 2, y: currentY }, finalPivot, rotation),
    ];

    const newDistances: { p1: Vector2d, p2: Vector2d, dist: number }[] = [];
    finalSides.forEach(side => {
      let minFaceDist = Infinity;
      let nearestPointOnFace = side;

      rooms.forEach(room => {
        for (let i = 0; i < room.points.length; i++) {
          const p1 = room.points[i];
          const p2 = room.points[(i + 1) % room.points.length];
          const result = getDistanceToSegment(side, p1, p2);
          if (typeof result === 'object') {
            const distToFace = result.distance;
            if (distToFace < minFaceDist) {
              minFaceDist = distToFace;
              nearestPointOnFace = result.point;
            }
          }
        }
      });

      if (minFaceDist < 200) {
        newDistances.push({ p1: side, p2: nearestPointOnFace, dist: minFaceDist });
      }
    });

    setDragDistances(newDistances);

    let colliding = false;
    const collisionEpsilon = 0.5;

    if (shape.type === 'circle') {
      const radius = Math.max(shape.width, shape.height) / 2;
      const center = { x: currentX, y: currentY };

      for (const other of allFurniture) {
        if (other.id === shape.id) continue;
        if (other.type === 'circle') {
          const otherRadius = Math.max(other.width, other.height) / 2;
          const otherCenter = { x: other.x + other.width / 2, y: other.y + other.height / 2 };
          if (getDistance(center, otherCenter) < (radius + otherRadius - collisionEpsilon)) {
            colliding = true;
            break;
          }
        } else {
          const otherVertices = getFurnitureVertices(other);
          if (checkCirclePolygonIntersect(center, radius - collisionEpsilon, otherVertices)) {
            colliding = true;
            break;
          }
        }
      }

      if (!colliding) {
        for (const room of rooms) {
          if (!isPointInPolygon(center, room.points)) {
            colliding = true;
            break;
          }
          for (let i = 0; i < room.points.length; i++) {
            const p1 = room.points[i];
            const p2 = room.points[(i + 1) % room.points.length];
            const result = getDistanceToSegment(center, p1, p2);
            if (typeof result === 'object' && result.distance < (radius - 1)) {
              colliding = true;
              break;
            }
          }
          if (colliding) break;
        }
      }
    } else {
      const currentVertices = getFurnitureVertices({
        x: currentX - shape.width / 2,
        y: currentY - shape.height / 2,
        width: shape.width,
        height: shape.height,
        rotation: rotation
      });

      for (const other of allFurniture) {
        if (other.id === shape.id) continue;
        if (other.type === 'circle') {
          const otherRadius = Math.max(other.width, other.height) / 2;
          const otherCenter = { x: other.x + other.width / 2, y: other.y + other.height / 2 };
          if (checkCirclePolygonIntersect(otherCenter, otherRadius - collisionEpsilon, currentVertices)) {
            colliding = true;
            break;
          }
        } else {
          const otherVertices = getFurnitureVertices(other);
          if (checkPolygonsIntersect(currentVertices, otherVertices)) {
            colliding = true;
            break;
          }
        }
      }

      if (!colliding) {
        for (const room of rooms) {
          for (const vertex of currentVertices) {
            if (!isPointInPolygon(vertex, room.points)) {
              colliding = true;
              break;
            }
          }
          if (colliding) break;
        }
      }
    }

    setIsColliding(colliding);
  };

  return {
    dragDistances,
    setDragDistances,
    isColliding,
    setIsColliding,
    handleDragMove
  };
};
