import { ToolHandler } from './types';

export const PrimitiveTool: ToolHandler = {
  onMouseDown: (e, { state, getSnappedMousePos }) => {
    state.addRoomPoint(getSnappedMousePos());
  },
  onMouseUp: (e, { state, getSnappedMousePos }) => {
    const { mode, roomPoints, addFurniture, setMode } = state;
    if (roomPoints.length === 1) {
      const start = roomPoints[0];
      const end = getSnappedMousePos();
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      
      if (width > 5 && height > 5) {
        addFurniture({
          type: mode === 'add-box' ? 'box' : 'circle',
          name: mode === 'add-box' ? 'New Box' : 'New Circle',
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width,
          height,
          rotation: 0
        });
        setMode('select');
      }
      state.clearRoomPoints();
    }
  },
  onClick: (e, { state, getSnappedMousePos }) => {
    const { mode, roomPoints, addFurniture, setMode, pixelsPerCm } = state;
    // If it was a quick click (no drag), add default sized box
    if (roomPoints.length === 0) {
      const relPos = getSnappedMousePos();
      const size = 50 * pixelsPerCm;
      addFurniture({
        type: mode === 'add-box' ? 'box' : 'circle',
        name: mode === 'add-box' ? 'New Box' : 'New Circle',
        x: relPos.x - size / 2,
        y: relPos.y - size / 2,
        width: size,
        height: size,
        rotation: 0
      });
      setMode('select');
    }
  }
};
