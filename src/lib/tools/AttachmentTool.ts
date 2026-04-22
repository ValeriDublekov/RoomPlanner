import { ToolHandler } from './types';
import { getDistance } from '../geometry';

export const AttachmentTool: ToolHandler = {
  onClick: (e, { state, getSnappedMousePos, scale }) => {
    const relPos = getSnappedMousePos();
    const { rooms, addWallAttachment, setMode, mode } = state;
    
    let nearestWall = null;
    let minDist = 20 / scale;

    for (const room of rooms) {
      for (let i = 0; i < room.points.length; i++) {
        const p1 = room.points[i];
        const p2 = room.points[(i + 1) % room.points.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) continue;
        
        let t = ((relPos.x - p1.x) * dx + (relPos.y - p1.y) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        
        const projection = { x: p1.x + t * dx, y: p1.y + t * dy };
        const d = getDistance(relPos, projection);
        
        if (d < minDist) {
          minDist = d;
          nearestWall = { roomId: room.id, wallSegmentIndex: i, positionAlongWall: t };
        }
      }
    }

    if (nearestWall) {
      addWallAttachment({
        type: mode === 'add-door' ? 'door' : 'window',
        roomId: nearestWall.roomId,
        wallSegmentIndex: nearestWall.wallSegmentIndex,
        positionAlongWall: nearestWall.positionAlongWall,
        width: 80
      });
      setMode('select');
    }
  }
};
