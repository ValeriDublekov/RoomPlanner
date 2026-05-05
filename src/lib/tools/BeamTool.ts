import { ToolHandler } from './types';
import { getDistanceToSegment } from '../geometry/mathUtils';
import { RoomObject, Vector2d, BeamObject } from '../../types';
import { getRoomVertices } from '../geometry/topology';

interface ClosestPointResult {
  point: Vector2d;
  roomId: string;
  wallIndex: number;
  t: number;
}

const getClosestPointOnWall = (point: Vector2d, rooms: RoomObject[]): ClosestPointResult | null => {
  const threshold = 20; // snapping threshold in pixels
  let minDistance = Infinity;
  let bestResult: ClosestPointResult | null = null;

  for (const room of rooms) {
    const points = getRoomVertices(room);
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      if (!room.isClosed && i === points.length - 1) continue;
      
      const result = getDistanceToSegment(point, p1, p2);
      if (result.distance < minDistance && result.distance < threshold) {
        minDistance = result.distance;
        bestResult = {
          point: result.point,
          roomId: room.id,
          wallIndex: i,
          t: result.t
        };
      }
    }
  }
  return bestResult;
};

export const BeamTool: ToolHandler = {
  onClick: (e, { state, getSnappedMousePos }) => {
    const relPos = getSnappedMousePos();
    const { rooms, roomPoints, addRoomPoint, clearRoomPoints, addBeam, wallHeight, setSelectedBeamId } = state;

    const closest = getClosestPointOnWall(relPos, rooms);

    if (roomPoints.length === 0) {
      if (closest) {
        addRoomPoint(closest.point);
        // Store attachment meta in state if possible, or just use the point for now
        // and link on second click.
        (state as any)._beamStartAttachment = { roomId: closest.roomId, wallIndex: closest.wallIndex, t: closest.t };
      }
    } else {
      if (closest) {
        const startPoint = roomPoints[0];
        const startAttachment = (state as any)._beamStartAttachment;
        const newBeam: BeamObject = {
          id: Math.random().toString(36).substr(2, 9),
          p1: startPoint,
          p2: closest.point,
          width: 20, // default 20cm
          height: 40, // default 40cm
          elevation: wallHeight - 40, // default at top of wall
          color: '#e2e8f0',
          colorType: 'manual',
          alignment: 'center',
          p1Attachment: startAttachment,
          p2Attachment: { roomId: closest.roomId, wallIndex: closest.wallIndex, t: closest.t }
        };
        addBeam(newBeam);
        clearRoomPoints();
        (state as any)._beamStartAttachment = undefined;
        setSelectedBeamId(newBeam.id);
      }
    }
  },
  onMouseMove: (e, { state, getSnappedMousePos }) => {
    // Current implementation doesn't need much mouse move unless we want a preview
  },
  onMouseDown: (e, { state }) => {},
  onMouseUp: (e, { state }) => {},
  onDblClick: (e, { state }) => {
    state.clearRoomPoints();
  }
};
