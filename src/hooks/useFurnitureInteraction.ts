import { useState, useMemo } from 'react';
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
  isPointInPolygon,
  getSnappedFurniturePosition,
  derivePlanSnapshot
} from '../lib/geometry';
import { getRoomVertices } from '../lib/geometry/topology';

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
  const wallThickness = useStore(state => state.wallThickness);
  const planSnapshot = useMemo(() => derivePlanSnapshot(rooms, wallThickness, pixelsPerCm), [rooms, wallThickness, pixelsPerCm]);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const w = shape.width;
    const h = shape.height;
    const rotation = node.rotation();
    const snapThreshold = 15 / scale;
    const { snapToObjects, isAltPressed } = useStore.getState();
    
    if (!snapToObjects || isAltPressed) {
      console.log(`[useFurnitureInteraction] No snapping. pos=(${x.toFixed(1)}, ${y.toFixed(1)})`);
      node.x(x);
      node.y(y);
      setDragDistances([]);
      setIsColliding(false);
      return;
    }

    // Use unified snapping logic
    const snappedPos = getSnappedFurniturePosition(
      { x, y },
      w,
      h,
      rotation,
      rooms,
      allFurniture,
      snapThreshold,
      shape.id,
      planSnapshot
    );

    const currentX = snappedPos.x;
    const currentY = snappedPos.y;

    if (currentX !== x || currentY !== y) {
      console.log(`[useFurnitureInteraction] Snapped from (${x.toFixed(1)}, ${y.toFixed(1)}) to (${currentX.toFixed(1)}, ${currentY.toFixed(1)})`);
    }

    node.x(currentX);
    node.y(currentY);

    if (snappedPos.suggestedRotation !== undefined) {
      node.rotation(snappedPos.suggestedRotation);
    }

    const currentRotation = node.rotation();
    const finalPivot = { x: currentX, y: currentY };
    const finalSides = [
      rotatePoint({ x: currentX, y: currentY - h / 2 }, finalPivot, currentRotation),
      rotatePoint({ x: currentX, y: currentY + h / 2 }, finalPivot, currentRotation),
      rotatePoint({ x: currentX - w / 2, y: currentY }, finalPivot, currentRotation),
      rotatePoint({ x: currentX + w / 2, y: currentY }, finalPivot, currentRotation),
    ];

    const newDistances: { p1: Vector2d, p2: Vector2d, dist: number }[] = [];
    finalSides.forEach(side => {
      let minFaceDist = Infinity;
      let nearestPointOnFace = side;

      planSnapshot.walls.forEach(wall => {
        const result = getDistanceToSegment(side, wall.interiorFace.p1, wall.interiorFace.p2);
        if (typeof result === 'object') {
          const distToFace = result.distance;
          if (distToFace < minFaceDist) {
            minFaceDist = distToFace;
            nearestPointOnFace = result.point;
          }
        }
      });

      allFurniture.forEach(other => {
        if (other.id === shape.id) return;
        const otherVertices = getFurnitureVertices(other);
        for (let i = 0; i < otherVertices.length; i++) {
          const v1 = otherVertices[i];
          const v2 = otherVertices[(i + 1) % otherVertices.length];
          const result = getDistanceToSegment(side, v1, v2);
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

      // Wall collision (respecting wall thickness)
      if (!colliding) {
        for (const wall of planSnapshot.walls) {
          if (checkCirclePolygonIntersect(center, radius - collisionEpsilon, wall.wallBandPolygon)) {
            colliding = true;
            break;
          }
        }
      }

      // Boundary check: must be inside a room
      if (!colliding) {
        let insideAnyRoom = false;
        for (const room of rooms) {
          const points = getRoomVertices(room);
          if (isPointInPolygon(center, points)) {
            insideAnyRoom = true;
            break;
          }
        }
        if (!insideAnyRoom) colliding = true;
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

      // Wall collision (respecting wall thickness)
      if (!colliding) {
        for (const wall of planSnapshot.walls) {
          if (checkPolygonsIntersect(currentVertices, wall.wallBandPolygon)) {
            colliding = true;
            break;
          }
        }
      }

      // Boundary check: must be inside a room
      if (!colliding) {
        for (const vertex of currentVertices) {
          let vertexInside = false;
          for (const room of rooms) {
            const points = getRoomVertices(room);
            if (isPointInPolygon(vertex, points)) {
              vertexInside = true;
              break;
            }
          }
          if (!vertexInside) {
            colliding = true;
            break;
          }
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
