import { ToolHandler } from './types';
import { getDistance, getDetailedSnappedPosition, derivePlanSnapshot } from '../geometry';

export const DrawTool: ToolHandler = {
  onClick: (e, { state, getSnappedMousePos, scale }) => {
    const { rooms, furniture, roomPoints, roomPointsSnaps, addRoomPoint, closeRoom, closeRoomWithWall, wallThickness, pixelsPerCm } = state;
    
    // Use the snapped position which respects ortho and grid settings
    const snappedPos = getSnappedMousePos();

    // Calculate snapped position manually to get metadata (snappedWall)
    const planSnapshot = derivePlanSnapshot(rooms, wallThickness, pixelsPerCm);
    const snapResult = getDetailedSnappedPosition(
      snappedPos, // Pass the already snapped position to find the associated wall
      rooms,
      furniture,
      10 / scale,
      null, null,
      roomPoints.length > 0 ? roomPoints[roomPoints.length - 1] : null,
      planSnapshot
    );

    const relPos = snapResult.point;
    const snap = snapResult.snappedWall;

    // 1. Classic closing (near first point)
    if (roomPoints.length >= 3) {
      const threshold = 15 / scale;
      if (getDistance(relPos, roomPoints[0]) < threshold) {
        closeRoom();
        return;
      }
    }

    // 2. Wall-to-wall closing
    // If we start on a wall and end on a wall of the SAME room, close it.
    if (roomPoints.length >= 1 && roomPointsSnaps[0] && snap && snap.roomId === roomPointsSnaps[0].roomId) {
      // Only close if we have at least one intermediate point or if the user clicks a different segment
      // To keep it simple: if you started on a wall and click on a wall again, we try to close.
      // But we need at least 3 points total for a polygon.
      // Drawn points: P1 (on wall), [P2...], PN (on wall).
      // Total points will be P1, [P2...], PN + [Path back to P1].
      closeRoomWithWall(snap);
      return;
    }

    addRoomPoint(relPos, snap);
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
