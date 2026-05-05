import { Vector2d, RoomObject } from '../../types';
import { getOutwardNormal } from './polygonUtils';

/**
 * Representation of the room topology graph.
 */
export interface TopologyGraph {
  vertices: Record<string, { id: string; position: Vector2d }>;
  edges: { id: string; p1: string; p2: string; roomId: string }[];
}

/**
 * Builds a topology graph from a room.
 */
export const buildTopologyGraph = (room: RoomObject): TopologyGraph => {
  const vertices: Record<string, { id: string; position: Vector2d }> = {};
  (room.vertices || []).forEach(v => {
    vertices[v.id] = { id: v.id, position: { x: v.x, y: v.y } };
  });

  return {
    vertices,
    edges: (room.edges || []).map(e => ({
      id: e.id,
      p1: e.startVertexId,
      p2: e.endVertexId,
      roomId: room.id,
    })),
  };
};

/**
 * Reconstruction of the ordered list of points (Vector2d) from topological definitions (vertices and edges).
 */
export const getVerticesFromTopology = (room: RoomObject): Vector2d[] => {
  if (!room.vertices) return [];
  const vertexMap = new Map(room.vertices.map(v => [v.id, v]));
  const orderedIds = getOrderedVertexIds(room);
  
  const orderedPoints: Vector2d[] = [];
  for (const id of orderedIds) {
    const vertex = vertexMap.get(id);
    if (vertex) {
      orderedPoints.push({ x: vertex.x, y: vertex.y });
    }
  }

  return orderedPoints;
};

/**
 * Returns the ordered list of vertex IDs based on the topology graph.
 */
export const getOrderedVertexIds = (room: RoomObject): string[] => {
  if (!room.edges || !room.vertices || room.vertices.length === 0) return [];
  
  const nextVertexMap = new Map<string, string>();
  const hasIncoming = new Set<string>();
  
  for (const edge of room.edges) {
    nextVertexMap.set(edge.startVertexId, edge.endVertexId);
    hasIncoming.add(edge.endVertexId);
  }

  // Use explicit startVertexId if provided, otherwise try to find a topological start (for open chains)
  let startId = room.startVertexId;
  
  if (!startId) {
    if (!room.isClosed) {
      const startCandidate = room.vertices.find(v => !hasIncoming.has(v.id));
      if (startCandidate) {
        startId = startCandidate.id;
      }
    }
  }

  // Fallback to first vertex if still no startId
  if (!startId) {
    startId = room.vertices[0].id;
  }

  const orderedIds: string[] = [];
  const visited = new Set<string>();
  
  let currentId: string | undefined = startId;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    orderedIds.push(currentId);
    currentId = nextVertexMap.get(currentId);
    if (currentId === startId) break;
  }
  return orderedIds;
};

/**
 * Abstraction to access a room's defining vertices.
 * Resolves properties via topological traversal.
 */
export const getRoomVertices = (room: RoomObject): Vector2d[] => {
  return getVerticesFromTopology(room);
};

export interface WallSnap {
  roomId: string;
  segmentIndex: number;
  t: number;
}

export const getWallPath = (
  room: RoomObject,
  fromSnap: WallSnap,
  toSnap: WallSnap
): Vector2d[] => {
  if (fromSnap.roomId !== toSnap.roomId) return [];

  const points = getRoomVertices(room);
  const n = points.length;
  const path: Vector2d[] = [];

  if (fromSnap.segmentIndex === toSnap.segmentIndex && fromSnap.t <= toSnap.t) {
    return [];
  }

  let currIdx = (fromSnap.segmentIndex + 1) % n;
  const targetIdx = (toSnap.segmentIndex + 1) % n;

  path.push(points[currIdx]);
  currIdx = (currIdx + 1) % n;
  
  while (currIdx !== targetIdx) {
    path.push(points[currIdx]);
    currIdx = (currIdx + 1) % n;
  }

  return path;
};

export interface SplitResult {
  room1Points: Vector2d[];
  room2Points: Vector2d[];
}

export const splitRoomPolygons = (
  room: RoomObject,
  drawnPoints: Vector2d[], // includes startPoint
  endPoint: Vector2d,
  startSnap: WallSnap,
  endSnap: WallSnap
): SplitResult => {
  const pathBA = getWallPath(room, endSnap, startSnap);
  const pathAB = getWallPath(room, startSnap, endSnap);

  const room1Points = [...drawnPoints, endPoint, ...pathBA];
  const room2Points = [endPoint, ...[...drawnPoints].reverse(), ...pathAB];

  return { room1Points, room2Points };
};

export const isInteriorSplit = (
  room: RoomObject,
  drawnPoints: Vector2d[],
  endPoint: Vector2d,
  startSnap: WallSnap
): boolean => {
  if (drawnPoints.length < 1) return false;
  
  const startPoint = drawnPoints[0];
  const nextPoint = drawnPoints.length > 1 ? drawnPoints[1] : endPoint;
  
  const normal = getOutwardNormal(getRoomVertices(room), startSnap.segmentIndex);
  const drawnVec = {
    x: nextPoint.x - startPoint.x,
    y: nextPoint.y - startPoint.y
  };
  
  const dot = drawnVec.x * normal.x + drawnVec.y * normal.y;
  
  return dot < 0;
};
