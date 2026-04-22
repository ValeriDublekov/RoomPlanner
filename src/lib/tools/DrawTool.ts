import { ToolHandler } from './types';
import { getDistance } from '../geometry';

export const DrawTool: ToolHandler = {
  onClick: (e, { state, getSnappedMousePos, scale }) => {
    const relPos = getSnappedMousePos();
    const { roomPoints, addRoomPoint, closeRoom } = state;

    if (roomPoints.length >= 3) {
      const threshold = 15 / scale;
      if (getDistance(relPos, roomPoints[0]) < threshold) {
        closeRoom();
        return;
      }
    }
    addRoomPoint(relPos);
  }
};
