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
  },
  onSubmitDimension: ({ state, getSnappedMousePos }) => {
    const { dimensionInput, roomPoints, addRoomPoint, setDimensionInput, pixelsPerCm } = state;
    const cm = parseFloat(dimensionInput);
    if (isNaN(cm) || cm <= 0 || roomPoints.length === 0) return;
    
    const lastPoint = roomPoints[roomPoints.length - 1];
    const currentMouse = getSnappedMousePos(true);
    const dx = currentMouse.x - lastPoint.x;
    const dy = currentMouse.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    const targetPx = cm * pixelsPerCm;
    addRoomPoint({
      x: lastPoint.x + (dx / dist) * targetPx,
      y: lastPoint.y + (dy / dist) * targetPx,
    });
    setDimensionInput('');
  },
  onDblClick: (e, { state }) => {
    if (state.roomPoints.length >= 2) {
      state.finishRoom();
    }
  }
};
