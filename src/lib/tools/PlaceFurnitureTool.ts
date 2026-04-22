import { ToolHandler } from './types';

export const PlaceFurnitureTool: ToolHandler = {
  onClick: (e, { state, getSnappedMousePos }) => {
    const pending = state.pendingFurniture;
    const relPos = getSnappedMousePos();
    if (pending) {
      state.addFurniture({
        ...pending,
        x: relPos.x - pending.width / 2,
        y: relPos.y - pending.height / 2,
      });
      state.setPendingFurniture(null);
      state.setMode('select');
    }
  }
};
