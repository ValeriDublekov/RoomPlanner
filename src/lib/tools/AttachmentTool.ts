import { ToolHandler } from './types';
import { derivePlanSnapshot, resolveNearestWall } from '../geometry';

export const AttachmentTool: ToolHandler = {
  onClick: (e, { state, getSnappedMousePos, scale }) => {
    const relPos = getSnappedMousePos();
    const { rooms, wallThickness, pixelsPerCm, addWallAttachment, setMode, mode } = state;
    
    const snapshot = derivePlanSnapshot(rooms, wallThickness, pixelsPerCm);
    const nearest = resolveNearestWall(relPos, snapshot, 20 / scale);

    if (nearest) {
      addWallAttachment({
        type: mode === 'add-door' ? 'door' : 'window',
        roomId: nearest.roomId,
        wallSegmentIndex: nearest.wallSegmentIndex,
        positionAlongWall: nearest.positionAlongWall,
        width: 80
      });
      setMode('select');
    }
  }
};
