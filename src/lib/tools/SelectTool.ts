import { ToolHandler } from './types';

export const SelectTool: ToolHandler = {
  onClick: (e, { state }) => {
    if (e.target === e.target.getStage()) {
      console.log('SelectTool: stage clicked, resetting selection.');
      state.setSelectedId(null);
      state.setSelectedRoomId(null);
      state.setSelectedWallIndex(null);
      state.setSelectedDimensionId(null);
      state.setSelectedAttachmentId(null);
      state.setSelectedBeamId(null);
      state.setSelectedIds([]);
    } else {
      console.log('SelectTool: object clicked, target:', e.target.name() || e.target.id() || 'unnamed');
    }
  }
};
