import { Vector2d, EdgeMap, PlanSnapshot, RoomObject } from '../../types';
import { getDistance, getDistanceToSegment, rotatePoint } from './mathUtils';
import { getFurnitureVertices } from './polygonUtils';
import { buildTopologyGraph } from './topology';

/**
 * Unique key for a point to deduplicate vertices.
 */
const getPointKey = (p: Vector2d) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`;

/**
 * Canonical key for a segment to handle shared boundaries.
 */
const getSegmentKey = (p1: Vector2d, p2: Vector2d) => {
  const x1 = Number(p1.x.toFixed(3));
  const y1 = Number(p1.y.toFixed(3));
  const x2 = Number(p2.x.toFixed(3));
  const y2 = Number(p2.y.toFixed(3));
  
  if (x1 < x2 || (x1 === x2 && y1 < y2)) {
    return `${x1},${y1}_${x2},${y2}`;
  }
  return `${x2},${y2}_${x1},${y1}`;
};

export interface SnapResult {
  point: Vector2d;
  minDist: number;
  snappedWall?: {
    roomId: string;
    segmentIndex: number;
    t: number;
  };
}

/**
 * Finds the nearest vertex (corner) or edge within a threshold and returns detailed metadata.
 */
export const getDetailedSnappedPosition = (
  pos: Vector2d,
  rooms: RoomObject[],
  furniture: { x: number; y: number; width: number; height: number; rotation: number }[],
  threshold: number,
  edgeMap: EdgeMap | null = null,
  bgTransform: { x: number, y: number, scale: number, rotation: number } | null = null,
  lastPoint: Vector2d | null = null,
  planSnapshot: PlanSnapshot | null = null
): SnapResult => {
  let nearest = { ...pos };
  let minDist = threshold;
  let snappedWall: SnapResult['snappedWall'] = undefined;

  // 1. Vector Snapping
  if (planSnapshot) {
    // Vertex Snapping
    for (const wall of planSnapshot.walls) {
      for (const face of [wall.interiorFace, wall.exteriorFace]) {
        const ip1 = face.p1;
        const ip2 = face.p2;
        
        const d1 = getDistance(pos, ip1);
        if (d1 < minDist) {
          minDist = d1;
          nearest = { ...ip1 };
          snappedWall = { roomId: wall.roomId, segmentIndex: wall.segmentIndex, t: 0 };
        }
        const d2 = getDistance(pos, ip2);
        if (d2 < minDist) {
          minDist = d2;
          nearest = { ...ip2 };
          snappedWall = { roomId: wall.roomId, segmentIndex: wall.segmentIndex, t: 1 };
        }
      }
    }
    
    // Segment Snapping
    for (const wall of planSnapshot.walls) {
      for (const face of [wall.interiorFace, wall.exteriorFace]) {
        const result = getDistanceToSegment(pos, face.p1, face.p2);
        if (result.distance < minDist) {
          minDist = result.distance;
          nearest = result.point;
          
          const dx = face.p2.x - face.p1.x;
          const dy = face.p2.y - face.p1.y;
          const lenSq = dx * dx + dy * dy;
          let t = 0;
          if (lenSq > 0) {
            t = ((nearest.x - face.p1.x) * dx + (nearest.y - face.p1.y) * dy) / lenSq;
          }
          snappedWall = { roomId: wall.roomId, segmentIndex: wall.segmentIndex, t: Math.max(0, Math.min(1, t)) };
        }
      }
    }
  } else {
    // Topology Snapping (no planSnapshot)
    for (const room of rooms) {
      const graph = buildTopologyGraph(room);
      graph.edges.forEach((edge, i) => {
        const p1 = graph.vertices[edge.p1].position;
        const p2 = graph.vertices[edge.p2].position;
        
        const d1 = getDistance(pos, p1);
        if (d1 < minDist) {
          minDist = d1;
          nearest = { ...p1 };
          snappedWall = { roomId: room.id, segmentIndex: i, t: 0 };
        }

        const result = getDistanceToSegment(pos, p1, p2);
        if (result.distance < minDist) {
          minDist = result.distance;
          nearest = result.point;
          
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const lenSq = dx * dx + dy * dy;
          let t = 0;
          if (lenSq > 0) {
            t = ((nearest.x - p1.x) * dx + (nearest.y - p1.y) * dy) / lenSq;
          }
          snappedWall = { roomId: room.id, segmentIndex: i, t: Math.max(0, Math.min(1, t)) };
        }
      });
    }
  }

  for (const f of furniture) {
    const vertices = getFurnitureVertices(f); 
    for (const v of vertices) {
      const d = getDistance(pos, v);
      if (d < minDist) {
        minDist = d;
        nearest = { ...v };
        snappedWall = undefined; // Snap to furniture resets wall snap
      }
    }
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const result = getDistanceToSegment(pos, v1, v2);
      if (result.distance < minDist) {
        minDist = result.distance;
        nearest = result.point;
        snappedWall = undefined;
      }
    }
  }

  // 2. Image Snapping
  if (minDist === threshold && edgeMap && bgTransform) {
    // ... we don't return snappedWall for image snapping
    const radius = Math.max(8, threshold / bgTransform.scale);
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
            const junctionBonus = (neighbors > 2 || neighbors === 1) ? 3.0 : 0.0;
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
                if (dot > 0.98) directionBonus = 2.0;
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
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      nearest = { 
        x: bgTransform.x + (bestImgX * cosR - bestImgY * sinR) * bgTransform.scale, 
        y: bgTransform.y + (bestImgX * sinR + bestImgY * cosR) * bgTransform.scale 
      };
    }
  }

  return { point: nearest, minDist, snappedWall };
};

/**
 * Finds the nearest vertex (corner) or edge within a threshold.
 */
export const getSnappedPosition = (
  pos: Vector2d,
  rooms: RoomObject[],
  furniture: { x: number; y: number; width: number; height: number; rotation: number }[],
  threshold: number,
  edgeMap: EdgeMap | null = null,
  bgTransform: { x: number, y: number, scale: number, rotation: number } | null = null,
  lastPoint: Vector2d | null = null,
  planSnapshot: PlanSnapshot | null = null
): Vector2d => {
  return getDetailedSnappedPosition(pos, rooms as any, furniture, threshold, edgeMap, bgTransform, lastPoint, planSnapshot).point;
};

/**
 * Snaps a furniture-like rectangle (center-based) to walls and other furniture.
 */
export const getSnappedFurniturePosition = (
  centerPos: Vector2d,
  width: number,
  height: number,
  rotation: number,
  rooms: RoomObject[],
  furniture: { id: string, x: number; y: number; width: number; height: number; rotation: number }[],
  threshold: number,
  ignoredId?: string,
  planSnapshot: PlanSnapshot | null = null
): Vector2d & { suggestedRotation?: number } => {
  const currentPos = { ...centerPos };
  const snappedTargetIds = new Set<string>();
  let resultRotation = rotation;
  let hasAutoRotated = false;

  for (let pass = 0; pass < 2; pass++) {
    let bestSnap = null;
    let minSnapDist = Infinity;
    
    const sides = [
      rotatePoint({ x: 0, y: -height / 2 }, { x: 0, y: 0 }, resultRotation), // 0: Top
      rotatePoint({ x: 0, y: height / 2 }, { x: 0, y: 0 }, resultRotation),  // 1: Bottom (Front)
      rotatePoint({ x: -width / 2, y: 0 }, { x: 0, y: 0 }, resultRotation), // 2: Left
      rotatePoint({ x: width / 2, y: 0 }, { x: 0, y: 0 }, resultRotation),  // 3: Right
    ];

    const worldSides = sides.map(s => ({ x: s.x + currentPos.x, y: s.y + currentPos.y }));

    for (let sideIndex = 0; sideIndex < worldSides.length; sideIndex++) {
      const side = worldSides[sideIndex];
      
      // Wall Snapping
      if (planSnapshot) {
        for (const wall of planSnapshot.walls) {
          if (snappedTargetIds.has(wall.id)) continue;
          
          for (const face of [wall.interiorFace, wall.exteriorFace]) {
            const result = getDistanceToSegment(side, face.p1, face.p2);
            if (result.distance < threshold && result.distance < minSnapDist) {
              minSnapDist = result.distance;
              bestSnap = {
                offsetX: result.point.x - side.x,
                offsetY: result.point.y - side.y,
                targetId: wall.id,
                sideIndex: sideIndex,
                isWall: true
              };
            }
          }
        }
      } else {
        // Topology Snapping
        for (const room of rooms) {
          const graph = buildTopologyGraph(room);
          for (let i = 0; i < graph.edges.length; i++) {
            const edge = graph.edges[i];
            const wallId = edge.id;
            if (snappedTargetIds.has(wallId)) continue;

            const p1 = graph.vertices[edge.p1].position;
            const p2 = graph.vertices[edge.p2].position;
            const result = getDistanceToSegment(side, p1, p2);
            
            if (result.distance < threshold && result.distance < minSnapDist) {
              minSnapDist = result.distance;
              bestSnap = {
                offsetX: result.point.x - side.x,
                offsetY: result.point.y - side.y,
                targetId: wallId,
                sideIndex: sideIndex,
                isWall: true
              };
            }
          }
        }
      }

      // Furniture Snapping
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
              targetId: targetId,
              sideIndex: sideIndex,
              isWall: false
            };
          }
        }
      }
    }

    if (bestSnap) {
      currentPos.x += bestSnap.offsetX;
      currentPos.y += bestSnap.offsetY;
      snappedTargetIds.add(bestSnap.targetId);

      // Auto-rotate logic: if the front (index 1) snaps to a wall, flip 180 degrees
      if (bestSnap.sideIndex === 1 && bestSnap.isWall && !hasAutoRotated) {
        resultRotation = (resultRotation + 180) % 360;
        hasAutoRotated = true;
        // After rotation, we might want to re-snap in the next pass with the new rotation
      }
    } else {
      break;
    }
  }

  return {
    ...currentPos,
    suggestedRotation: hasAutoRotated ? resultRotation : undefined
  };
};
